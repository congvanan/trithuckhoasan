using MyAbpApp.Samples;
using Xunit;

namespace MyAbpApp.EntityFrameworkCore.Domains;

[Collection(MyAbpAppTestConsts.CollectionDefinitionName)]
public class EfCoreSampleDomainTests : SampleDomainTests<MyAbpAppEntityFrameworkCoreTestModule>
{

}
