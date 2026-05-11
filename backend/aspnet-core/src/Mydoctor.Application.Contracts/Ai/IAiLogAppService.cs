using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Mydoctor.Ai.Dtos;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Content;

namespace Mydoctor.Ai;

public interface IAiLogAppService : IApplicationService
{
    Task<PagedResultDto<AiConversationListDto>> GetConversationsAsync(GetAiConversationListInput input);

    Task<AiConversationDto> GetConversationAsync(Guid id);

    Task DeleteConversationAsync(Guid id);

    Task<List<AiFeedbackDto>> GetFeedbacksAsync(Guid conversationId);

    Task<IRemoteStreamContent> ExportAsync(GetAiConversationListInput input);
}
