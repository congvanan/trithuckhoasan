using Volo.Abp.Modularity;

namespace MyAbpApp;

/* Inherit from this class for your domain layer tests. */
public abstract class MyAbpAppDomainTestBase<TStartupModule> : MyAbpAppTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{

}
