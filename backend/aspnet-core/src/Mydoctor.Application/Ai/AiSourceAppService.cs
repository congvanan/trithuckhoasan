using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Mydoctor.Ai.Dtos;
using Mydoctor.Permissions;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Domain.Repositories;

namespace Mydoctor.Ai;

[Authorize(MydoctorPermissions.Ai.Default)]
public class AiSourceAppService : MydoctorAppService, IAiSourceAppService
{
    private readonly IRepository<AiSource, Guid> _sourceRepository;
    private readonly IRepository<AiDocument, Guid> _documentRepository;
    private readonly IRepository<AiChunk, Guid> _chunkRepository;
    private readonly IRepository<AiIngestionJob, Guid> _jobRepository;
    private readonly IAiIngestionAppService _aiIngestionAppService;
    private readonly IEnumerable<IContentExtractor> _contentExtractors;

    public AiSourceAppService(
        IRepository<AiSource, Guid> sourceRepository,
        IRepository<AiDocument, Guid> documentRepository,
        IRepository<AiChunk, Guid> chunkRepository,
        IRepository<AiIngestionJob, Guid> jobRepository,
        IAiIngestionAppService aiIngestionAppService,
        IEnumerable<IContentExtractor> contentExtractors)
    {
        _sourceRepository = sourceRepository;
        _documentRepository = documentRepository;
        _chunkRepository = chunkRepository;
        _jobRepository = jobRepository;
        _aiIngestionAppService = aiIngestionAppService;
        _contentExtractors = contentExtractors;
    }

    public async Task<AiSourceDto> GetAsync(Guid id)
    {
        var src = await _sourceRepository.GetAsync(id);
        return src.ToDto();
    }

    public async Task<PagedResultDto<AiSourceListDto>> GetListAsync(GetAiSourceListInput input)
    {
        var q = await _sourceRepository.GetQueryableAsync();

        if (!string.IsNullOrWhiteSpace(input.Filter))
        {
            var term = input.Filter.Trim().ToLower();
            q = q.Where(x => x.Name.ToLower().Contains(term) ||
                            (x.Description != null && x.Description.ToLower().Contains(term)));
        }
        if (input.Type.HasValue) q = q.Where(x => x.Type == input.Type.Value);
        if (input.Status.HasValue) q = q.Where(x => x.Status == input.Status.Value);

        var total = await AsyncExecuter.CountAsync(q);

        var sort = string.IsNullOrWhiteSpace(input.Sorting) ? nameof(AiSource.CreationTime) + " desc" : input.Sorting;
        q = q.OrderBy(sort);
        q = q.Skip(input.SkipCount).Take(input.MaxResultCount);

        var list = await AsyncExecuter.ToListAsync(q);
        return new PagedResultDto<AiSourceListDto>(total, list.Select(x => x.ToListDto()).ToList());
    }

    [Authorize(MydoctorPermissions.Ai.Sources.Create)]
    public async Task<AiSourceDto> CreateAsync(CreateUpdateAiSourceDto input)
    {
        var entity = new AiSource(
            GuidGenerator.Create(),
            input.Name,
            input.Type,
            input.Status,
            input.Description,
            input.ConfigJson,
            CurrentTenant.Id);
        entity = await _sourceRepository.InsertAsync(entity, autoSave: true);
        return entity.ToDto();
    }

    [Authorize(MydoctorPermissions.Ai.Sources.Edit)]
    public async Task<AiSourceDto> UpdateAsync(Guid id, CreateUpdateAiSourceDto input)
    {
        var entity = await _sourceRepository.GetAsync(id);
        if (!string.IsNullOrEmpty(input.ConcurrencyStamp) && entity.ConcurrencyStamp != input.ConcurrencyStamp)
        {
            throw new BusinessException("Ai:Source:Concurrency")
                .WithData("id", id);
        }
        entity.Update(input.Type, input.Name, input.Description, input.Status, input.ConfigJson);
        await _sourceRepository.UpdateAsync(entity, autoSave: true);
        return entity.ToDto();
    }

    [Authorize(MydoctorPermissions.Ai.Sources.Delete)]
    public async Task DeleteAsync(Guid id)
    {
        var documents = (await _documentRepository.GetQueryableAsync())
            .Where(x => x.SourceId == id)
            .Select(x => x.Id)
            .ToList();

        if (documents.Count > 0)
        {
            var chunks = (await _chunkRepository.GetQueryableAsync())
                .Where(x => documents.Contains(x.DocumentId))
                .ToList();
            foreach (var chunk in chunks)
            {
                await _chunkRepository.DeleteAsync(chunk, autoSave: false);
            }

            var docs = (await _documentRepository.GetQueryableAsync())
                .Where(x => x.SourceId == id)
                .ToList();
            foreach (var doc in docs)
            {
                await _documentRepository.DeleteAsync(doc, autoSave: false);
            }
        }

        var jobs = (await _jobRepository.GetQueryableAsync())
            .Where(x => x.SourceId == id)
            .ToList();
        foreach (var job in jobs)
        {
            await _jobRepository.DeleteAsync(job, autoSave: false);
        }

        await _sourceRepository.DeleteAsync(id);
    }

    [Authorize(MydoctorPermissions.Ai.Sources.Create)]
    public async Task<AiSourcePreviewDto> PreviewAsync(PreviewAiSourceInput input)
    {
        var extractor = _contentExtractors.FirstOrDefault(e => e.CanHandle(input.Type))
            ?? throw new BusinessException("Ai:Source:UnsupportedPreview")
                .WithData("sourceType", input.Type.ToString());

        var source = new AiSource(
            GuidGenerator.Create(),
            string.IsNullOrWhiteSpace(input.Name) ? "Preview" : input.Name,
            input.Type,
            AiSourceStatus.Active,
            null,
            input.ConfigJson,
            CurrentTenant.Id);

        var payloads = await extractor.ExtractAsync(source);
        var first = payloads.FirstOrDefault()
            ?? throw new BusinessException("Ai:Source:PreviewEmpty");

        return new AiSourcePreviewDto
        {
            Title = first.Title,
            Text = first.Text,
            Url = first.Url,
            CharacterCount = first.Text.Length,
            WordCount = Regex.Matches(first.Text, @"\p{L}+", RegexOptions.IgnoreCase).Count
        };
    }

    public async Task<PagedResultDto<AiDocumentDto>> GetDocumentsAsync(GetAiDocumentListInput input)
    {
        var q = await _documentRepository.GetQueryableAsync();
        if (input.SourceId.HasValue) q = q.Where(x => x.SourceId == input.SourceId.Value);
        if (!string.IsNullOrWhiteSpace(input.Filter))
        {
            var term = input.Filter.Trim().ToLower();
            q = q.Where(x => x.Title.ToLower().Contains(term));
        }

        var total = await AsyncExecuter.CountAsync(q);
        var sort = string.IsNullOrWhiteSpace(input.Sorting) ? nameof(AiDocument.CreationTime) + " desc" : input.Sorting;
        q = q.OrderBy(sort).Skip(input.SkipCount).Take(input.MaxResultCount);
        var list = await AsyncExecuter.ToListAsync(q);
        return new PagedResultDto<AiDocumentDto>(total, list.Select(x => x.ToDto()).ToList());
    }

    [Authorize(MydoctorPermissions.Ai.Sources.Reindex)]
    public async Task<AiIngestionJobDto> ReindexAsync(Guid id)
    {
        return await _aiIngestionAppService.TriggerAsync(id);
    }
}
