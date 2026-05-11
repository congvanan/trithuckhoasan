using Mydoctor.Localization;
using Volo.Abp.AspNetCore.Components;

namespace Mydoctor.Blazor.Server.Tiered;

public abstract class MydoctorComponentBase : AbpComponentBase
{
    protected MydoctorComponentBase()
    {
        LocalizationResource = typeof(MydoctorResource);
    }
}
