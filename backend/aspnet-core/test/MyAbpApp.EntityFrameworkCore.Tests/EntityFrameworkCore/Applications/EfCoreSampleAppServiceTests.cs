using MyAbpApp.Samples;
using Xunit;

namespace MyAbpApp.EntityFrameworkCore.Applications;

[Collection(MyAbpAppTestConsts.CollectionDefinitionName)]
public class EfCoreSampleAppServiceTests : SampleAppServiceTests<MyAbpAppEntityFrameworkCoreTestModule>
{

}
