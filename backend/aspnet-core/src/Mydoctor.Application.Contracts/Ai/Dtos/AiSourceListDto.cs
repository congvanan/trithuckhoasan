using System;
using Volo.Abp.Application.Dtos;

namespace Mydoctor.Ai.Dtos;

public class AiSourceListDto : EntityDto<Guid>
{
    public string Name { get; set; } = default!;
    public AiSourceType Type { get; set; }
    public AiSourceStatus Status { get; set; }
    public DateTime? LastIndexedAt { get; set; }
    public int DocumentCount { get; set; }
    public int ChunkCount { get; set; }
    public DateTime CreationTime { get; set; }
}
