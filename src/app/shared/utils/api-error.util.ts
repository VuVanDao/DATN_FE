/**
 * Trích xuất thông báo lỗi dễ đọc từ error object của HTTP response.
 *
 * Hỗ trợ các shape lỗi mà Backend trả về:
 * 1. `errors` là mảng chuỗi:       { errors: ['Email đã tồn tại'] }
 * 2. `errors` là object theo key:  { errors: { Email: ['Email không hợp lệ'] } }
 * 3. `message` đơn giản:           { message: 'Đăng nhập thất bại' }
 *
 * @param err        - Đối tượng lỗi (thường là HttpErrorResponse)
 * @param defaultMsg - Thông báo mặc định khi không trích xuất được gì
 */
export function extractApiErrorMessage(err: unknown, defaultMsg: string): string {
  const apiError = (err as { error?: { message?: string; errors?: unknown } })?.error;

  const errorsList = apiError?.errors;

  if (Array.isArray(errorsList) && errorsList.length > 0) {
    return String(errorsList[0]);
  }

  if (typeof errorsList === 'object' && errorsList !== null) {
    const firstKey = Object.keys(errorsList)[0];
    const firstValue = (errorsList as Record<string, unknown>)[firstKey];
    if (Array.isArray(firstValue) && firstValue.length > 0) {
      return String(firstValue[0]);
    }
  }

  return apiError?.message || defaultMsg;
}
