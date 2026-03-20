using Xunit;

namespace MyAbpApp.EntityFrameworkCore;

[CollectionDefinition(MyAbpAppTestConsts.CollectionDefinitionName)]
public class MyAbpAppEntityFrameworkCoreCollection : ICollectionFixture<MyAbpAppEntityFrameworkCoreFixture>
{

}
