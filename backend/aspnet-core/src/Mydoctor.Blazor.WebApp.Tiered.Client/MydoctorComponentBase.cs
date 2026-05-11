using Mydoctor.Localization;
using Volo.Abp.AspNetCore.Components;

namespace Mydoctor.Blazor.WebApp.Tiered.Client;

public abstract class MydoctorComponentBase : AbpComponentBase
{
    protected MydoctorComponentBase()
    {
        LocalizationResource = typeof(MydoctorResource);
    }
}
