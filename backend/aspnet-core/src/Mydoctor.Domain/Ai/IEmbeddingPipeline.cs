using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Mydoctor.Ai;

/// <summary>
/// Một section theo cấu trúc heading của tài liệu.
/// HeadingPath là đường dẫn heading phân cấp, vd "2. Chẩn đoán › 2.1 Xét nghiệm".
/// </summary>
public record ContentSection(string? HeadingPath, string Text);

public record ContentPayload(
    Guid SourceId,
    string Title,
    string Text,
    string? ExternalId = null,
    string? Url = null,
    string? MetadataJson = null,
    IReadOnlyList<ContentSection>? Sections = null);

public interface IEmbeddingPipeline
{
    Task<List<VectorChunk>> ProcessAsync(
        ContentPayload payload,
        Guid documentId,
        Guid? tenantId,
        CancellationToken ct = default);
}
