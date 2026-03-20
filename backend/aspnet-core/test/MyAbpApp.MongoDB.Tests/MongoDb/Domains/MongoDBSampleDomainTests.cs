using MyAbpApp.Samples;
using Xunit;

namespace MyAbpApp.MongoDB.Domains;

[Collection(MyAbpAppTestConsts.CollectionDefinitionName)]
public class MongoDBSampleDomainTests : SampleDomainTests<MyAbpAppMongoDbTestModule>
{

}
