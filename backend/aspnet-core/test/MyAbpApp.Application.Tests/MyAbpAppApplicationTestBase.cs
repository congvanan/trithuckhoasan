using Volo.Abp.Modularity;

namespace MyAbpApp;

public abstract class MyAbpAppApplicationTestBase<TStartupModule> : MyAbpAppTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{

}
