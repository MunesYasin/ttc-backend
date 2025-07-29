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
