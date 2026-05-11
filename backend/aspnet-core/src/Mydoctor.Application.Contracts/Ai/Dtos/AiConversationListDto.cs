using System;
using Volo.Abp.Application.Dtos;

namespace Mydoctor.Ai.Dtos;

public class AiConversationListDto : EntityDto<Guid>
{
    public Guid? UserId { get; set; }
    public string SessionId { get; set; } = default!;
    public string? Title { get; set; }
    public string? ClientIp { get; set; }
    public int MessageCount { get; set; }
    public DateTime CreationTime { get; set; }
    public DateTime? LastMessageAt { get; set; }
    public string? LastUserMessage { get; set; }
}
