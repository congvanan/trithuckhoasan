using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Mydoctor.Ai.Dtos;

public class AiAskInput
{
    [Required, StringLength(8000)]
    public string Question { get; set; } = default!;

    [Required, StringLength(AiConsts.MaxSessionIdLength)]
    public string SessionId { get; set; } = default!;

    public Guid? ConversationId { get; set; }
}

public class AiCitationDto
{
    public string? DocumentId { get; set; }
    public string? Title { get; set; }
    public string? Url { get; set; }
    public int? ChunkIndex { get; set; }
    public double? Score { get; set; }
}

public class AiAskResultDto
{
    public Guid ConversationId { get; set; }
    public Guid MessageId { get; set; }
    public string Answer { get; set; } = default!;
    public List<AiCitationDto> Citations { get; set; } = new();
    public int LatencyMs { get; set; }
    public string? LlmModel { get; set; }
    public bool UsedFallback { get; set; }
}

public class AiSubmitFeedbackInput
{
    [Required] public Guid MessageId { get; set; }
    /// <summary>1 = positive, -1 = negative</summary>
    public int Rating { get; set; }
    [StringLength(AiConsts.MaxFeedbackCommentLength)]
    public string? Comment { get; set; }
}

public class AiWidgetConfigDto
{
    public bool Enabled { get; set; }
    public string Title { get; set; } = default!;
    public string Greeting { get; set; } = default!;
}

public class AiSessionMessageDto
{
    public Guid Id { get; set; }
    public AiMessageRole Role { get; set; }
    public string Content { get; set; } = default!;
    public List<AiCitationDto>? Citations { get; set; }
    public DateTime CreationTime { get; set; }
}

public class AiSessionDto
{
    public Guid? ConversationId { get; set; }
    public List<AiSessionMessageDto> Messages { get; set; } = new();
}
