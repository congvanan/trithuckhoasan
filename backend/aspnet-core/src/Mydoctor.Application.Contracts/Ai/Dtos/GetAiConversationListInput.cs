using System;
using Volo.Abp.Application.Dtos;

namespace Mydoctor.Ai.Dtos;

public class GetAiConversationListInput : PagedAndSortedResultRequestDto
{
    public string? Filter { get; set; }
    public Guid? UserId { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}
