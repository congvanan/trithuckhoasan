using System;
using Volo.Abp.Application.Dtos;

namespace Mydoctor.Ai.Dtos;

public class AiDocumentDto : EntityDto<Guid>
{
    public Guid SourceId { get; set; }
    public string? ExternalId { get; set; }
    public string Title { get; set; } = default!;
    public string? Url { get; set; }
    public int ChunkCount { get; set; }
    public DateTime? LastIndexedAt { get; set; }
    public DateTime CreationTime { get; set; }
}
