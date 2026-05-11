using Mydoctor.Localization;
using Volo.Abp.AspNetCore.Components;

namespace Mydoctor.Blazor.Client;

public abstract class MydoctorComponentBase : AbpComponentBase
{
    protected MydoctorComponentBase()
    {
        LocalizationResource = typeof(MydoctorResource);
    }
}
