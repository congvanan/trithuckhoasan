using Microsoft.AspNetCore.Identity;
using Microsoft.Data.SqlClient;

var connectionString = "Server=localhost\\SQLEXPRESS01;Database=MyAbpApp;Trusted_Connection=True;TrustServerCertificate=True";
var newPassword = args.Length > 0 ? args[0] : "Ancv@12345";

var hasher = new PasswordHasher<object>();
var hash = hasher.HashPassword(new object(), newPassword);

Console.WriteLine($"Đang reset password admin thành: {newPassword}");
Console.WriteLine($"Hash: {hash}");

using var conn = new SqlConnection(connectionString);
conn.Open();

var cmd = new SqlCommand(
    "UPDATE AbpUsers SET PasswordHash = @hash, SecurityStamp = NEWID() WHERE UserName = 'admin'",
    conn);
cmd.Parameters.AddWithValue("@hash", hash);
var rows = cmd.ExecuteNonQuery();

Console.WriteLine(rows > 0 ? "✓ Reset password thành công!" : "✗ Không tìm thấy user admin!");
