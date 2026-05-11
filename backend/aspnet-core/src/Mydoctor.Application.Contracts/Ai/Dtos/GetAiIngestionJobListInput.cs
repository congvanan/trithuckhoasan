using System;
using Volo.Abp.Application.Dtos;

namespace Mydoctor.Ai.Dtos;

public class GetAiIngestionJobListInput : PagedAndSortedResultRequestDto
{
    public Guid? SourceId { get; set; }
    public AiJobStatus? Status { get; set; }
}
