namespace Mydoctor.Ai.Dtos;

public class PreviewAiSourceInput
{
    public string? Name { get; set; }

    public AiSourceType Type { get; set; }

    public string? ConfigJson { get; set; }
}

public class AiSourcePreviewDto
{
    public string Title { get; set; } = string.Empty;

    public string Text { get; set; } = string.Empty;

    public string? Url { get; set; }

    public int CharacterCount { get; set; }

    public int WordCount { get; set; }
}
