using System.Threading.Tasks;
using Mydoctor.Ai.Dtos;
using Volo.Abp.Application.Services;

namespace Mydoctor.Ai;

public interface IAiChatAppService : IApplicationService
{
    Task<AiAskResultDto> AskAsync(AiAskInput input);

    Task<AiSessionDto> GetSessionAsync(string sessionId);

    Task SubmitFeedbackAsync(AiSubmitFeedbackInput input);
}

public interface IAiPublicAppService : IApplicationService
{
    Task<AiWidgetConfigDto> GetWidgetConfigAsync();
}
