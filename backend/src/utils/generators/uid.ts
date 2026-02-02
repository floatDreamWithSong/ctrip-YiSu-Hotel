import crypto from 'node:crypto';

/**
 * 生成8位随机uid
 * @returns 8位随机字符串
 */
export const generateUid = () => {
  return crypto.randomUUID().slice(0, 8);
}