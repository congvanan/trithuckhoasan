using System;
using Volo.Abp.Domain.Entities.Auditing;
using Volo.Abp.MultiTenancy;

namespace Mydoctor.Ai;

public class AiMessage : CreationAuditedEntity<Guid>, IMultiTenant
{
    public Guid? TenantId { get; protected set; }

    public Guid ConversationId { get; protected set; }

    public AiMessageRole Role { get; protected set; }

    public string Content { get; protected set; } = default!;

    /// <summary>JSON array of {documentId, title, url, chunkIndex, score} for assistant messages.</summary>
    public string? CitationsJson { get; protected set; }

    public string? LlmModel { get; protected set; }

    public int? TokensIn { get; protected set; }

    public int? TokensOut { get; protected set; }

    /// <summary>End-to-end latency in milliseconds (embedding + search + LLM).</summary>
    public int? LatencyMs { get; protected set; }

    protected AiMessage() { }

    public AiMessage(
        Guid id,
        Guid conversationId,
        AiMessageRole role,
        string content,
        string? citationsJson = null,
        string? llmModel = null,
        int? tokensIn = null,
        int? tokensOut = null,
        int? latencyMs = null,
        Guid? tenantId = null) : base(id)
    {
        ConversationId = conversationId;
        Role = role;
        Content = content;
        CitationsJson = citationsJson;
        LlmModel = llmModel;
        TokensIn = tokensIn;
        TokensOut = tokensOut;
        LatencyMs = latencyMs;
        TenantId = tenantId;
    }
}
