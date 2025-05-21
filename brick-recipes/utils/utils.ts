import { redirect } from "next/navigation";

/**
 * 重定向到指定路径，并将消息作为查询参数添加。
 * @param {('error' | 'success')} type - 消息类型，'error'或'success'。
 * @param {string} path - 要重定向的路径。
 * @param {string} message - 要编码并作为查询参数添加的消息。
 * @returns {never} 此函数不返回，因为它触发重定向。
 */
export function encodedRedirect(
  type: "error" | "success",
  path: string,
  message: string,
) {
  return redirect(`${path}?${type}=${encodeURIComponent(message)}`);
} 