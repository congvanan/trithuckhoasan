using Volo.Abp.Modularity;

namespace Mydoctor;

/* Inherit from this class for your domain layer tests. */
public abstract class MydoctorDomainTestBase<TStartupModule> : MydoctorTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{

}
