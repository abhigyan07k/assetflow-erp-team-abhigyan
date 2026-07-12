class ApiResponse<T = unknown> {
  public readonly success: boolean;

  public readonly statusCode: number;

  public readonly data: T;

  public readonly message: string;

  constructor(statusCode: number, data: T, message = 'Success') {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
  }
}

export default ApiResponse;
