// utils/response.ts
export const successResponse = (
  data: any,
  message = 'Success',
  status: number,
) => ({
  success: true,
  status,
  data,
  message,
});

// utils/error-response.ts
// utils/errorResponse.ts
export function errorResponse(
  errors: { field: string; errors: string[] }[],
  message = 'Validation failed',
  status = 400,
) {
  return {
    success: false,
    status,
    message,
    errors,
    data: null,
  };
}

export const paginationResponse = (
  data: any[],
  total: number,
  page: number,
  limit: number,
  message = 'Data retrieved successfully',
) => ({
  status: 200,
  data,
  message,
  pagination: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  },
});
