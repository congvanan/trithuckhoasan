using System;
using System.Text.Json;
using Mydoctor.Ai.Dtos;

namespace Mydoctor.Ai;

internal static class AiMappers
{
    public static AiSourceDto ToDto(this AiSource e) => new()
    {
        Id = e.Id,
        Name = e.Name,
        Description = e.Description,
        Type = e.Type,
        Status = e.Status,
        ConfigJson = e.ConfigJson,
        LastIndexedAt = e.LastIndexedAt,
        DocumentCount = e.DocumentCount,
        ChunkCount = e.ChunkCount,
        CreationTime = e.CreationTime,
        CreatorId = e.CreatorId,
        LastModificationTime = e.LastModificationTime,
        LastModifierId = e.LastModifierId,
        IsDeleted = e.IsDeleted,
        ConcurrencyStamp = e.ConcurrencyStamp
    };

    public static AiSourceListDto ToListDto(this AiSource e) => new()
    {
        Id = e.Id,
        Name = e.Name,
        Type = e.Type,
        Status = e.Status,
        LastIndexedAt = e.LastIndexedAt,
        DocumentCount = e.DocumentCount,
        ChunkCount = e.ChunkCount,
        CreationTime = e.CreationTime
    };

    public static AiDocumentDto ToDto(this AiDocument e) => new()
    {
        Id = e.Id,
        SourceId = e.SourceId,
        ExternalId = e.ExternalId,
        Title = e.Title,
        Url = e.Url,
        ChunkCount = e.ChunkCount,
        LastIndexedAt = e.LastIndexedAt,
        CreationTime = e.CreationTime
    };

    public static AiIngestionJobDto ToDto(this AiIngestionJob e, string? sourceName = null) => new()
    {
        Id = e.Id,
        SourceId = e.SourceId,
        SourceName = sourceName,
        Status = e.Status,
        Progress = e.Progress,
        Total = e.Total,
        ProcessedDocumentCount = e.ProcessedDocumentCount,
        ProcessedChunkCount = e.ProcessedChunkCount,
        Error = e.Error,
        StartedAt = e.StartedAt,
        FinishedAt = e.FinishedAt,
        CreationTime = e.CreationTime
    };

    public static AiMessageDto ToDto(this AiMessage e) => new()
    {
        Id = e.Id,
        ConversationId = e.ConversationId,
        Role = e.Role,
        Content = e.Content,
        CitationsJson = e.CitationsJson,
        LlmModel = e.LlmModel,
        TokensIn = e.TokensIn,
        TokensOut = e.TokensOut,
        LatencyMs = e.LatencyMs,
        CreationTime = e.CreationTime
    };

    public static AiFeedbackDto ToDto(this AiFeedback e) => new()
    {
        Id = e.Id,
        MessageId = e.MessageId,
        ConversationId = e.ConversationId,
        Rating = e.Rating,
        Comment = e.Comment,
        CreationTime = e.CreationTime
    };

    public static string Mask(string? apiKey)
    {
        if (string.IsNullOrEmpty(apiKey)) return string.Empty;
        if (apiKey.Length <= 8) return new string('*', apiKey.Length);
        return apiKey[..4] + new string('*', Math.Min(20, apiKey.Length - 8)) + apiKey[^4..];
    }
}
