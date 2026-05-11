using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Mydoctor.Ai;

public interface IContentExtractor
{
    bool CanHandle(AiSourceType type);
    Task<List<ContentPayload>> ExtractAsync(AiSource source, CancellationToken ct = default);
}
