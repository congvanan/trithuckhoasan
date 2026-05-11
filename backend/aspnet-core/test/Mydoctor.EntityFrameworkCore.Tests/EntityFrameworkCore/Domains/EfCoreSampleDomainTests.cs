using Mydoctor.Samples;
using Xunit;

namespace Mydoctor.EntityFrameworkCore.Domains;

[Collection(MydoctorTestConsts.CollectionDefinitionName)]
public class EfCoreSampleDomainTests : SampleDomainTests<MydoctorEntityFrameworkCoreTestModule>
{

}
