using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Mydoctor.Ai.Providers;

public enum LlmRole { System = 0, User = 1, Assistant = 2 }

public record LlmMessage(LlmRole Role, string Content);

public record LlmRequest(
    string Model,
    string SystemPrompt,
    IReadOnlyList<LlmMessage> History,
    string UserMessage,
    double Temperature,
    int MaxOutputTokens);

public record LlmResponse(string Text, int? TokensIn, int? TokensOut, string Model, string? FinishReason = null);

public record EmbeddingRequest(string Model, string Text);
public record EmbeddingResponse(float[] Vector, string Model);

public interface ILlmProvider
{
    string Name { get; }
    Task<LlmResponse> GenerateAsync(LlmRequest request, CancellationToken cancellationToken = default);
}

public interface IEmbeddingProvider
{
    string Name { get; }
    int Dimensions { get; }
    Task<EmbeddingResponse> EmbedAsync(EmbeddingRequest request, CancellationToken cancellationToken = default);
}

public interface IAiProviderFactory
{
    Task<ILlmProvider> GetLlmAsync(string? provider = null);
    Task<IEmbeddingProvider> GetEmbeddingAsync(string? provider = null);
}
