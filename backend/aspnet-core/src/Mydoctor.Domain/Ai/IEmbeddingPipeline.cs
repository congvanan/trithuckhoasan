using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Mydoctor.Ai;

public record ContentPayload(
    Guid SourceId,
    string Title,
    string Text,
    string? ExternalId = null,
    string? Url = null,
    string? MetadataJson = null);

public interface IEmbeddingPipeline
{
    Task<List<VectorChunk>> ProcessAsync(
        ContentPayload payload,
        Guid documentId,
        Guid? tenantId,
        CancellationToken ct = default);
}
