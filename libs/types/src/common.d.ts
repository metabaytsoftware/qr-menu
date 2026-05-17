export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'STAFF' | 'VIEWER';
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
export interface ApiResponse<T> {
    data: T;
    meta?: PaginationMeta;
}
export interface ApiError {
    statusCode: number;
    message: string;
    error?: string;
}
//# sourceMappingURL=common.d.ts.map