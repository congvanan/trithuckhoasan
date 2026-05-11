using Mydoctor.Samples;
using Xunit;

namespace Mydoctor.MongoDB.Domains;

[Collection(MydoctorTestConsts.CollectionDefinitionName)]
public class MongoDBSampleDomainTests : SampleDomainTests<MydoctorMongoDbTestModule>
{

}
