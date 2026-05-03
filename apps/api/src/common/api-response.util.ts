import type { ApiCollectionMeta, ApiResponse } from '@soc-soar/shared';

export function createSuccessResponse<TData>(message: string, data: TData): ApiResponse<TData>;
export function createSuccessResponse<TData, TMeta>(
  message: string,
  data: TData,
  meta: TMeta,
): ApiResponse<TData, TMeta>;
export function createSuccessResponse<TData, TMeta>(message: string, data: TData, meta?: TMeta) {
  if (meta === undefined) {
    return {
      success: true,
      message,
      data,
    };
  }

  return {
    success: true,
    message,
    data,
    meta,
  };
}

export function createCollectionMeta(count: number): ApiCollectionMeta {
  return { count };
}

export function createPaginationMeta(options: {
  count: number;
  page: number;
  limit: number;
  total: number;
}): ApiCollectionMeta {
  const totalPages = options.total === 0 ? 0 : Math.ceil(options.total / options.limit);

  return {
    count: options.count,
    page: options.page,
    limit: options.limit,
    total: options.total,
    totalPages,
  };
}
