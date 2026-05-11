using Volo.Abp.Modularity;

namespace Mydoctor;

public abstract class MydoctorApplicationTestBase<TStartupModule> : MydoctorTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{

}
