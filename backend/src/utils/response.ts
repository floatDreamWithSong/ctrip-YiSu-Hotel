import { BaseResponse } from "@yisu/shared";

export class MakeResponse {
  static success<T>(data: T, message: string = 'success') {
    return {
      code: 0,
      message,
      data,
    } satisfies BaseResponse<T>;
  }

  static error(code: number, message: string) {
    return {
      code,
      message,
      data: null,
    } satisfies BaseResponse<null>;
  }
}
