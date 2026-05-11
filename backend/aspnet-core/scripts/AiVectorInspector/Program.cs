using System.Data;
using Npgsql;

var options = ParseArgs(args);
await using var connection = new NpgsqlConnection(options.ConnectionString);
await connection.OpenAsync();

var sourceTable = await ResolveTableNameAsync(connection, "AppAiSources", "MydoctorAiSources");
var documentTable = await ResolveTableNameAsync(connection, "AppAiDocuments", "MydoctorAiDocuments");
var chunkTable = await ResolveTableNameAsync(connection, "AppAiChunks", "MydoctorAiChunks");
var jobTable = await ResolveTableNameAsync(connection, "AppAiIngestionJobs", "MydoctorAiIngestionJobs");

if (sourceTable is null || documentTable is null || chunkTable is null || jobTable is null)
{
    Console.ForegroundColor = ConsoleColor.Yellow;
    Console.WriteLine("Khong tim thay day du bang AI trong database hien tai.");
    Console.ResetColor();

    await WriteSectionAsync(connection, "Available AI-like Tables", """
        select table_schema as "Schema", table_name as "TableName"
        from information_schema.tables
        where table_type = 'BASE TABLE'
          and table_name ilike '%ai%'
        order by table_schema, table_name;
        """, new Dictionary<string, object?>());

    Console.WriteLine();
    Console.WriteLine("Hay kiem tra lai migration hoac connection string cua DB AI.");
    return;
}

var sourceTableSql = QuoteIdentifier(sourceTable);
var documentTableSql = QuoteIdentifier(documentTable);
var chunkTableSql = QuoteIdentifier(chunkTable);
var jobTableSql = QuoteIdentifier(jobTable);

Console.ForegroundColor = ConsoleColor.DarkGray;
Console.WriteLine($"Connection: {options.ConnectionString}");
if (!string.IsNullOrWhiteSpace(options.SourceId))
{
    Console.WriteLine($"Filter SourceId: {options.SourceId}");
}
if (!string.IsNullOrWhiteSpace(options.SourceName))
{
    Console.WriteLine($"Filter SourceName: {options.SourceName}");
}
Console.ResetColor();

var filters = new List<string>();
var filterParameters = new Dictionary<string, object?>();

if (!string.IsNullOrWhiteSpace(options.SourceId))
{
    filters.Add(@"""Id"" = @sourceId");
    filterParameters["sourceId"] = Guid.Parse(options.SourceId);
}

if (!string.IsNullOrWhiteSpace(options.SourceName))
{
    filters.Add(@"""Name"" ILIKE @sourceName");
    filterParameters["sourceName"] = $"%{options.SourceName}%";
}

var sourceWhere = filters.Count > 0 ? string.Join(" and ", filters) : "1 = 1";
var chunkPreviewLength = options.IncludeChunkText ? 300 : 120;

await WriteSectionAsync(
    connection,
    "Database Summary",
    $"""
    select '{sourceTable}' as "TableName", count(*) as "Count" from {sourceTableSql}
    union all
    select '{documentTable}', count(*) from {documentTableSql}
    union all
    select '{chunkTable}', count(*) from {chunkTableSql}
    union all
    select '{jobTable}', count(*) from {jobTableSql};
    """,
    new Dictionary<string, object?>());

await WriteSectionAsync(
    connection,
    "Sources",
    $"""
    select
      "Id",
      "Name",
      "Type",
      "Status",
      "DocumentCount",
      "ChunkCount",
      "LastIndexedAt",
      "CreationTime"
    from {sourceTableSql}
    where {sourceWhere}
    order by "CreationTime" desc
    limit @top;
    """,
    WithTop(filterParameters, options.Top));

await WriteSectionAsync(
    connection,
    "Documents",
    $"""
    select
      d."Id",
      d."SourceId",
      d."Title",
      d."ExternalId",
      d."Url",
      d."ChunkCount",
      d."ContentHash",
      d."LastIndexedAt",
      d."CreationTime"
    from {documentTableSql} d
    where d."SourceId" in (
      select "Id" from {sourceTableSql} where {sourceWhere}
    )
    order by d."CreationTime" desc
    limit @top;
    """,
    WithTop(filterParameters, options.Top));

await WriteSectionAsync(
    connection,
    "Chunks",
    $"""
    select
      c."Id",
      c."SourceId",
      c."DocumentId",
      c."ChunkIndex",
      left(c."Text", {chunkPreviewLength}) as "TextPreview",
      c."TokenCount",
      c."EmbeddingModel",
      (c."Embedding" is not null) as "HasEmbedding",
      vector_dims(c."Embedding") as "EmbeddingDims",
      c."CreationTime"
    from {chunkTableSql} c
    where c."SourceId" in (
      select "Id" from {sourceTableSql} where {sourceWhere}
    )
    order by c."CreationTime" desc
    limit @top;
    """,
    WithTop(filterParameters, options.Top));

await WriteSectionAsync(
    connection,
    "Ingestion Jobs",
    $"""
    select
      j."Id",
      j."SourceId",
      s."Name" as "SourceName",
      j."Status",
      j."Progress",
      j."Total",
      j."ProcessedDocumentCount",
      j."ProcessedChunkCount",
      j."Error",
      j."StartedAt",
      j."FinishedAt",
      j."CreationTime"
    from {jobTableSql} j
    left join {sourceTableSql} s on s."Id" = j."SourceId"
    where j."SourceId" in (
      select "Id" from {sourceTableSql} where {sourceWhere}
    )
    order by j."CreationTime" desc
    limit @top;
    """,
    WithTop(filterParameters, options.Top));

await WriteSectionAsync(
    connection,
    "Vector Health",
    $"""
    select
      count(*) filter (where c."Embedding" is null) as "ChunksMissingEmbedding",
      count(*) filter (where c."Embedding" is not null) as "ChunksWithEmbedding",
      min(vector_dims(c."Embedding")) filter (where c."Embedding" is not null) as "MinEmbeddingDims",
      max(vector_dims(c."Embedding")) filter (where c."Embedding" is not null) as "MaxEmbeddingDims"
    from {chunkTableSql} c
    where c."SourceId" in (
      select "Id" from {sourceTableSql} where {sourceWhere}
    );
    """,
    new Dictionary<string, object?>(filterParameters));

return;

static async Task WriteSectionAsync(
    NpgsqlConnection connection,
    string title,
    string sql,
    Dictionary<string, object?> parameters)
{
    Console.WriteLine();
    Console.ForegroundColor = ConsoleColor.Cyan;
    Console.WriteLine($"=== {title} ===");
    Console.ResetColor();

    var rows = await QueryAsync(connection, sql, parameters);
    if (rows.Count == 0)
    {
        Console.WriteLine("(khong co du lieu)");
        return;
    }

    PrintTable(rows);
}

static async Task<List<Dictionary<string, string>>> QueryAsync(
    NpgsqlConnection connection,
    string sql,
    Dictionary<string, object?> parameters)
{
    await using var cmd = new NpgsqlCommand(sql, connection);
    foreach (var entry in parameters)
    {
        cmd.Parameters.AddWithValue(entry.Key, entry.Value ?? DBNull.Value);
    }

    await using var reader = await cmd.ExecuteReaderAsync();
    var rows = new List<Dictionary<string, string>>();

    while (await reader.ReadAsync())
    {
        var row = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        for (var i = 0; i < reader.FieldCount; i++)
        {
            var value = reader.IsDBNull(i) ? "" : Convert.ToString(reader.GetValue(i)) ?? "";
            row[reader.GetName(i)] = value;
        }
        rows.Add(row);
    }

    return rows;
}

static async Task<string?> ResolveTableNameAsync(NpgsqlConnection connection, params string[] candidates)
{
    const string sql = """
    select table_name
    from information_schema.tables
    where table_type = 'BASE TABLE'
      and table_name = any(@candidates)
    order by case
      when table_name = @firstCandidate then 0
      else 1
    end
    limit 1;
    """;

    var parameters = new Dictionary<string, object?>
    {
        ["candidates"] = candidates,
        ["firstCandidate"] = candidates[0]
    };

    var rows = await QueryAsync(connection, sql, parameters);
    return rows.Count == 0 ? null : rows[0]["table_name"];
}

static string QuoteIdentifier(string identifier)
{
    return "\"" + identifier.Replace("\"", "\"\"") + "\"";
}

static void PrintTable(List<Dictionary<string, string>> rows)
{
    var columns = rows[0].Keys.ToList();
    var widths = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

    foreach (var column in columns)
    {
        var maxValueWidth = rows.Max(row => row[column].Length);
        widths[column] = Math.Min(Math.Max(column.Length, maxValueWidth), 60);
    }

    Console.WriteLine(string.Join(" | ", columns.Select(c => Pad(rows: null, value: c, widths[c]))));
    Console.WriteLine(string.Join("-+-", columns.Select(c => new string('-', widths[c]))));

    foreach (var row in rows)
    {
        Console.WriteLine(string.Join(" | ", columns.Select(c => Pad(rows, row[c], widths[c]))));
    }
}

static string Pad(List<Dictionary<string, string>>? rows, string value, int width)
{
    var trimmed = value.Replace(Environment.NewLine, " ");
    if (trimmed.Length > width)
    {
        trimmed = trimmed[..Math.Max(0, width - 3)] + "...";
    }

    return trimmed.PadRight(width);
}

static Dictionary<string, object?> WithTop(Dictionary<string, object?> source, int top)
{
    var result = new Dictionary<string, object?>(source);
    result["top"] = top;
    return result;
}

static Options ParseArgs(string[] args)
{
    var options = new Options();

    for (var i = 0; i < args.Length; i++)
    {
        switch (args[i])
        {
            case "--connection-string":
                options.ConnectionString = args[++i];
                break;
            case "--source-id":
                options.SourceId = args[++i];
                break;
            case "--source-name":
                options.SourceName = args[++i];
                break;
            case "--top":
                options.Top = int.Parse(args[++i]);
                break;
            case "--include-chunk-text":
                options.IncludeChunkText = true;
                break;
            default:
                throw new ArgumentException($"Unknown argument: {args[i]}");
        }
    }

    return options;
}

sealed class Options
{
    public string ConnectionString { get; set; } = "Host=localhost;Port=6543;Database=Mydoctor;Username=postgres;Password=Ancv@12345";
    public string? SourceId { get; set; }
    public string? SourceName { get; set; }
    public int Top { get; set; } = 10;
    public bool IncludeChunkText { get; set; }
}
