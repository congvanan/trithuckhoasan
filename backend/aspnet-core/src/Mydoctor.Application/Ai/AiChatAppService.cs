using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Mydoctor.Ai.Dtos;
using Mydoctor.Ai.Providers;
using Volo.Abp;
using Volo.Abp.Domain.Repositories;

namespace Mydoctor.Ai;

[AllowAnonymous]
public class AiChatAppService : MydoctorAppService, IAiChatAppService
{
    private readonly IRepository<AiConversation, Guid> _conversationRepository;
    private readonly IRepository<AiMessage, Guid> _messageRepository;
    private readonly IRepository<AiFeedback, Guid> _feedbackRepository;
    private readonly IRepository<AiChunk, Guid> _chunkRepository;
    private readonly IVectorStore _vectorStore;
    private readonly IAiProviderFactory _providerFactory;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<AiChatAppService> _logger;

    public AiChatAppService(
        IRepository<AiConversation, Guid> conversationRepository,
        IRepository<AiMessage, Guid> messageRepository,
        IRepository<AiFeedback, Guid> feedbackRepository,
        IRepository<AiChunk, Guid> chunkRepository,
        IVectorStore vectorStore,
        IAiProviderFactory providerFactory,
        IHttpContextAccessor httpContextAccessor,
        ILogger<AiChatAppService> logger)
    {
        _conversationRepository = conversationRepository;
        _messageRepository = messageRepository;
        _feedbackRepository = feedbackRepository;
        _chunkRepository = chunkRepository;
        _vectorStore = vectorStore;
        _providerFactory = providerFactory;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public async Task<AiAskResultDto> AskAsync(AiAskInput input)
    {
        var question = input.Question?.Trim();
        if (string.IsNullOrWhiteSpace(question))
            throw new BusinessException("Ai:Chat:EmptyQuestion");

        var sw = Stopwatch.StartNew();

        var topK = await GetIntSetting(AiSettings.TopK, AiConsts.DefaultTopK);
        var cacheEnabled = await GetBoolSetting(AiSettings.CacheEnabled, true);
        var cacheTtlDays = await GetIntSetting(AiSettings.CacheTtlDays, 7);
        var dailyAnonymousLimit = await GetIntSetting(AiSettings.DailyAnonymousLimit, 50);
        var dailyUserLimit = await GetIntSetting(AiSettings.DailyUserLimit, 200);
        var dailyTokenWarningLimit = await GetIntSetting(AiSettings.DailyTokenWarningLimit, 100000);
        var temperature = await GetDoubleSetting(AiSettings.Temperature, 0.2);
        var maxTokens = await GetIntSetting(AiSettings.MaxOutputTokens, 2048);
        var llmProvider = await SettingProvider.GetOrNullAsync(AiSettings.LlmProvider) ?? AiModelDefaults.GeminiProvider;
        var llmModel = AiModelDefaults.NormalizeLlmModel(
            llmProvider,
            await SettingProvider.GetOrNullAsync(AiSettings.LlmModel));
        var embeddingProvider = await SettingProvider.GetOrNullAsync(AiSettings.EmbeddingProvider) ?? AiModelDefaults.GeminiProvider;
        var embedModel = AiModelDefaults.NormalizeEmbeddingModel(
            embeddingProvider,
            await SettingProvider.GetOrNullAsync(AiSettings.EmbeddingModel));
        var systemPrompt = (await SettingProvider.GetOrNullAsync(AiSettings.SystemPrompt))
                           ?? AiSettings.DefaultSystemPrompt;
        var fallbackAnswer = (await SettingProvider.GetOrNullAsync(AiSettings.FallbackAnswer))
                             ?? AiSettings.DefaultFallbackAnswer;
        var fallbackProviders = await SettingProvider.GetOrNullAsync(AiSettings.FallbackLlmProviders);

        var conversation = await GetOrCreateConversationAsync(input);
        await EnforceDailyQuotaAsync(conversation, dailyAnonymousLimit, dailyUserLimit);

        var userMsg = new AiMessage(GuidGenerator.Create(), conversation.Id, AiMessageRole.User, question, tenantId: CurrentTenant.Id);
        await _messageRepository.InsertAsync(userMsg, autoSave: true);
        conversation.IncrementMessageCount();
        await _conversationRepository.UpdateAsync(conversation, autoSave: true);

        var hits = new List<VectorSearchHit>();
        string answer;
        bool usedFallback = false;
        int? tokensIn = null, tokensOut = null;
        string? effectiveLlmModel = llmModel;
        try
        {
            var cached = cacheEnabled ? await TryGetCachedAnswerAsync(question, cacheTtlDays) : null;
            if (cached != null)
            {
                answer = cached.Answer;
                hits = cached.Citations;
                effectiveLlmModel = "cache:" + (cached.LlmModel ?? llmModel);
                usedFallback = false;
            }
            else
            {
            var queryPlan = await BuildQueryPlanAsync(question);
            hits = await RetrieveHybridHitsAsync(queryPlan, embedModel, topK);

            if (hits.Count == 0)
            {
                var history = await GetRecentHistoryAsync(conversation.Id, maxMessages: 6, excludeMessageId: userMsg.Id);
                try
                {
                    var llmResponse = await GenerateWithFallbackProvidersAsync(
                        llmProvider,
                        fallbackProviders,
                        llmModel,
                        BuildNoContextFallbackSystemPrompt(systemPrompt),
                        history,
                        BuildNoContextFallbackPrompt(queryPlan, question),
                        temperature,
                        maxTokens);

                    answer = string.IsNullOrWhiteSpace(llmResponse.Text)
                        ? BuildSmartFallbackAnswer(queryPlan, fallbackAnswer)
                        : llmResponse.Text;
                    tokensIn = llmResponse.TokensIn;
                    tokensOut = llmResponse.TokensOut;
                    effectiveLlmModel = llmResponse.Model;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "AI no-context LLM fallback failed for conversation {ConvId}", conversation.Id);
                    answer = BuildSmartFallbackAnswer(queryPlan, fallbackAnswer);
                }
                usedFallback = true;
            }
            else
            {
                var (contextText, _) = BuildContext(hits);
                var history = await GetRecentHistoryAsync(conversation.Id, maxMessages: 6, excludeMessageId: userMsg.Id);

                var prompt = BuildAnswerPrompt(queryPlan, contextText, question);
                try
                {
                    var llmResponse = await GenerateWithFallbackProvidersAsync(
                        llmProvider,
                        fallbackProviders,
                        llmModel,
                        BuildNaturalAnswerSystemPrompt(systemPrompt),
                        history,
                        prompt,
                        temperature,
                        maxTokens);

                    answer = string.IsNullOrWhiteSpace(llmResponse.Text) ? BuildSmartFallbackAnswer(queryPlan, fallbackAnswer) : llmResponse.Text;
                    usedFallback = string.IsNullOrWhiteSpace(llmResponse.Text);
                    tokensIn = llmResponse.TokensIn;
                    tokensOut = llmResponse.TokensOut;
                    effectiveLlmModel = llmResponse.Model;
                    if (string.Equals(llmResponse.FinishReason, "MAX_TOKENS", StringComparison.OrdinalIgnoreCase))
                    {
                        _logger.LogWarning(
                            "AI LLM response stopped by max output tokens. ConversationId={ConversationId}, Model={Model}, MaxOutputTokens={MaxOutputTokens}, TokensOut={TokensOut}",
                            conversation.Id,
                            llmResponse.Model,
                            maxTokens,
                            llmResponse.TokensOut);
                    }
                }
                catch (BusinessException ex)
                {
                    _logger.LogWarning(ex, "AI LLM provider failed after retrieval; returning concise extractive RAG answer for conversation {ConvId}", conversation.Id);
                    answer = BuildExtractiveAnswer(hits, queryPlan);
                    usedFallback = true;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "AI LLM generation failed after retrieval; returning concise extractive RAG answer for conversation {ConvId}", conversation.Id);
                    answer = BuildExtractiveAnswer(hits, queryPlan);
                    usedFallback = true;
                }
            }
            }
        }
        catch (BusinessException ex)
        {
            _logger.LogWarning(ex, "AI retrieval pipeline failed for conversation {ConvId}", conversation.Id);
            answer = fallbackAnswer;
            usedFallback = true;
            hits = new List<VectorSearchHit>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AI chat pipeline failed for conversation {ConvId}", conversation.Id);
            answer = fallbackAnswer;
            usedFallback = true;
            hits = new List<VectorSearchHit>();
        }

        answer = StripInlineCitations(answer);

        var citationDtos = hits.Select((h, i) => new AiCitationDto
        {
            DocumentId = h.DocumentId.ToString(),
            Title = h.DocumentTitle,
            Url = h.DocumentUrl,
            ChunkIndex = h.ChunkIndex,
            Score = Math.Round(h.Score, 4)
        }).ToList();
        // Citations chỉ trả về cho client trong response hiện tại — không lưu vào log
        // (tránh phình DB và giảm payload khi xem nhật ký hội thoại).
        sw.Stop();
        var assistantMsg = new AiMessage(
            GuidGenerator.Create(), conversation.Id, AiMessageRole.Assistant, answer,
            citationsJson: null,
            llmModel: effectiveLlmModel,
            tokensIn: tokensIn,
            tokensOut: tokensOut,
            latencyMs: (int)sw.ElapsedMilliseconds,
            tenantId: CurrentTenant.Id);
        await _messageRepository.InsertAsync(assistantMsg, autoSave: true);
        conversation.IncrementMessageCount();
        if (string.IsNullOrEmpty(conversation.Title))
        {
            var title = question.Length > 80 ? question[..77] + "…" : question;
            conversation.SetTitle(title);
        }
        await _conversationRepository.UpdateAsync(conversation, autoSave: true);
        await WarnIfDailyTokenUsageIsHighAsync(conversation, dailyTokenWarningLimit);

        return new AiAskResultDto
        {
            ConversationId = conversation.Id,
            MessageId = assistantMsg.Id,
            Answer = answer,
            Citations = citationDtos,
            LatencyMs = (int)sw.ElapsedMilliseconds,
            LlmModel = effectiveLlmModel,
            UsedFallback = usedFallback
        };
    }

    public async Task<AiSessionDto> GetSessionAsync(string sessionId)
    {
        if (string.IsNullOrWhiteSpace(sessionId))
            return new AiSessionDto();

        var cq = await _conversationRepository.GetQueryableAsync();
        var userId = CurrentUser.Id;
        var conv = cq.Where(c => c.SessionId == sessionId && c.UserId == userId)
                     .OrderByDescending(c => c.CreationTime)
                     .FirstOrDefault();
        if (conv == null) return new AiSessionDto();

        var mq = await _messageRepository.GetQueryableAsync();
        var msgs = mq.Where(m => m.ConversationId == conv.Id).OrderBy(m => m.CreationTime).ToList();
        return new AiSessionDto
        {
            ConversationId = conv.Id,
            Messages = msgs.Select(m => new AiSessionMessageDto
            {
                Id = m.Id,
                Role = m.Role,
                Content = m.Content,
                Citations = ParseCitations(m.CitationsJson),
                CreationTime = m.CreationTime
            }).ToList()
        };
    }

    public async Task SubmitFeedbackAsync(AiSubmitFeedbackInput input)
    {
        var msg = await _messageRepository.GetAsync(input.MessageId);
        var rating = input.Rating > 0 ? AiFeedbackRating.ThumbsUp : AiFeedbackRating.ThumbsDown;
        var fb = new AiFeedback(GuidGenerator.Create(), msg.Id, msg.ConversationId, rating, input.Comment, CurrentTenant.Id);
        await _feedbackRepository.InsertAsync(fb, autoSave: true);
    }

    private async Task<AiConversation> GetOrCreateConversationAsync(AiAskInput input)
    {
        if (input.ConversationId.HasValue)
        {
            var existing = await _conversationRepository.FindAsync(input.ConversationId.Value);
            if (existing != null) return existing;
        }

        var cq = await _conversationRepository.GetQueryableAsync();
        var userId = CurrentUser.Id;
        var byUser = cq.Where(c => c.SessionId == input.SessionId && c.UserId == userId)
                       .OrderByDescending(c => c.CreationTime)
                       .FirstOrDefault();
        if (byUser != null) return byUser;

        var conv = new AiConversation(
            GuidGenerator.Create(),
            input.SessionId,
            userId,
            title: null,
            clientIp: GetClientIp(),
            userAgent: GetUserAgent(),
            tenantId: CurrentTenant.Id);
        await _conversationRepository.InsertAsync(conv, autoSave: true);
        return conv;
    }

    private async Task<List<LlmMessage>> GetRecentHistoryAsync(Guid conversationId, int maxMessages, Guid? excludeMessageId = null)
    {
        var mq = await _messageRepository.GetQueryableAsync();
        var recent = mq.Where(m => m.ConversationId == conversationId)
                       .Where(m => excludeMessageId == null || m.Id != excludeMessageId.Value)
                       .OrderByDescending(m => m.CreationTime)
                       .Take(maxMessages)
                       .ToList()
                       .OrderBy(m => m.CreationTime)
                       .ToList();
        return recent.Select(m => new LlmMessage(
            m.Role == AiMessageRole.Assistant ? LlmRole.Assistant : LlmRole.User,
            m.Content)).ToList();
    }

    private async Task<List<VectorSearchHit>> RetrieveHybridHitsAsync(QueryPlan queryPlan, string embedModel, int topK)
    {
        var searchTopK = Math.Max(topK * 2, topK + 4);
        var embedder = await _providerFactory.GetEmbeddingAsync();
        var semanticQuery = string.Join(". ", queryPlan.SearchQueries.Take(5));
        var embed = await embedder.EmbedAsync(new EmbeddingRequest(embedModel, semanticQuery));

        var vectorHits = await _vectorStore.SearchAsync(embed.Vector, searchTopK, CurrentTenant.Id);
        var keywordHits = await _vectorStore.SearchByTextAsync(queryPlan.KeywordQueries, searchTopK, CurrentTenant.Id);

        var merged = MergeAndRerankHits(vectorHits, keywordHits, queryPlan, topK);
        merged = await ExpandHitsWithNeighborChunksAsync(merged);
        merged = DeduplicateHitsByText(merged);

        return MergeAndRerankHits(merged, new List<VectorSearchHit>(), queryPlan, topK);
    }

    private static List<VectorSearchHit> MergeAndRerankHits(
        List<VectorSearchHit> vectorHits,
        List<VectorSearchHit> keywordHits,
        QueryPlan queryPlan,
        int topK)
    {
        var merged = new Dictionary<Guid, VectorSearchHit>();

        foreach (var hit in vectorHits)
        {
            merged[hit.ChunkId] = hit with { Score = Clamp(hit.Score * 0.72 + ScoreIntentMatch(hit, queryPlan) * 0.28) };
        }

        foreach (var hit in keywordHits)
        {
            var reranked = hit with { Score = Clamp(hit.Score * 0.56 + ScoreIntentMatch(hit, queryPlan) * 0.44) };
            if (!merged.TryGetValue(hit.ChunkId, out var existing))
            {
                merged[hit.ChunkId] = reranked;
                continue;
            }

            merged[hit.ChunkId] = existing with
            {
                Score = Clamp(Math.Max(existing.Score, reranked.Score) + 0.08)
            };
        }

        return merged.Values
            .Where(h => h.Score >= 0.25)
            .OrderByDescending(h => h.Score)
            .ThenBy(h => h.DocumentTitle)
            .ThenBy(h => h.ChunkIndex)
            .Take(topK)
            .ToList();
    }

    private async Task<QueryPlan> BuildQueryPlanAsync(string question)
    {
        var normalizedQuestion = NormalizeQuestion(question);
        var intent = DetectIntent(normalizedQuestion);
        var topic = ExtractQuestionTopic(question, normalizedQuestion, intent);
        var configuredSynonyms = await GetConfiguredSynonymsAsync();

        var searchQueries = new List<string> { question };
        if (!string.IsNullOrWhiteSpace(topic))
        {
            searchQueries.Add(topic);
            if (intent == QueryIntent.Definition)
            {
                searchQueries.Add($"{topic} là gì");
                searchQueries.Add($"định nghĩa {topic}");
                searchQueries.Add($"tổng quan về {topic}");
            }
            else if (intent == QueryIntent.Role)
            {
                searchQueries.Add($"vai trò của {topic}");
                searchQueries.Add($"{topic} có tác dụng gì");
            }
        }

        searchQueries.AddRange(BuildGenericIntentQueries(topic, intent));

        foreach (var synonym in ExpandConfiguredSynonyms(topic, normalizedQuestion, configuredSynonyms))
        {
            searchQueries.Add(synonym);
        }

        var keywordQueries = searchQueries
            .SelectMany(q => new[] { q }.Concat(ExtractKeywordTerms(q)))
            .Where(q => !string.IsNullOrWhiteSpace(q))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        return new QueryPlan(
            question,
            normalizedQuestion,
            topic,
            intent,
            searchQueries.Distinct(StringComparer.OrdinalIgnoreCase).ToList(),
            keywordQueries);
    }

    private static QueryIntent DetectIntent(string normalizedQuestion)
    {
        if (ContainsAny(normalizedQuestion, "la gi", "hieu the nao", "dinh nghia", "tong quan", "what is", "define", "definition", "overview", "explain"))
        {
            return QueryIntent.Definition;
        }

        if (ContainsAny(normalizedQuestion, "vai tro", "tac dung", "anh huong", "lien quan", "role", "impact", "effect", "influence", "relate"))
        {
            return QueryIntent.Role;
        }

        if (ContainsAny(normalizedQuestion, "trieu chung", "dau hieu", "bieu hien", "symptom", "sign", "manifestation"))
        {
            return QueryIntent.Symptom;
        }

        if (ContainsAny(normalizedQuestion, "dieu tri", "chua", "phong ngua", "vac xin", "vaccine", "treatment", "prevent", "prevention", "manage", "management"))
        {
            return QueryIntent.Care;
        }

        return QueryIntent.General;
    }

    private static string ExtractQuestionTopic(string question, string normalizedQuestion, QueryIntent intent)
    {
        var cleaned = question.Trim();
        cleaned = Regex.Replace(cleaned, @"\?", " ");
        cleaned = Regex.Replace(cleaned, @"\b(bạn|ban|tôi|toi|cho tôi|cho toi|hãy|hay|vui lòng|vui long|giải thích|giai thich|cho biết|cho biet)\b", " ", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
        cleaned = Regex.Replace(cleaned, @"\b(là gì|la gi|là cái gì|la cai gi|hiểu thế nào về|hieu the nao ve|định nghĩa|dinh nghia|tổng quan về|tong quan ve)\b", " ", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
        cleaned = Regex.Replace(cleaned, @"\b(vai trò của|vai tro cua|tác dụng của|tac dung cua|ảnh hưởng của|anh huong cua)\b", " ", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
        cleaned = Regex.Replace(cleaned, @"\b(please|can you|could you|tell me|explain|define|what is|what are|overview of|definition of|role of|impact of|effect of|symptoms of|signs of|treatment of|prevention of)\b", " ", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
        cleaned = Regex.Replace(cleaned, @"\s+", " ").Trim(' ', '.', ',', ':', ';', '-', '(', ')');

        if (string.IsNullOrWhiteSpace(cleaned))
        {
            var parts = normalizedQuestion.Split(' ', StringSplitOptions.RemoveEmptyEntries)
                .Where(p => p.Length > 2 && !QuestionStopWords.Contains(p))
                .ToList();
            cleaned = string.Join(' ', parts.TakeLast(Math.Min(parts.Count, 4)));
        }

        return cleaned;
    }

    private static IEnumerable<string> BuildGenericIntentQueries(string topic, QueryIntent intent)
    {
        if (string.IsNullOrWhiteSpace(topic)) yield break;

        if (intent == QueryIntent.Definition)
        {
            yield return $"what is {topic}";
            yield return $"{topic} definition";
            yield return $"{topic} overview";
            yield return $"khái niệm {topic}";
            yield return $"tổng quan {topic}";
        }
        else if (intent == QueryIntent.Role)
        {
            yield return $"role of {topic}";
            yield return $"{topic} impact";
            yield return $"{topic} effect";
            yield return $"vai trò {topic}";
            yield return $"ảnh hưởng {topic}";
        }
        else if (intent == QueryIntent.Symptom)
        {
            yield return $"{topic} symptoms";
            yield return $"{topic} signs";
            yield return $"triệu chứng {topic}";
            yield return $"dấu hiệu {topic}";
        }
        else if (intent == QueryIntent.Care)
        {
            yield return $"{topic} treatment";
            yield return $"{topic} prevention";
            yield return $"{topic} management";
            yield return $"điều trị {topic}";
            yield return $"phòng ngừa {topic}";
        }
    }

    private async Task<Dictionary<string, List<string>>> GetConfiguredSynonymsAsync()
    {
        var raw = await SettingProvider.GetOrNullAsync(AiSettings.QueryExpansionSynonyms)
                  ?? AiSettings.DefaultQueryExpansionSynonyms;

        if (string.IsNullOrWhiteSpace(raw))
        {
            return new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);
        }

        try
        {
            using var doc = JsonDocument.Parse(raw);
            if (doc.RootElement.ValueKind != JsonValueKind.Object)
            {
                return new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);
            }

            var result = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);
            foreach (var property in doc.RootElement.EnumerateObject())
            {
                var values = new List<string>();
                if (property.Value.ValueKind == JsonValueKind.Array)
                {
                    values.AddRange(property.Value.EnumerateArray()
                        .Where(item => item.ValueKind == JsonValueKind.String)
                        .Select(item => item.GetString())
                        .Where(value => !string.IsNullOrWhiteSpace(value))!);
                }
                else if (property.Value.ValueKind == JsonValueKind.String)
                {
                    values.AddRange((property.Value.GetString() ?? string.Empty)
                        .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
                }

                if (!string.IsNullOrWhiteSpace(property.Name) && values.Count > 0)
                {
                    result[property.Name] = values.Distinct(StringComparer.OrdinalIgnoreCase).Take(20).ToList();
                }
            }

            return result;
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Invalid AI query expansion synonyms JSON. SettingKey={SettingKey}", AiSettings.QueryExpansionSynonyms);
            return new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);
        }
    }

    private static IEnumerable<string> ExpandConfiguredSynonyms(
        string topic,
        string normalizedQuestion,
        IReadOnlyDictionary<string, List<string>> configuredSynonyms)
    {
        var normalizedTopic = NormalizeQuestion(topic);
        foreach (var (key, values) in configuredSynonyms)
        {
            var normalizedKey = NormalizeQuestion(key);
            var matched = normalizedQuestion.Contains(normalizedKey, StringComparison.Ordinal) ||
                          normalizedTopic.Contains(normalizedKey, StringComparison.Ordinal) ||
                          values.Select(NormalizeQuestion).Any(v =>
                              normalizedQuestion.Contains(v, StringComparison.Ordinal) ||
                              normalizedTopic.Contains(v, StringComparison.Ordinal));

            if (!matched) continue;

            yield return key;
            foreach (var value in values)
            {
                yield return value;
            }
        }
    }

    private static IEnumerable<string> ExtractKeywordTerms(string text)
    {
        var normalized = NormalizeQuestion(text);
        foreach (var part in normalized.Split(' ', StringSplitOptions.RemoveEmptyEntries))
        {
            if (part.Length >= 3 && !QuestionStopWords.Contains(part))
            {
                yield return part;
            }
        }
    }

    private static double ScoreIntentMatch(VectorSearchHit hit, QueryPlan queryPlan)
    {
        var haystack = NormalizeQuestion(hit.DocumentTitle + " " + hit.Text);
        var score = 0.2;

        foreach (var term in queryPlan.KeywordQueries.Select(NormalizeQuestion).Where(t => t.Length >= 3).Take(20))
        {
            if (haystack.Contains(term, StringComparison.Ordinal))
            {
                score += term.Contains(' ') ? 0.1 : 0.04;
            }
        }

        if (queryPlan.Intent == QueryIntent.Definition &&
            ContainsAny(haystack, "la", "duoc dinh nghia", "tong quan", "khai niem"))
        {
            score += 0.18;
        }

        if (queryPlan.Intent == QueryIntent.Role &&
            ContainsAny(haystack, "vai tro", "anh huong", "tac dong", "lien quan"))
        {
            score += 0.18;
        }

        return Clamp(score);
    }

    private static string BuildNaturalAnswerSystemPrompt(string configuredPrompt)
        => configuredPrompt + "\n\n" +
           "Tra loi tu nhien, ngan gon, dung tieng Viet, khong mo dau may moc bang cau 'Dua tren ngu canh duoc cung cap'. " +
           "Neu nguoi dung hoi dinh nghia hoac tong quan, hay giai thich truc tiep truoc, sau do neu can moi noi den ngu canh chuyen sau. " +
           "Chi su dung thong tin co trong context. Neu context khong du de ket luan, noi ro la kho tri thuc hien chua co du du lieu va goi y cach hoi cu the hon.";

    private static string BuildNoContextFallbackSystemPrompt(string configuredPrompt)
        => configuredPrompt + "\n\n" +
           "Khong tim thay context phu hop trong kho tri thuc. Hay tra loi bang kien thuc tong quat cua model, nhung phai noi ngan gon rang cau tra loi nay khong duoc trich xuat tu kho tri thuc hien co. " +
           "Khong tao citation, khong gia vo co nguon noi bo. Neu la noi dung y te, khuyen nguoi dung trao doi voi bac si khi co dau hieu bat thuong. Tra loi tu nhien bang tieng Viet.";

    private static string BuildAnswerPrompt(QueryPlan queryPlan, string contextText, string question)
    {
        var intentText = queryPlan.Intent switch
        {
            QueryIntent.Definition => "definition",
            QueryIntent.Role => "role",
            QueryIntent.Symptom => "symptom",
            QueryIntent.Care => "care",
            _ => "general"
        };

        return "CONTEXT:\n" + contextText +
               "\n\nQUESTION:\n" + question +
               "\n\nQUERY_INTENT: " + intentText +
               "\nQUERY_TOPIC: " + queryPlan.Topic +
               "\nREWRITTEN_QUERIES:\n- " + string.Join("\n- ", queryPlan.SearchQueries.Take(8));
    }

    private static string BuildNoContextFallbackPrompt(QueryPlan queryPlan, string question)
        => "QUESTION:\n" + question +
           "\n\nQUERY_TOPIC: " + queryPlan.Topic +
           "\nNO_CONTEXT_FOUND: true" +
           "\nYeu cau: tra loi tong quan, ngan gon, huu ich; khong noi 'toi khong co du lieu' roi dung lai.";

    private static string BuildSmartFallbackAnswer(QueryPlan queryPlan, string fallbackAnswer)
    {
        var topic = string.IsNullOrWhiteSpace(queryPlan.Topic) ? "nội dung này" : queryPlan.Topic;
        var suffix = queryPlan.Intent switch
        {
            QueryIntent.Definition => $" Bạn có thể hỏi cụ thể hơn về định nghĩa, phạm vi áp dụng, ví dụ hoặc quy định liên quan đến {topic}.",
            QueryIntent.Role => $" Bạn có thể hỏi rõ hơn {topic} ảnh hưởng đến đối tượng, quy trình, quyền lợi, nghĩa vụ hoặc kết quả nào.",
            QueryIntent.Care => $" Bạn có thể hỏi cụ thể hơn về cách xử lý, điều kiện áp dụng, quy trình thực hiện hoặc các bước tiếp theo liên quan đến {topic}.",
            _ => $" Bạn có thể hỏi lại với thuật ngữ, văn bản, quy trình, đối tượng hoặc bối cảnh cụ thể hơn liên quan đến {topic}."
        };

        var baseAnswer = string.IsNullOrWhiteSpace(fallbackAnswer)
            ? "Tôi chưa tìm thấy tài liệu phù hợp trong kho tri thức để trả lời câu hỏi này."
            : fallbackAnswer.Trim();

        return baseAnswer + suffix;
    }

    private static bool ContainsAny(string text, params string[] needles)
        => needles.Any(n => text.Contains(n, StringComparison.OrdinalIgnoreCase));

    private static double Clamp(double value)
        => Math.Max(0, Math.Min(1, value));

    private async Task<CachedAnswer?> TryGetCachedAnswerAsync(string question, int ttlDays)
    {
        if (ttlDays <= 0) return null;

        var normalized = NormalizeQuestion(question);
        if (string.IsNullOrWhiteSpace(normalized)) return null;

        var cutoff = DateTime.UtcNow.AddDays(-ttlDays);
        var mq = await _messageRepository.GetQueryableAsync();
        var candidates = mq.Where(m => m.Role == AiMessageRole.User &&
                                       m.CreationTime >= cutoff &&
                                       (CurrentTenant.Id == null ? m.TenantId == null : m.TenantId == CurrentTenant.Id))
                           .OrderByDescending(m => m.CreationTime)
                           .Take(500)
                           .ToList();

        foreach (var candidate in candidates)
        {
            if (NormalizeQuestion(candidate.Content) != normalized) continue;

            var assistant = mq.Where(m => m.ConversationId == candidate.ConversationId &&
                                          m.Role == AiMessageRole.Assistant &&
                                          m.CreationTime > candidate.CreationTime &&
                                          m.TokensOut != null)
                              .OrderBy(m => m.CreationTime)
                              .FirstOrDefault();
            if (assistant == null || string.IsNullOrWhiteSpace(assistant.Content)) continue;

            var citations = ParseCitations(assistant.CitationsJson)?
                .Select(c => new VectorSearchHit(
                    Guid.Empty,
                    Guid.TryParse(c.DocumentId, out var docId) ? docId : Guid.Empty,
                    Guid.Empty,
                    c.ChunkIndex ?? 0,
                    string.Empty,
                    c.Score ?? 0,
                    c.Title ?? string.Empty,
                    c.Url))
                .ToList() ?? new List<VectorSearchHit>();

            return new CachedAnswer(assistant.Content, citations, assistant.LlmModel);
        }

        return null;
    }

    private async Task<LlmResponse> GenerateWithFallbackProvidersAsync(
        string primaryProvider,
        string? fallbackProviders,
        string configuredModel,
        string systemPrompt,
        IReadOnlyList<LlmMessage> history,
        string prompt,
        double temperature,
        int maxTokens)
    {
        Exception? lastError = null;
        foreach (var provider in BuildProviderChain(primaryProvider, fallbackProviders))
        {
            var llm = await _providerFactory.GetLlmAsync(provider);
            foreach (var model in BuildModelChain(provider, provider == primaryProvider ? configuredModel : null))
            {
                try
                {
                    var response = await llm.GenerateAsync(new LlmRequest(
                        Model: model,
                        SystemPrompt: systemPrompt,
                        History: history,
                        UserMessage: prompt,
                        Temperature: temperature,
                        MaxOutputTokens: maxTokens));
                    return response with { Model = provider + ":" + response.Model };
                }
                catch (Exception ex)
                {
                    lastError = ex;
                    _logger.LogWarning(ex, "AI LLM provider {Provider} model {Model} failed; trying next fallback model/provider", provider, model);
                }
            }
        }

        throw lastError ?? new BusinessException("Ai:Provider:NoAvailableProvider");
    }

    private static List<string> BuildProviderChain(string primaryProvider, string? fallbackProviders)
    {
        var providers = new List<string> { primaryProvider };
        if (!string.IsNullOrWhiteSpace(fallbackProviders))
        {
            providers.AddRange(fallbackProviders.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
        }

        return providers
            .Select(p => p.Trim().ToLowerInvariant())
            .Where(p => p is AiModelDefaults.GeminiProvider or AiModelDefaults.OpenAiProvider or AiModelDefaults.ClaudeProvider or AiModelDefaults.DeepSeekProvider)
            .Distinct()
            .ToList();
    }

    private static List<string> BuildModelChain(string provider, string? configuredModel)
    {
        var primaryModel = AiModelDefaults.NormalizeLlmModel(provider, configuredModel);
        var models = new List<string> { primaryModel };

        if (provider == AiModelDefaults.GeminiProvider)
        {
            models.AddRange(new[]
            {
                "gemini-2.5-flash-lite",
                "gemini-2.0-flash",
                "gemini-2.0-flash-lite"
            });
        }

        return models
            .Where(m => !string.IsNullOrWhiteSpace(m))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static (string text, List<int> indices) BuildContext(List<VectorSearchHit> hits)
    {
        const int maxContextChars = 12000;
        const int maxChunkChars = 1800;
        var sb = new StringBuilder();
        var idxs = new List<int>();
        for (int i = 0; i < hits.Count; i++)
        {
            if (sb.Length >= maxContextChars) break;

            sb.Append('[').Append(i + 1).Append("] ").Append(hits[i].DocumentTitle);
            if (!string.IsNullOrWhiteSpace(hits[i].DocumentUrl)) sb.Append(" (").Append(hits[i].DocumentUrl).Append(')');
            sb.AppendLine();
            sb.AppendLine(CleanSnippet(hits[i].Text, maxChunkChars));
            sb.AppendLine();
            idxs.Add(i + 1);
        }
        return (sb.ToString(), idxs);
    }

    private static string BuildExtractiveAnswer(List<VectorSearchHit> hits, QueryPlan queryPlan)
    {
        if (hits.Count == 0) return AiSettings.DefaultFallbackAnswer;

        var relevantSentences = DeduplicateHitsByText(hits)
            .SelectMany(h => ExtractRelevantSentences(h.Text, queryPlan))
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(5)
            .ToList();

        if (relevantSentences.Count == 0)
        {
            relevantSentences = DeduplicateHitsByText(hits)
                .Select(h => CleanSnippet(h.Text, 280))
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Take(3)
                .ToList();
        }

        var sb = new StringBuilder();
        sb.AppendLine(BuildExtractiveOpening(queryPlan));
        sb.AppendLine();

        foreach (var sentence in relevantSentences)
        {
            sb.Append("- ").AppendLine(sentence);
        }

        sb.AppendLine();
        sb.Append("Lưu ý: đây là câu trả lời tóm tắt từ dữ liệu truy xuất vì LLM đang tạm thời không khả dụng. Bạn có thể thử lại sau ít phút để nhận câu trả lời diễn giải tự nhiên hơn.");
        return sb.ToString();
    }

    private static string BuildExtractiveOpening(QueryPlan queryPlan)
    {
        var topic = string.IsNullOrWhiteSpace(queryPlan.Topic) ? "nội dung này" : queryPlan.Topic;
        return queryPlan.Intent switch
        {
            QueryIntent.Definition => $"Theo dữ liệu hiện có, {topic} có thể được hiểu qua các ý chính sau:",
            QueryIntent.Role => $"Theo dữ liệu hiện có, {topic} có các ảnh hưởng hoặc vai trò đáng chú ý sau:",
            QueryIntent.Symptom => $"Theo dữ liệu hiện có, các dấu hiệu hoặc biểu hiện liên quan đến {topic} gồm:",
            QueryIntent.Care => $"Theo dữ liệu hiện có, các điểm cần lưu ý khi xử lý hoặc phòng ngừa {topic} gồm:",
            _ => $"Theo dữ liệu hiện có, tôi tìm thấy các ý liên quan đến {topic}:"
        };
    }

    private static IEnumerable<string> ExtractRelevantSentences(string text, QueryPlan queryPlan)
    {
        var terms = queryPlan.KeywordQueries
            .Concat(queryPlan.SearchQueries)
            .Select(NormalizeQuestion)
            .Where(t => t.Length >= 3)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(30)
            .ToList();

        var sentences = Regex.Split(CleanSnippet(text, 3000), @"(?<=[.!?。！？])\s+|(?<=\.)\s+")
            .Select(s => s.Trim())
            .Where(s => s.Length >= 40)
            .Select(s => s.Length > 280 ? s[..280].TrimEnd() + "..." : s)
            .ToList();

        return sentences
            .OrderByDescending(sentence =>
            {
                var normalized = NormalizeQuestion(sentence);
                return terms.Count(term => normalized.Contains(term, StringComparison.Ordinal));
            })
            .ThenBy(sentence => sentence.Length)
            .Take(2);
    }

    private static List<VectorSearchHit> DeduplicateHitsByText(List<VectorSearchHit> hits)
    {
        var result = new List<VectorSearchHit>();
        var normalizedTexts = new List<string>();

        foreach (var hit in hits
                     .Where(h => !string.IsNullOrWhiteSpace(h.Text))
                     .OrderByDescending(h => h.Score)
                     .ThenBy(h => h.DocumentId)
                     .ThenBy(h => h.ChunkIndex))
        {
            var normalized = NormalizeSnippet(hit.Text);
            if (normalized.Length < 40)
            {
                result.Add(hit);
                normalizedTexts.Add(normalized);
                continue;
            }

            if (normalizedTexts.Any(existing => IsNearDuplicate(existing, normalized))) continue;

            result.Add(hit);
            normalizedTexts.Add(normalized);
        }

        return result.OrderByDescending(h => h.Score).ThenBy(h => h.ChunkIndex).ToList();
    }

    private static bool IsNearDuplicate(string existing, string candidate)
    {
        if (existing == candidate) return true;
        var minLength = Math.Min(existing.Length, candidate.Length);
        if (minLength < 80) return false;
        if (existing.Contains(candidate, StringComparison.Ordinal) || candidate.Contains(existing, StringComparison.Ordinal)) return true;

        var window = Math.Min(160, minLength);
        return existing[..window] == candidate[..window];
    }

    private static string CleanSnippet(string text, int maxLength = 900)
    {
        var cleaned = string.Join(' ', text.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries))
            .Trim()
            .TrimStart(',', '.', ';', ':', '-', '–', '—', ')', ']', '}')
            .Trim();

        return cleaned.Length > maxLength ? cleaned[..maxLength].TrimEnd() + "..." : cleaned;
    }

    private static string NormalizeSnippet(string text)
    {
        var normalized = CleanSnippet(text).ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(normalized.Length);
        foreach (var ch in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(ch) == UnicodeCategory.NonSpacingMark) continue;
            if (char.IsLetterOrDigit(ch)) sb.Append(ch);
            else if (char.IsWhiteSpace(ch)) sb.Append(' ');
        }

        return string.Join(' ', sb.ToString().Normalize(NormalizationForm.FormC)
            .Split(' ', StringSplitOptions.RemoveEmptyEntries));
    }

    private static string StripInlineCitations(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return text;

        return Regex.Replace(
                text,
                @"\s*\[(?:\d+\s*(?:,\s*\d+\s*)*)\]",
                string.Empty,
                RegexOptions.CultureInvariant)
            .Trim();
    }

    private async Task<List<VectorSearchHit>> ExpandHitsWithNeighborChunksAsync(List<VectorSearchHit> hits)
    {
        if (hits.Count == 0) return hits;

        var chunkQuery = await _chunkRepository.GetQueryableAsync();
        var expanded = new List<VectorSearchHit>();
        var seen = new HashSet<Guid>();

        foreach (var hit in hits)
        {
            var minIndex = Math.Max(0, hit.ChunkIndex - 1);
            var maxIndex = hit.ChunkIndex + 1;
            var neighbors = chunkQuery
                .Where(c => c.DocumentId == hit.DocumentId &&
                            c.ChunkIndex >= minIndex &&
                            c.ChunkIndex <= maxIndex &&
                            (CurrentTenant.Id == null ? c.TenantId == null : c.TenantId == CurrentTenant.Id))
                .OrderBy(c => c.ChunkIndex)
                .ToList();

            foreach (var chunk in neighbors)
            {
                if (!seen.Add(chunk.Id)) continue;

                expanded.Add(new VectorSearchHit(
                    chunk.Id,
                    chunk.DocumentId,
                    chunk.SourceId,
                    chunk.ChunkIndex,
                    chunk.Text,
                    chunk.Id == hit.ChunkId ? hit.Score : hit.Score * 0.98,
                    hit.DocumentTitle,
                    hit.DocumentUrl));
            }
        }

        return expanded;
    }

    private async Task EnforceDailyQuotaAsync(AiConversation conversation, int anonymousLimit, int userLimit)
    {
        var userId = CurrentUser.Id;
        var limit = userId.HasValue ? userLimit : anonymousLimit;
        if (limit <= 0) return;

        var today = DateTime.UtcNow.Date;
        var cq = await _conversationRepository.GetQueryableAsync();
        var mq = await _messageRepository.GetQueryableAsync();
        var clientIp = conversation.ClientIp ?? GetClientIp();

        var count = (from m in mq
                     join c in cq on m.ConversationId equals c.Id
                     where m.Role == AiMessageRole.User &&
                           m.CreationTime >= today &&
                           (CurrentTenant.Id == null ? m.TenantId == null : m.TenantId == CurrentTenant.Id) &&
                           (userId.HasValue ? c.UserId == userId : c.ClientIp == clientIp)
                     select m.Id).Count();

        if (count >= limit)
        {
            throw new BusinessException("Ai:Quota:DailyLimitExceeded")
                .WithData("limit", limit)
                .WithData("scope", userId.HasValue ? "user" : "ip");
        }
    }

    private async Task WarnIfDailyTokenUsageIsHighAsync(AiConversation conversation, int tokenLimit)
    {
        if (tokenLimit <= 0) return;

        var today = DateTime.UtcNow.Date;
        var cq = await _conversationRepository.GetQueryableAsync();
        var mq = await _messageRepository.GetQueryableAsync();
        var userId = CurrentUser.Id;
        var clientIp = conversation.ClientIp ?? GetClientIp();

        var total = (from m in mq
                     join c in cq on m.ConversationId equals c.Id
                     where m.Role == AiMessageRole.Assistant &&
                           m.CreationTime >= today &&
                           (CurrentTenant.Id == null ? m.TenantId == null : m.TenantId == CurrentTenant.Id) &&
                           (userId.HasValue ? c.UserId == userId : c.ClientIp == clientIp)
                     select (m.TokensIn ?? 0) + (m.TokensOut ?? 0)).Sum();

        if (total >= tokenLimit)
        {
            _logger.LogWarning(
                "AI daily token usage crossed warning limit. Scope={Scope}, UserId={UserId}, ClientIp={ClientIp}, Tokens={Tokens}, Limit={Limit}",
                userId.HasValue ? "user" : "ip",
                userId,
                clientIp,
                total,
                tokenLimit);
        }
    }

    private string? GetClientIp()
    {
        var http = _httpContextAccessor.HttpContext;
        var forwardedFor = http?.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(forwardedFor))
        {
            return forwardedFor.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).FirstOrDefault();
        }

        return http?.Connection.RemoteIpAddress?.ToString();
    }

    private string? GetUserAgent()
        => _httpContextAccessor.HttpContext?.Request.Headers["User-Agent"].FirstOrDefault();

    private static string NormalizeQuestion(string text)
    {
        var decomposed = text.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(decomposed.Length);
        foreach (var ch in decomposed)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(ch) == UnicodeCategory.NonSpacingMark) continue;
            if (char.IsLetterOrDigit(ch)) sb.Append(ch);
            else if (char.IsWhiteSpace(ch)) sb.Append(' ');
        }

        return string.Join(' ', sb.ToString().Normalize(NormalizationForm.FormC)
            .Split(' ', StringSplitOptions.RemoveEmptyEntries));
    }

    private static readonly JsonSerializerOptions CitationsJsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
    };

    private static List<AiCitationDto>? ParseCitations(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        try { return JsonSerializer.Deserialize<List<AiCitationDto>>(json, CitationsJsonOptions); }
        catch { return null; }
    }

    private async Task<int> GetIntSetting(string key, int fallback)
    {
        var raw = await SettingProvider.GetOrNullAsync(key);
        return int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out var v) ? v : fallback;
    }

    private async Task<double> GetDoubleSetting(string key, double fallback)
    {
        var raw = await SettingProvider.GetOrNullAsync(key);
        return double.TryParse(raw, NumberStyles.Float, CultureInfo.InvariantCulture, out var v) ? v : fallback;
    }

    private async Task<bool> GetBoolSetting(string key, bool fallback)
    {
        var raw = await SettingProvider.GetOrNullAsync(key);
        return bool.TryParse(raw, out var v) ? v : fallback;
    }

    private static readonly HashSet<string> QuestionStopWords = new(StringComparer.OrdinalIgnoreCase)
    {
        "ban", "toi", "cho", "hay", "vui", "long", "la", "gi", "ve", "cua", "co", "khong", "nhu",
        "the", "nao", "mot", "cac", "nhung", "trong", "ngoai", "voi", "den", "tu", "duoc", "bi",
        "benh", "noi", "dung", "giai", "thich", "dinh", "nghia", "tong", "quan",
        "what", "is", "are", "the", "a", "an", "of", "to", "for", "in", "on", "about", "please",
        "can", "you", "could", "tell", "me", "explain", "define", "definition", "overview", "role",
        "impact", "effect", "symptom", "symptoms", "sign", "signs", "treatment", "prevention"
    };

    private enum QueryIntent
    {
        General,
        Definition,
        Role,
        Symptom,
        Care
    }

    private record QueryPlan(
        string OriginalQuestion,
        string NormalizedQuestion,
        string Topic,
        QueryIntent Intent,
        List<string> SearchQueries,
        List<string> KeywordQueries);

    private record CachedAnswer(string Answer, List<VectorSearchHit> Citations, string? LlmModel);
}

[AllowAnonymous]
public class AiPublicAppService : MydoctorAppService, IAiPublicAppService
{
    public async Task<AiWidgetConfigDto> GetWidgetConfigAsync()
    {
        var enabledRaw = await SettingProvider.GetOrNullAsync(AiSettings.WidgetEnabled);
        var enabled = bool.TryParse(enabledRaw, out var b) ? b : true;
        return new AiWidgetConfigDto
        {
            Enabled = enabled,
            Title = await SettingProvider.GetOrNullAsync(AiSettings.WidgetTitle) ?? "Trợ lý",
            Greeting = await SettingProvider.GetOrNullAsync(AiSettings.WidgetGreeting) ?? "Xin chào!"
        };
    }
}
