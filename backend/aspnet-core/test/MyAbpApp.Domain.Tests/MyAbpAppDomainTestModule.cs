using Volo.Abp.Modularity;

namespace MyAbpApp;

[DependsOn(
    typeof(MyAbpAppDomainModule),
    typeof(MyAbpAppTestBaseModule)
)]
public class MyAbpAppDomainTestModule : AbpModule
{

}
