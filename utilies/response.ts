// utils/response.ts
export const successResponse = (
  data: any,
  message = 'Success',
  status: number,
) => ({
  status,
  data,
  message,
});

export const errorResponse = (
  message = 'Something went wrong',
  status = 500,
  data: any = null,
) => ({
  status,
  data,
  message,
});

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
