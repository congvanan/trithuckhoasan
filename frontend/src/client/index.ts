// ============================================================
// File entry point của thư mục client/
// Re-export tất cả từ 3 file được tự động sinh bên dưới
// Import từ đây thay vì import trực tiếp từng file
// ============================================================

// File được tự động sinh bởi @hey-api/openapi-ts
// Chứa cấu hình và khởi tạo HTTP client
export * from './client.gen'

// File được tự động sinh bởi @hey-api/openapi-ts
// Chứa tất cả các hàm gọi API (SDK functions)
export * from './sdk.gen'

// File được tự động sinh bởi @hey-api/openapi-ts
// Chứa tất cả TypeScript types/interfaces của API
export * from './types.gen'
