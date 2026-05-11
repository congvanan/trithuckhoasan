using System.Threading.Tasks;
using Mydoctor.Ai.Dtos;
using Volo.Abp.Application.Services;

namespace Mydoctor.Ai;

public interface IAiSettingAppService : IApplicationService
{
    Task<AiSettingsDto> GetAsync();

    Task UpdateAsync(UpdateAiSettingsDto input);

    Task<AiProviderStatusDto> TestProviderAsync(string provider, string? model = null);
}

public class AiProviderStatusDto
{
    public bool Ok { get; set; }
    public string? Message { get; set; }
    public int? LatencyMs { get; set; }
}
