using MyAbpApp.Localization;
using Volo.Abp.AspNetCore.Components;

namespace MyAbpApp.Blazor.Server;

public abstract class MyAbpAppComponentBase : AbpComponentBase
{
    protected MyAbpAppComponentBase()
    {
        LocalizationResource = typeof(MyAbpAppResource);
    }
}
