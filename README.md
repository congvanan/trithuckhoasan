# Trí Thức Kho Sản - DIV

Hệ thống quản lý thông tin DIV - Bảo hiểm tiền gửi Việt Nam.

## Cấu trúc dự án

```
trithuckhoasan/
├── backend/          # ABP Framework .NET 10
│   ├── aspnet-core/  # Source code backend
│   └── tools/        # Công cụ hỗ trợ
└── frontend/         # Next.js 15 App Router
```

## Yêu cầu hệ thống

- .NET 10 SDK
- Node.js 20+ / pnpm
- SQL Server (SQLEXPRESS01)
- Redis

## Chạy dự án

### Backend
```bash
cd backend/aspnet-core/src/MyAbpApp.HttpApi.Host
dotnet run
```

### Frontend
```bash
cd frontend
pnpm install
pnpm dev
```
