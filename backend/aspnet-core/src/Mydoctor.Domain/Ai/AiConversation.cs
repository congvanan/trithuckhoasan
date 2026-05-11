using System;
using System.Collections.Generic;
using Volo.Abp.Domain.Entities.Auditing;
using Volo.Abp.MultiTenancy;

namespace Mydoctor.Ai;

public class AiConversation : FullAuditedAggregateRoot<Guid>, IMultiTenant
{
    public Guid? TenantId { get; protected set; }

    /// <summary>Authenticated user if signed in, otherwise null for anonymous widget visitors.</summary>
    public Guid? UserId { get; protected set; }

    /// <summary>Client-side session id so anonymous visitors can resume conversations.</summary>
    public string SessionId { get; protected set; } = default!;

    public string? Title { get; protected set; }

    public string? ClientIp { get; protected set; }

    public string? UserAgent { get; protected set; }

    public int MessageCount { get; protected set; }

    public virtual ICollection<AiMessage> Messages { get; protected set; } = new List<AiMessage>();

    protected AiConversation() { }

    public AiConversation(
        Guid id,
        string sessionId,
        Guid? userId = null,
        string? title = null,
        string? clientIp = null,
        string? userAgent = null,
        Guid? tenantId = null) : base(id)
    {
        SessionId = sessionId;
        UserId = userId;
        Title = title;
        ClientIp = clientIp;
        UserAgent = userAgent;
        TenantId = tenantId;
    }

    public void SetTitle(string title) => Title = title;

    public void IncrementMessageCount() => MessageCount++;
}
