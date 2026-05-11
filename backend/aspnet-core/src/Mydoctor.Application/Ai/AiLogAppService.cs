using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Mydoctor.Ai.Dtos;
using Mydoctor.Permissions;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Content;
using Volo.Abp.Domain.Repositories;

namespace Mydoctor.Ai;

[Authorize(MydoctorPermissions.Ai.Logs.Default)]
public class AiLogAppService : MydoctorAppService, IAiLogAppService
{
    private readonly IRepository<AiConversation, Guid> _conversationRepository;
    private readonly IRepository<AiMessage, Guid> _messageRepository;
    private readonly IRepository<AiFeedback, Guid> _feedbackRepository;

    public AiLogAppService(
        IRepository<AiConversation, Guid> conversationRepository,
        IRepository<AiMessage, Guid> messageRepository,
        IRepository<AiFeedback, Guid> feedbackRepository)
    {
        _conversationRepository = conversationRepository;
        _messageRepository = messageRepository;
        _feedbackRepository = feedbackRepository;
    }

    public async Task<PagedResultDto<AiConversationListDto>> GetConversationsAsync(GetAiConversationListInput input)
    {
        var cq = await _conversationRepository.GetQueryableAsync();
        var mq = await _messageRepository.GetQueryableAsync();

        if (input.UserId.HasValue) cq = cq.Where(x => x.UserId == input.UserId.Value);
        if (input.FromDate.HasValue) cq = cq.Where(x => x.CreationTime >= input.FromDate.Value);
        if (input.ToDate.HasValue) cq = cq.Where(x => x.CreationTime <= input.ToDate.Value);
        if (!string.IsNullOrWhiteSpace(input.Filter))
        {
            var term = input.Filter.Trim().ToLower();
            cq = cq.Where(x =>
                (x.Title != null && x.Title.ToLower().Contains(term)) ||
                x.SessionId.ToLower().Contains(term));
        }

        var total = await AsyncExecuter.CountAsync(cq);
        var sort = string.IsNullOrWhiteSpace(input.Sorting) ? nameof(AiConversation.CreationTime) + " desc" : input.Sorting;
        var paged = cq.OrderBy(sort).Skip(input.SkipCount).Take(input.MaxResultCount);
        var items = await AsyncExecuter.ToListAsync(paged);

        var convIds = items.Select(x => x.Id).ToList();
        var lastMsgLookup = await AsyncExecuter.ToListAsync(
            mq.Where(m => convIds.Contains(m.ConversationId) && m.Role == AiMessageRole.User)
              .GroupBy(m => m.ConversationId)
              .Select(g => new
              {
                  ConversationId = g.Key,
                  LastAt = g.Max(m => m.CreationTime),
                  LastContent = g.OrderByDescending(m => m.CreationTime).Select(m => m.Content).FirstOrDefault()
              }));

        var list = items.Select(c =>
        {
            var m = lastMsgLookup.FirstOrDefault(x => x.ConversationId == c.Id);
            return new AiConversationListDto
            {
                Id = c.Id,
                UserId = c.UserId,
                SessionId = c.SessionId,
                Title = c.Title,
                ClientIp = c.ClientIp,
                MessageCount = c.MessageCount,
                CreationTime = c.CreationTime,
                LastMessageAt = m?.LastAt,
                LastUserMessage = m?.LastContent
            };
        }).ToList();

        return new PagedResultDto<AiConversationListDto>(total, list);
    }

    public async Task<AiConversationDto> GetConversationAsync(Guid id)
    {
        var conv = await _conversationRepository.GetAsync(id);
        var mq = await _messageRepository.GetQueryableAsync();
        var messages = await AsyncExecuter.ToListAsync(
            mq.Where(m => m.ConversationId == id).OrderBy(m => m.CreationTime));

        return new AiConversationDto
        {
            Id = conv.Id,
            UserId = conv.UserId,
            SessionId = conv.SessionId,
            Title = conv.Title,
            ClientIp = conv.ClientIp,
            MessageCount = conv.MessageCount,
            CreationTime = conv.CreationTime,
            Messages = messages.Select(m => m.ToDto()).ToList()
        };
    }

    [Authorize(MydoctorPermissions.Ai.Logs.Delete)]
    public async Task DeleteConversationAsync(Guid id)
    {
        var mq = await _messageRepository.GetQueryableAsync();
        var toDeleteMessages = await AsyncExecuter.ToListAsync(mq.Where(m => m.ConversationId == id));
        foreach (var m in toDeleteMessages)
        {
            await _messageRepository.DeleteAsync(m, autoSave: false);
        }
        var fq = await _feedbackRepository.GetQueryableAsync();
        var toDeleteFb = await AsyncExecuter.ToListAsync(fq.Where(f => f.ConversationId == id));
        foreach (var f in toDeleteFb)
        {
            await _feedbackRepository.DeleteAsync(f, autoSave: false);
        }
        await _conversationRepository.DeleteAsync(id);
    }

    public async Task<List<AiFeedbackDto>> GetFeedbacksAsync(Guid conversationId)
    {
        var fq = await _feedbackRepository.GetQueryableAsync();
        var list = await AsyncExecuter.ToListAsync(fq.Where(f => f.ConversationId == conversationId));
        return list.Select(x => x.ToDto()).ToList();
    }

    [Authorize(MydoctorPermissions.Ai.Logs.Export)]
    public async Task<IRemoteStreamContent> ExportAsync(GetAiConversationListInput input)
    {
        var allPage = new GetAiConversationListInput
        {
            Filter = input.Filter,
            UserId = input.UserId,
            FromDate = input.FromDate,
            ToDate = input.ToDate,
            MaxResultCount = 10000,
            SkipCount = 0,
            Sorting = "CreationTime desc"
        };
        var paged = await GetConversationsAsync(allPage);

        var sb = new StringBuilder();
        sb.AppendLine("Id,CreatedAt,SessionId,UserId,MessageCount,LastUserMessage");
        foreach (var c in paged.Items)
        {
            sb.Append(c.Id).Append(',');
            sb.Append(c.CreationTime.ToString("s")).Append(',');
            sb.Append(Escape(c.SessionId)).Append(',');
            sb.Append(c.UserId?.ToString() ?? string.Empty).Append(',');
            sb.Append(c.MessageCount).Append(',');
            sb.Append(Escape(c.LastUserMessage)).AppendLine();
        }
        // UTF-8 BOM để Excel hiển thị đúng tiếng Việt
        var bytes = new UTF8Encoding(true).GetPreamble()
            .Concat(Encoding.UTF8.GetBytes(sb.ToString()))
            .ToArray();
        return new RemoteStreamContent(new MemoryStream(bytes), $"ai-conversations-{DateTime.UtcNow:yyyyMMddHHmmss}.csv", "text/csv");
    }

    private static string Escape(string? s)
    {
        if (string.IsNullOrEmpty(s)) return string.Empty;
        var escaped = s.Replace("\"", "\"\"");
        return $"\"{escaped}\"";
    }
}
