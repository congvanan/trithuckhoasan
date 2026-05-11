using System;
using Volo.Abp.Application.Dtos;

namespace Mydoctor.Ai.Dtos;

public class GetAiDocumentListInput : PagedAndSortedResultRequestDto
{
    public Guid? SourceId { get; set; }
    public string? Filter { get; set; }
}
