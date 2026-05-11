namespace Mydoctor.Ai;

public static class AiConsts
{
    public const int EmbeddingDimensions = 768;

    public const int MaxSourceNameLength = 200;
    public const int MaxSourceDescriptionLength = 1000;

    public const int MaxDocumentTitleLength = 500;
    public const int MaxDocumentUrlLength = 1000;
    public const int MaxExternalIdLength = 200;
    public const int MaxContentHashLength = 64;

    public const int MaxChunkTextLength = 8000;

    public const int MaxEmbeddingModelLength = 100;
    public const int MaxLlmModelLength = 100;

    public const int MaxConversationTitleLength = 200;
    public const int MaxSessionIdLength = 100;

    public const int MaxMessageContentLength = 32000;

    public const int MaxJobErrorLength = 4000;

    public const int MaxFeedbackCommentLength = 2000;

    public const int DefaultTopK = 6;
}
