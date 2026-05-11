using Microsoft.Extensions.Localization;
using Mydoctor.Localization;
using Volo.Abp.Ui.Branding;
using Volo.Abp.DependencyInjection;

namespace Mydoctor.Web;

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
