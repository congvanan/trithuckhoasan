using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text.RegularExpressions;

namespace Mydoctor.Ai;

/// <summary>
/// Cắt HTML thành các section theo heading h1–h4 (structure-aware chunking).
/// Mỗi section giữ đường dẫn heading phân cấp để pipeline gắn ngữ cảnh vào chunk.
/// Parser dùng regex vì HTML nguồn là output của Tiptap/CmsKit (well-formed),
/// không cần kéo thêm dependency HtmlAgilityPack.
/// </summary>
internal static partial class HtmlSectionParser
{
    [GeneratedRegex(@"<h([1-4])[^>]*>(.*?)</h\1\s*>", RegexOptions.IgnoreCase | RegexOptions.Singleline)]
    private static partial Regex HeadingRegex();

    [GeneratedRegex(@"<(script|style)[^>]*>.*?</\1\s*>", RegexOptions.IgnoreCase | RegexOptions.Singleline)]
    private static partial Regex ScriptStyleRegex();

    [GeneratedRegex("<.*?>", RegexOptions.Singleline)]
    private static partial Regex TagRegex();

    [GeneratedRegex(@"[ \t]+")]
    private static partial Regex SpaceRunRegex();

    [GeneratedRegex(@"\n{3,}")]
    private static partial Regex NewlineRunRegex();

    /// <summary>
    /// Trả về danh sách section nếu HTML có ít nhất 2 heading, ngược lại trả null
    /// để caller fallback về chunking phẳng như cũ.
    /// </summary>
    public static List<ContentSection>? Parse(string? html)
    {
        if (string.IsNullOrWhiteSpace(html)) return null;

        var clean = ScriptStyleRegex().Replace(html, " ");
        var headings = HeadingRegex().Matches(clean);
        if (headings.Count < 2) return null;

        var sections = new List<ContentSection>();

        // Phần mở đầu trước heading đầu tiên (thường là sapo/tóm tắt)
        AddSection(sections, headingPath: null, HtmlToText(clean[..headings[0].Index]));

        // Stack (level, text) để dựng đường dẫn heading phân cấp
        var path = new List<(int Level, string Text)>();
        for (var i = 0; i < headings.Count; i++)
        {
            var level = headings[i].Groups[1].Value[0] - '0';
            var headingText = HtmlToText(headings[i].Groups[2].Value).Replace('\n', ' ').Trim();

            path.RemoveAll(p => p.Level >= level);
            path.Add((level, headingText));

            var bodyStart = headings[i].Index + headings[i].Length;
            var bodyEnd = i + 1 < headings.Count ? headings[i + 1].Index : clean.Length;
            var headingPath = string.Join(" › ", path.Select(p => p.Text).Where(t => t.Length > 0));

            AddSection(sections, headingPath, HtmlToText(clean[bodyStart..bodyEnd]));
        }

        return sections.Count > 0 ? sections : null;
    }

    private static void AddSection(List<ContentSection> sections, string? headingPath, string text)
    {
        // Heading không có nội dung (vd h2 cha ngay trước h3 con) chỉ đóng góp vào path, không tạo section rỗng
        if (string.IsNullOrWhiteSpace(text)) return;
        sections.Add(new ContentSection(headingPath, text));
    }

    /// <summary>
    /// Chuyển HTML sang text giữ cấu trúc đoạn văn: thẻ block thành xuống dòng,
    /// đoạn văn cách nhau dòng trống — để chunker cắt được theo ranh giới đoạn.
    /// </summary>
    public static string HtmlToText(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;

        var s = ScriptStyleRegex().Replace(value, " ");
        s = Regex.Replace(s, @"<br\s*/?>", "\n", RegexOptions.IgnoreCase);
        s = Regex.Replace(s, @"</(p|div|h[1-6]|table|ul|ol|blockquote|figure)\s*>", "\n\n", RegexOptions.IgnoreCase);
        s = Regex.Replace(s, @"</(li|tr)\s*>", "\n", RegexOptions.IgnoreCase);
        s = Regex.Replace(s, @"<li[^>]*>", "\n- ", RegexOptions.IgnoreCase);
        s = TagRegex().Replace(s, " ");
        s = WebUtility.HtmlDecode(s);

        var lines = s.Replace("\r\n", "\n").Replace('\r', '\n')
            .Split('\n')
            .Select(line => SpaceRunRegex().Replace(line, " ").Trim());
        return NewlineRunRegex().Replace(string.Join("\n", lines), "\n\n").Trim();
    }
}
