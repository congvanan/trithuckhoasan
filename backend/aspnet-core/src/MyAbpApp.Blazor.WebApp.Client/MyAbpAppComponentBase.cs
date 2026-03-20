using MyAbpApp.Localization;
using Volo.Abp.AspNetCore.Components;

namespace MyAbpApp.Blazor.WebApp.Client;

public abstract class MyAbpAppComponentBase : AbpComponentBase
{
    protected MyAbpAppComponentBase()
    {
        LocalizationResource = typeof(MyAbpAppResource);
    }
}
