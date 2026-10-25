export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[] | Record<string, string[]> | null;
}
