export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: number | null;
  previousPage: number | null;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationInfo;
}

/**
 * Calculate pagination skip value
 * @param page - Current page number (1-based)
 * @param limit - Number of records per page
 * @returns Number of records to skip
 */
export function calculateSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Generate pagination information
 * @param page - Current page number
 * @param limit - Records per page
 * @param totalRecords - Total number of records
 * @returns Pagination information object
 */
export function generatePaginationInfo(
  page: number,
  limit: number,
  totalRecords: number,
): PaginationInfo {
  const totalPages = Math.ceil(totalRecords / limit);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return {
    currentPage: page,
    totalPages,
    totalRecords,
    limit,
    hasNextPage,
    hasPreviousPage,
    nextPage: hasNextPage ? page + 1 : null,
    previousPage: hasPreviousPage ? page - 1 : null,
  };
}

/**
 * Create a paginated result object
 * @param data - Array of data items
 * @param page - Current page number
 * @param limit - Records per page
 * @param totalRecords - Total number of records
 * @returns Paginated result with data and pagination info
 */
export function createPaginatedResult<T>(
  data: T[],
  page: number,
  limit: number,
  totalRecords: number,
): PaginatedResult<T> {
  return {
    data,
    pagination: generatePaginationInfo(page, limit, totalRecords),
  };
}

/**
 * Validate and normalize pagination parameters
 * @param page - Raw page parameter (can be string or number)
 * @param limit - Raw limit parameter (can be string or number)
 * @param maxLimit - Maximum allowed limit (default: 100)
 * @returns Normalized pagination options
 */
export function normalizePaginationParams(
  page?: string | number,
  limit?: string | number,
  maxLimit: number = 100,
): PaginationOptions {
  const normalizedPage = Math.max(1, parseInt(String(page || 1), 10) || 1);
  const normalizedLimit = Math.min(
    maxLimit,
    Math.max(1, parseInt(String(limit || 10), 10) || 10),
  );

  return {
    page: normalizedPage,
    limit: normalizedLimit,
  };
}
