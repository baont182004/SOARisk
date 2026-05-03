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
