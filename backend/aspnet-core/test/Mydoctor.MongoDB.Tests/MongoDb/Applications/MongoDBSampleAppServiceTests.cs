using Mydoctor.MongoDB;
using Mydoctor.Samples;
using Xunit;

namespace Mydoctor.MongoDb.Applications;

[Collection(MydoctorTestConsts.CollectionDefinitionName)]
public class MongoDBSampleAppServiceTests : SampleAppServiceTests<MydoctorMongoDbTestModule>
{

}
