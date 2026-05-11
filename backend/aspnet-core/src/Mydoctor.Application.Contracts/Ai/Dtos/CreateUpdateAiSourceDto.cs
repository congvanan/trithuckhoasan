using System.ComponentModel.DataAnnotations;

namespace Mydoctor.Ai.Dtos;

public class CreateUpdateAiSourceDto
{
    [Required]
    [StringLength(AiConsts.MaxSourceNameLength)]
    public string Name { get; set; } = default!;

    [StringLength(AiConsts.MaxSourceDescriptionLength)]
    public string? Description { get; set; }

    public AiSourceType Type { get; set; }

    public AiSourceStatus Status { get; set; } = AiSourceStatus.Active;

    public string? ConfigJson { get; set; }

    public string? ConcurrencyStamp { get; set; }
}
