using Volo.Abp.Modularity;

namespace Mydoctor;

[DependsOn(
    typeof(MydoctorDomainModule),
    typeof(MydoctorTestBaseModule)
)]
public class MydoctorDomainTestModule : AbpModule
{

}
