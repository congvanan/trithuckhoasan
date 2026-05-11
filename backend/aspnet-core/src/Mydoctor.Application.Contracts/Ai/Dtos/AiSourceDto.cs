using System;
using Volo.Abp.Application.Dtos;

namespace Mydoctor.Ai.Dtos;

public class AiSourceDto : FullAuditedEntityDto<Guid>
{
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public AiSourceType Type { get; set; }
    public AiSourceStatus Status { get; set; }
    public string? ConfigJson { get; set; }
    public DateTime? LastIndexedAt { get; set; }
    public int DocumentCount { get; set; }
    public int ChunkCount { get; set; }
    public string? ConcurrencyStamp { get; set; }
}
