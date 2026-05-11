using Microsoft.Extensions.Localization;
using Mydoctor.Localization;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Ui.Branding;

namespace Mydoctor;

[Dependency(ReplaceServices = true)]
public class MydoctorBrandingProvider : DefaultBrandingProvider
{
    private IStringLocalizer<MydoctorResource> _localizer;

    public MydoctorBrandingProvider(IStringLocalizer<MydoctorResource> localizer)
    {
        _localizer = localizer;
    }

    public override string AppName => _localizer["AppName"];

    public override string LogoUrl => "/images/logo/leptonx/logo-light.svg";

    public override string LogoReverseUrl => "/images/logo/leptonx/logo-dark.svg";
}
