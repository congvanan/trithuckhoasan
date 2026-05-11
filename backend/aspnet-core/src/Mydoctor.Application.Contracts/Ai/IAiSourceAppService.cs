using System;
using System.Threading.Tasks;
using Mydoctor.Ai.Dtos;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace Mydoctor.Ai;

public interface IAiSourceAppService : IApplicationService
{
    Task<AiSourceDto> GetAsync(Guid id);

    Task<PagedResultDto<AiSourceListDto>> GetListAsync(GetAiSourceListInput input);

    Task<AiSourceDto> CreateAsync(CreateUpdateAiSourceDto input);

    Task<AiSourceDto> UpdateAsync(Guid id, CreateUpdateAiSourceDto input);

    Task DeleteAsync(Guid id);

    Task<AiSourcePreviewDto> PreviewAsync(PreviewAiSourceInput input);

    Task<PagedResultDto<AiDocumentDto>> GetDocumentsAsync(GetAiDocumentListInput input);

    Task<AiIngestionJobDto> ReindexAsync(Guid id);
}
