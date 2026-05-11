using System;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using Mydoctor.Ai.Dtos;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace Mydoctor.Ai;

public interface IAiIngestionAppService : IApplicationService
{
    Task<PagedResultDto<AiIngestionJobDto>> GetListAsync(GetAiIngestionJobListInput input);

    Task<AiIngestionJobDto> GetAsync(Guid id);

    Task<AiIngestionJobDto> TriggerAsync(Guid sourceId);

    Task CancelAsync(Guid id);

    Task DeleteAsync(Guid id);

    Task DeleteJobAsync(DeleteAiIngestionJobInput input);

    Task ClearFailedAsync();

    Task<AiIngestionResultDto> IngestTextAsync(IngestTextInput input);
}

public class DeleteAiIngestionJobInput
{
    [Required] public Guid Id { get; set; }
}

public class IngestTextInput
{
    [Required] public Guid SourceId { get; set; }
    [Required, StringLength(AiConsts.MaxDocumentTitleLength)]
    public string Title { get; set; } = default!;
    [Required, StringLength(500_000)]
    public string Content { get; set; } = default!;
    [StringLength(AiConsts.MaxDocumentUrlLength)]
    public string? Url { get; set; }
    [StringLength(AiConsts.MaxExternalIdLength)]
    public string? ExternalId { get; set; }
}

public class AiIngestionResultDto
{
    public Guid DocumentId { get; set; }
    public int ChunkCount { get; set; }
    public int LatencyMs { get; set; }
}
