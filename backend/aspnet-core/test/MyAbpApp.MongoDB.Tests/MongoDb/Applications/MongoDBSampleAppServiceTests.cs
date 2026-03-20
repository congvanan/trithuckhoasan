using MyAbpApp.MongoDB;
using MyAbpApp.Samples;
using Xunit;

namespace MyAbpApp.MongoDb.Applications;

[Collection(MyAbpAppTestConsts.CollectionDefinitionName)]
public class MongoDBSampleAppServiceTests : SampleAppServiceTests<MyAbpAppMongoDbTestModule>
{

}
