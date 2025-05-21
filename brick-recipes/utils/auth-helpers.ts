"use client";

import { useAuth } from "@/components/auth-wrapper";
import { usePathname } from "next/navigation";

/**
 * 不再检查用户是否已登录，直接返回原始路径
 * @param path 目标路径
 * @returns 原始路径
 */
export const useProtectedLink = (path: string) => {
  // 直接返回原始路径，不再进行登录检查
  return path;
};

/**
 * 不再检查用户是否已登录，直接执行原始处理函数
 * @param originalHandler 原始的处理函数
 * @param redirectPath 不再使用
 * @returns 处理函数
 */
export const useProtectedAction = (originalHandler: () => void, redirectPath: string) => {
  return () => {
    // 直接执行原始处理函数，不再进行登录检查
    originalHandler();
  };
}; 