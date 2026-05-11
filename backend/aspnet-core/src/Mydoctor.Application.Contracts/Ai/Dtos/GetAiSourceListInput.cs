using Volo.Abp.Application.Dtos;

namespace Mydoctor.Ai.Dtos;

public class GetAiSourceListInput : PagedAndSortedResultRequestDto
{
    public string? Filter { get; set; }
    public AiSourceType? Type { get; set; }
    public AiSourceStatus? Status { get; set; }
}
