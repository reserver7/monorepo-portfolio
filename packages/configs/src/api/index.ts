/** Shared HTTP response envelope used by legacy REST consumers. */
export type ApiResponseBase = {
  state: boolean;
  code: string;
  message: string;
  response?: boolean;
};

export type ApiResponse<T> = ApiResponseBase & {
  result: T;
};
