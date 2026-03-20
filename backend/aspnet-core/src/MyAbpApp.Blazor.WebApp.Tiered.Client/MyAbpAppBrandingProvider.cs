using Microsoft.Extensions.Localization;
using MyAbpApp.Localization;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Ui.Branding;

namespace MyAbpApp.Blazor.WebApp.Tiered.Client;

[Dependency(ReplaceServices = true)]
public class MyAbpAppBrandingProvider : DefaultBrandingProvider
{
    private IStringLocalizer<MyAbpAppResource> _localizer;

    public MyAbpAppBrandingProvider(IStringLocalizer<MyAbpAppResource> localizer)
    {
        _localizer = localizer;
    }

    public override string AppName => _localizer["AppName"];
}
