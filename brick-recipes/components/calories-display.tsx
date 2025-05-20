import React from 'react';

interface CaloriesDisplayProps {
  calories?: string;
  energy?: string;
  className?: string;
}

/**
 * 通用卡路里显示组件，处理不同格式的卡路里值
 * 支持以下格式:
 * - "300 kcal"
 * - "300"
 * - "1351 kJ (323 cal)"
 */
export const CaloriesDisplay: React.FC<CaloriesDisplayProps> = ({ 
  calories, 
  energy,
  className = ""
}) => {
  // 优先使用Energy字段，如果没有则使用calories
  const valueToDisplay = energy || calories || "";
  
  // 如果为空，显示默认值
  if (!valueToDisplay) {
    return <span className={className}>0 kcal</span>;
  }
  
  // 将数值转为字符串确保处理安全
  const valueStr = String(valueToDisplay);
  
  // 精确匹配"300 kcal"这种格式 - 如果已经包含kcal单位，直接显示
  if (/\d+\s*(?:k?cal|kcal|calories)/i.test(valueStr)) {
    return <span className={className}>{valueStr}</span>;
  }
  
  // 检查是否有类似 "1351 kJ (323 cal)" 的格式
  const calMatch = valueStr.match(/\(\s*(\d+)(?:\.\d+)?\s*(?:k?cal|kcal|calories)\s*\)/i);
  if (calMatch && calMatch[1]) {
    return <span className={className}>{`${calMatch[1]} kcal`}</span>;
  }
  
  // 如果只是一个数字，则添加"kcal"单位
  const numMatch = valueStr.match(/^(\d+)(?:\.\d+)?$/);
  if (numMatch && numMatch[1]) {
    return <span className={className}>{`${numMatch[1]} kcal`}</span>;
  }
  
  // 降级处理 - 如果是其他格式，尝试提取任何数字
  const anyNumMatch = valueStr.match(/(\d+)(?:\.\d+)?/);
  if (anyNumMatch && anyNumMatch[1]) {
    return <span className={className}>{`${anyNumMatch[1]} kcal`}</span>;
  }
  
  // 没有有效值时显示默认值
  return <span className={className}>0 kcal</span>;
};

export default CaloriesDisplay; 