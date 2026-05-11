using Xunit;

namespace Mydoctor.EntityFrameworkCore;

[CollectionDefinition(MydoctorTestConsts.CollectionDefinitionName)]
public class MydoctorEntityFrameworkCoreCollection : ICollectionFixture<MydoctorEntityFrameworkCoreFixture>
{

}
