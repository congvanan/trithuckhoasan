using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using Mydoctor.Ai.Dtos;
using Mydoctor.Permissions;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Domain.Repositories;
using System.Linq.Dynamic.Core;

namespace Mydoctor.Ai;

[Authorize(MydoctorPermissions.Ai.Jobs.Default)]
public class AiIngestionAppService : MydoctorAppService, IAiIngestionAppService
{
    private readonly IRepository<AiIngestionJob, Guid> _jobRepository;
    private readonly IRepository<AiSource, Guid> _sourceRepository;
    private readonly IRepository<AiDocument, Guid> _documentRepository;
    private readonly IVectorStore _vectorStore;
    private readonly IEmbeddingPipeline _embeddingPipeline;
    private readonly IEnumerable<IContentExtractor> _contentExtractors;
    private readonly ILogger<AiIngestionAppService> _logger;

    public AiIngestionAppService(
        IRepository<AiIngestionJob, Guid> jobRepository,
        IRepository<AiSource, Guid> sourceRepository,
        IRepository<AiDocument, Guid> documentRepository,
        IVectorStore vectorStore,
        IEmbeddingPipeline embeddingPipeline,
        IEnumerable<IContentExtractor> contentExtractors,
        ILogger<AiIngestionAppService> logger)
    {
        _jobRepository = jobRepository;
        _sourceRepository = sourceRepository;
        _documentRepository = documentRepository;
        _vectorStore = vectorStore;
        _embeddingPipeline = embeddingPipeline;
        _contentExtractors = contentExtractors;
        _logger = logger;
    }

    public async Task<PagedResultDto<AiIngestionJobDto>> GetListAsync(GetAiIngestionJobListInput input)
    {
        var q = await _jobRepository.GetQueryableAsync();
        var sourceQ = await _sourceRepository.GetQueryableAsync();

        if (input.SourceId.HasValue) q = q.Where(x => x.SourceId == input.SourceId.Value);
        if (input.Status.HasValue) q = q.Where(x => x.Status == input.Status.Value);

        var joined = from j in q
                     join s in sourceQ on j.SourceId equals s.Id into sj
                     from sub in sj.DefaultIfEmpty()
                     select new { Job = j, SourceName = sub != null ? sub.Name : null };

        var total = await AsyncExecuter.CountAsync(joined);
        var sort = string.IsNullOrWhiteSpace(input.Sorting) ? nameof(AiIngestionJob.CreationTime) + " desc" : input.Sorting;

        var ordered = joined.OrderBy("Job." + sort).Skip(input.SkipCount).Take(input.MaxResultCount);
        var list = await AsyncExecuter.ToListAsync(ordered);
        return new PagedResultDto<AiIngestionJobDto>(total, list.Select(x => x.Job.ToDto(x.SourceName)).ToList());
    }

    public async Task<AiIngestionJobDto> GetAsync(Guid id)
    {
        var job = await _jobRepository.GetAsync(id);
        var source = await _sourceRepository.FindAsync(job.SourceId);
        return job.ToDto(source?.Name);
    }

    [Authorize(MydoctorPermissions.Ai.Sources.Reindex)]
    public async Task<AiIngestionJobDto> TriggerAsync(Guid sourceId)
    {
        var src = await _sourceRepository.GetAsync(sourceId);
        var job = new AiIngestionJob(GuidGenerator.Create(), src.Id, CurrentTenant.Id);
        await _jobRepository.InsertAsync(job, autoSave: true);
        await RunJobAsync(job, src);
        return job.ToDto(src.Name);
    }

    [Authorize(MydoctorPermissions.Ai.Jobs.Cancel)]
    public async Task CancelAsync(Guid id)
    {
        var job = await _jobRepository.GetAsync(id);
        if (job.Status is AiJobStatus.Completed or AiJobStatus.Failed or AiJobStatus.Cancelled)
            throw new BusinessException("Ai:Job:AlreadyFinalized");
        job.Cancel();
        await _jobRepository.UpdateAsync(job, autoSave: true);
    }

    [Authorize(MydoctorPermissions.Ai.Jobs.Delete)]
    public async Task DeleteAsync(Guid id)
    {
        await DeleteFinalizedJobAsync(id);
    }

    [Authorize(MydoctorPermissions.Ai.Jobs.Delete)]
    public async Task DeleteJobAsync(DeleteAiIngestionJobInput input)
    {
        await DeleteFinalizedJobAsync(input.Id);
    }

    [Authorize(MydoctorPermissions.Ai.Jobs.Delete)]
    public async Task ClearFailedAsync()
    {
        var jq = await _jobRepository.GetQueryableAsync();
        var failedJobs = jq
            .Where(j => j.Status == AiJobStatus.Failed || j.Status == AiJobStatus.Cancelled)
            .ToList();

        foreach (var failedJob in failedJobs)
        {
            await _jobRepository.DeleteAsync(failedJob, autoSave: false);
        }
    }

    [Authorize(MydoctorPermissions.Ai.Sources.Reindex)]
    public async Task<AiIngestionResultDto> IngestTextAsync(IngestTextInput input)
    {
        var sw = Stopwatch.StartNew();
        var source = await _sourceRepository.GetAsync(input.SourceId);
        if (source.Status != AiSourceStatus.Active)
            throw new BusinessException("Ai:Source:Inactive").WithData("sourceId", source.Id);

        var payload = new ContentPayload(
            source.Id,
            input.Title ?? source.Name,
            input.Content,
            input.ExternalId,
            input.Url);

        var (docId, chunkCount) = await IngestPayloadAsync(payload, source);
        await UpdateSourceStatsAsync(source);

        sw.Stop();
        return new AiIngestionResultDto { DocumentId = docId, ChunkCount = chunkCount, LatencyMs = (int)sw.ElapsedMilliseconds };
    }

    private async Task RunJobAsync(AiIngestionJob job, AiSource source)
    {
        try
        {
            var extractor = _contentExtractors.FirstOrDefault(e => e.CanHandle(source.Type))
                ?? throw new BusinessException("Ai:Source:UnsupportedReindex")
                    .WithData("sourceType", source.Type.ToString());

            var payloads = await extractor.ExtractAsync(source);
            job.Start(payloads.Count);
            await _jobRepository.UpdateAsync(job, autoSave: true);

            var processedChunks = 0;
            var completedItems = 0;
            foreach (var payload in payloads)
            {
                var (_, chunkCount) = await IngestPayloadAsync(payload, source);
                processedChunks += chunkCount;
                completedItems++;
                job.ReportProgress(completedItems, payloads.Count, processedChunks);
                await _jobRepository.UpdateAsync(job, autoSave: true);
            }

            source.SetStatus(AiSourceStatus.Active);
            await UpdateSourceStatsAsync(source);
            job.Complete(completedItems, processedChunks);
            await _jobRepository.UpdateAsync(job, autoSave: true);
            await DeleteStaleFailedJobsAsync(source.Id, job.Id);
        }
        catch (Exception ex)
        {
            var errorMessage = FormatIngestionError(ex);

            _logger.LogError(ex, "AI ingestion job failed for source {SourceId} ({SourceType}). Error: {Error}",
                source.Id, source.Type, errorMessage);

            source.SetStatus(AiSourceStatus.Error);
            await _sourceRepository.UpdateAsync(source, autoSave: true);
            job.Fail(errorMessage);
            await _jobRepository.UpdateAsync(job, autoSave: true);
        }
    }

    private static string FormatIngestionError(Exception ex)
    {
        if (ex is not BusinessException be)
        {
            return ex.Message;
        }

        var parts = new List<string>();
        parts.Add(string.IsNullOrWhiteSpace(be.Code) ? be.Message : be.Code);

        if (be.Data.Contains("provider"))
        {
            parts.Add($"provider={be.Data["provider"]}");
        }

        if (be.Data.Contains("status"))
        {
            parts.Add($"HTTP {be.Data["status"]}");
        }

        if (be.Data.Contains("body"))
        {
            parts.Add(Convert.ToString(be.Data["body"]) ?? string.Empty);
        }
        else if (!string.IsNullOrWhiteSpace(be.Message) && !string.Equals(be.Message, be.Code, StringComparison.Ordinal))
        {
            parts.Add(be.Message);
        }

        return string.Join(" | ", parts.Where(x => !string.IsNullOrWhiteSpace(x)));
    }

    private async Task<(Guid DocumentId, int ChunkCount)> IngestPayloadAsync(ContentPayload payload, AiSource source)
    {
        var hash = Sha256(payload.Text);

        AiDocument? doc = null;
        if (!string.IsNullOrEmpty(payload.ExternalId))
        {
            var dq = await _documentRepository.GetQueryableAsync();
            doc = dq.FirstOrDefault(d => d.SourceId == source.Id && d.ExternalId == payload.ExternalId);
        }

        if (doc == null)
        {
            doc = new AiDocument(GuidGenerator.Create(), source.Id, payload.Title,
                externalId: payload.ExternalId, url: payload.Url, contentHash: hash, tenantId: CurrentTenant.Id);
            await _documentRepository.InsertAsync(doc, autoSave: true);
        }
        else if (doc.ContentHash == hash)
        {
            return (doc.Id, doc.ChunkCount);
        }
        else
        {
            doc.Update(payload.Title, payload.Url, hash, doc.MetadataJson);
            await _vectorStore.DeleteByDocumentAsync(doc.Id);
        }

        var chunks = await _embeddingPipeline.ProcessAsync(payload, doc.Id, CurrentTenant.Id);
        await _vectorStore.UpsertChunksAsync(chunks);

        doc.MarkIndexed(chunks.Count);
        await _documentRepository.UpdateAsync(doc, autoSave: true);

        return (doc.Id, chunks.Count);
    }

    private async Task UpdateSourceStatsAsync(AiSource source)
    {
        var dq = await _documentRepository.GetQueryableAsync();
        var docs = dq.Where(d => d.SourceId == source.Id).ToList();
        source.MarkIndexed(docs.Count, docs.Sum(d => d.ChunkCount));
        await _sourceRepository.UpdateAsync(source, autoSave: true);
    }

    private async Task DeleteStaleFailedJobsAsync(Guid sourceId, Guid currentJobId)
    {
        var jq = await _jobRepository.GetQueryableAsync();
        var staleJobs = jq
            .Where(j => j.SourceId == sourceId &&
                        j.Id != currentJobId &&
                        (j.Status == AiJobStatus.Failed || j.Status == AiJobStatus.Cancelled))
            .ToList();

        foreach (var staleJob in staleJobs)
        {
            await _jobRepository.DeleteAsync(staleJob, autoSave: false);
        }
    }

    private async Task DeleteFinalizedJobAsync(Guid id)
    {
        var job = await _jobRepository.GetAsync(id);
        if (job.Status is AiJobStatus.Pending or AiJobStatus.Running)
            throw new BusinessException("Ai:Job:CannotDeleteActive");

        await _jobRepository.DeleteAsync(job, autoSave: true);
    }

    private async Task<int> GetIntSetting(string key, int fallback)
    {
        var raw = await SettingProvider.GetOrNullAsync(key);
        return int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out var v) ? v : fallback;
    }

    private static string Sha256(string text)
    {
        using var sha = SHA256.Create();
        var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(text));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
