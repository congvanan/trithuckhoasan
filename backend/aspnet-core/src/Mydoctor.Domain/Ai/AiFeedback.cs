using System;
using Volo.Abp.Domain.Entities.Auditing;
using Volo.Abp.MultiTenancy;

namespace Mydoctor.Ai;

public class AiFeedback : CreationAuditedEntity<Guid>, IMultiTenant
{
    public Guid? TenantId { get; protected set; }

    public Guid MessageId { get; protected set; }

    public Guid ConversationId { get; protected set; }

    public AiFeedbackRating Rating { get; protected set; }

    public string? Comment { get; protected set; }

    protected AiFeedback() { }

    public AiFeedback(
        Guid id,
        Guid messageId,
        Guid conversationId,
        AiFeedbackRating rating,
        string? comment = null,
        Guid? tenantId = null) : base(id)
    {
        MessageId = messageId;
        ConversationId = conversationId;
        Rating = rating;
        Comment = comment;
        TenantId = tenantId;
    }
}
