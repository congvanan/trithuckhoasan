using Microsoft.EntityFrameworkCore;
using Mydoctor.Ai;
using Volo.Abp;
using Volo.Abp.EntityFrameworkCore.Modeling;

namespace Mydoctor.EntityFrameworkCore;

public static class AiDbContextModelCreatingExtensions
{
    public static void ConfigureAi(this ModelBuilder builder)
    {
        Check.NotNull(builder, nameof(builder));

        builder.HasPostgresExtension("vector");
        // pgvectorscale adds StreamingDiskANN index (better throughput than HNSW at scale)
        builder.HasPostgresExtension("vectorscale");

        builder.Entity<AiSource>(b =>
        {
            b.ToTable(MydoctorConsts.DbTablePrefix + "AiSources", MydoctorConsts.DbSchema);
            b.ConfigureByConvention();

            b.Property(x => x.Name).IsRequired().HasMaxLength(AiConsts.MaxSourceNameLength);
            b.Property(x => x.Description).HasMaxLength(AiConsts.MaxSourceDescriptionLength);
            b.Property(x => x.Type).HasConversion<byte>();
            b.Property(x => x.Status).HasConversion<byte>();
            b.Property(x => x.ConfigJson).HasColumnType("jsonb");

            b.HasIndex(x => new { x.TenantId, x.Type });
            b.HasIndex(x => new { x.TenantId, x.Status });
        });

        builder.Entity<AiDocument>(b =>
        {
            b.ToTable(MydoctorConsts.DbTablePrefix + "AiDocuments", MydoctorConsts.DbSchema);
            b.ConfigureByConvention();

            b.Property(x => x.Title).IsRequired().HasMaxLength(AiConsts.MaxDocumentTitleLength);
            b.Property(x => x.Url).HasMaxLength(AiConsts.MaxDocumentUrlLength);
            b.Property(x => x.ExternalId).HasMaxLength(AiConsts.MaxExternalIdLength);
            b.Property(x => x.ContentHash).HasMaxLength(AiConsts.MaxContentHashLength);
            b.Property(x => x.MetadataJson).HasColumnType("jsonb");

            b.HasIndex(x => x.SourceId);
            b.HasIndex(x => new { x.SourceId, x.ExternalId });
            b.HasIndex(x => x.ContentHash);
        });

        builder.Entity<AiChunk>(b =>
        {
            b.ToTable(MydoctorConsts.DbTablePrefix + "AiChunks", MydoctorConsts.DbSchema);
            b.ConfigureByConvention();

            b.Property(x => x.Text).IsRequired().HasMaxLength(AiConsts.MaxChunkTextLength);
            b.Property(x => x.EmbeddingModel).HasMaxLength(AiConsts.MaxEmbeddingModelLength);
            b.Property(x => x.MetadataJson).HasColumnType("jsonb");

            // Fixed-dimension vector column; required by pgvector HNSW index
            b.Property(x => x.Embedding).HasColumnType($"vector({AiConsts.EmbeddingDimensions})");

            b.HasIndex(x => x.DocumentId);
            b.HasIndex(x => x.SourceId);

            // StreamingDiskANN index for cosine similarity — better throughput than HNSW at scale.
            b.HasIndex(x => x.Embedding)
                .HasMethod("diskann")
                .HasOperators("vector_cosine_ops");
        });

        builder.Entity<AiConversation>(b =>
        {
            b.ToTable(MydoctorConsts.DbTablePrefix + "AiConversations", MydoctorConsts.DbSchema);
            b.ConfigureByConvention();

            b.Property(x => x.SessionId).IsRequired().HasMaxLength(AiConsts.MaxSessionIdLength);
            b.Property(x => x.Title).HasMaxLength(AiConsts.MaxConversationTitleLength);
            b.Property(x => x.ClientIp).HasMaxLength(64);
            b.Property(x => x.UserAgent).HasMaxLength(512);

            b.HasMany(x => x.Messages).WithOne().HasForeignKey(x => x.ConversationId).IsRequired();

            b.HasIndex(x => x.SessionId);
            b.HasIndex(x => x.UserId);
            b.HasIndex(x => x.CreationTime);
        });

        builder.Entity<AiMessage>(b =>
        {
            b.ToTable(MydoctorConsts.DbTablePrefix + "AiMessages", MydoctorConsts.DbSchema);
            b.ConfigureByConvention();

            b.Property(x => x.Role).HasConversion<byte>();
            b.Property(x => x.Content).IsRequired().HasMaxLength(AiConsts.MaxMessageContentLength);
            b.Property(x => x.CitationsJson).HasColumnType("jsonb");
            b.Property(x => x.LlmModel).HasMaxLength(AiConsts.MaxLlmModelLength);

            b.HasIndex(x => x.ConversationId);
            b.HasIndex(x => x.CreationTime);
        });

        builder.Entity<AiIngestionJob>(b =>
        {
            b.ToTable(MydoctorConsts.DbTablePrefix + "AiIngestionJobs", MydoctorConsts.DbSchema);
            b.ConfigureByConvention();

            b.Property(x => x.Status).HasConversion<byte>();
            b.Property(x => x.Error).HasMaxLength(AiConsts.MaxJobErrorLength);

            b.HasIndex(x => x.SourceId);
            b.HasIndex(x => x.Status);
            b.HasIndex(x => x.CreationTime);
        });

        builder.Entity<AiFeedback>(b =>
        {
            b.ToTable(MydoctorConsts.DbTablePrefix + "AiFeedbacks", MydoctorConsts.DbSchema);
            b.ConfigureByConvention();

            b.Property(x => x.Rating).HasConversion<byte>();
            b.Property(x => x.Comment).HasMaxLength(AiConsts.MaxFeedbackCommentLength);

            b.HasIndex(x => x.MessageId);
            b.HasIndex(x => x.ConversationId);
        });
    }
}
