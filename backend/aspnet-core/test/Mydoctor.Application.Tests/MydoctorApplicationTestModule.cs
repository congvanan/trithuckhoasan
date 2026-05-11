using Volo.Abp.Modularity;

namespace Mydoctor;

[DependsOn(
    typeof(MydoctorApplicationModule),
    typeof(MydoctorDomainTestModule)
)]
public class MydoctorApplicationTestModule : AbpModule
{

}
