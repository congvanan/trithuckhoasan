using System;
using System.Collections.Generic;
using Volo.Abp.Application.Dtos;

namespace Mydoctor.Ai.Dtos;

public class AiConversationDto : EntityDto<Guid>
{
    public Guid? UserId { get; set; }
    public string SessionId { get; set; } = default!;
    public string? Title { get; set; }
    public string? ClientIp { get; set; }
    public int MessageCount { get; set; }
    public DateTime CreationTime { get; set; }
    public List<AiMessageDto> Messages { get; set; } = new();
}
