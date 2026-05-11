using Mydoctor.Samples;
using Xunit;

namespace Mydoctor.EntityFrameworkCore.Applications;

[Collection(MydoctorTestConsts.CollectionDefinitionName)]
public class EfCoreSampleAppServiceTests : SampleAppServiceTests<MydoctorEntityFrameworkCoreTestModule>
{

}
