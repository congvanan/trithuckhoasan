using System;
using Volo.Abp.Application.Dtos;

namespace Mydoctor.Ai.Dtos;

public class AiMessageDto : EntityDto<Guid>
{
    public Guid ConversationId { get; set; }
    public AiMessageRole Role { get; set; }
    public string Content { get; set; } = default!;
    public string? CitationsJson { get; set; }
    public string? LlmModel { get; set; }
    public int? TokensIn { get; set; }
    public int? TokensOut { get; set; }
    public int? LatencyMs { get; set; }
    public DateTime CreationTime { get; set; }
}
