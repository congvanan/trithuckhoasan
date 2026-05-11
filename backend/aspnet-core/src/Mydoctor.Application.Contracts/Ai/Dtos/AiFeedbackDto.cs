using System;
using Volo.Abp.Application.Dtos;

namespace Mydoctor.Ai.Dtos;

public class AiFeedbackDto : EntityDto<Guid>
{
    public Guid MessageId { get; set; }
    public Guid ConversationId { get; set; }
    public AiFeedbackRating Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime CreationTime { get; set; }
}
