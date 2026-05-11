using Microsoft.Extensions.Localization;
using Mydoctor.Localization;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Ui.Branding;

namespace Mydoctor.Blazor.Client;

[Dependency(ReplaceServices = true)]
public class MydoctorBrandingProvider : DefaultBrandingProvider
{
    private IStringLocalizer<MydoctorResource> _localizer;

    public MydoctorBrandingProvider(IStringLocalizer<MydoctorResource> localizer)
    {
        _localizer = localizer;
    }

    public override string AppName => _localizer["AppName"];
}
