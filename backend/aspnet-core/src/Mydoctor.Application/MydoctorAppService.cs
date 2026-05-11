using System;
using System.Collections.Generic;
using System.Text;
using Mydoctor.Localization;
using Volo.Abp.Application.Services;

namespace Mydoctor;

/* Inherit your application services from this class.
 */
public abstract class MydoctorAppService : ApplicationService
{
    protected MydoctorAppService()
    {
        LocalizationResource = typeof(MydoctorResource);
    }
}
