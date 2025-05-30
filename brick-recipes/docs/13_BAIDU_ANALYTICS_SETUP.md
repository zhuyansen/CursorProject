# 📊 百度统计设置指南

## 📋 目录
1. [百度统计简介](#百度统计简介)
2. [注册和设置账户](#注册和设置账户)
3. [获取跟踪代码](#获取跟踪代码)
4. [配置环境变量](#配置环境变量)
5. [DNS记录配置（可选）](#dns记录配置可选)
6. [验证跟踪代码](#验证跟踪代码)
7. [功能特性](#功能特性)
8. [高级配置](#高级配置)
9. [数据分析建议](#数据分析建议)
10. [常见问题](#常见问题)
11. [支持资源](#支持资源)
12. [配置检查清单](#配置检查清单)

---

## 🎯 百度统计简介

百度统计是百度推出的免费专业网站流量分析工具，帮助您：
- **了解网站访问情况**：PV、UV、IP、跳出率等
- **分析用户行为**：访问路径、停留时间、访问深度
- **监控网站性能**：页面加载速度、错误页面
- **优化SEO效果**：搜索词分析、来源分析
- **实时数据监控**：当前在线人数、实时访客

### 🔥 **为什么选择百度统计？**
- ✅ **免费专业**：完全免费，功能强大
- ✅ **本土化**：更适合中文网站和中国用户
- ✅ **SEO友好**：有助于百度搜索引擎优化
- ✅ **详细报告**：提供丰富的数据分析报告

---

## 📝 注册和设置账户

### 步骤1：注册百度账号
1. 访问 [百度统计官网](https://tongji.baidu.com/)
2. 点击"立即使用"
3. 使用百度账号登录（没有账号需要先注册）

### 步骤2：添加网站
1. 登录后点击"管理"→"网站列表"
2. 点击"新增网站"
3. 填写网站信息：
   ```
   网站域名：brickrecipes.ai
   网站名称：BrickRecipes - 智能食谱发现平台
   网站首页：https://brickrecipes.ai
   行业类别：餐饮食品 > 食谱菜谱
   ```
4. 点击"确定"完成添加

---

## 🔑 获取跟踪代码

### 步骤1：获取跟踪代码
1. 在网站列表中找到您的网站
2. 点击"获取代码"
3. 复制统计代码中的**站点ID**

### 统计代码格式：
```javascript
var _hmt = _hmt || [];
(function() {
  var hm = document.createElement("script");
  hm.src = "https://hm.baidu.com/hm.js?YOUR_SITE_ID";  // ← 这个就是您的站点ID
  var s = document.getElementsByTagName("script")[0]; 
  s.parentNode.insertBefore(hm, s);
})();
```

### 步骤2：提取跟踪ID
- 完整URL：`https://hm.baidu.com/hm.js?a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
- **跟踪ID**：`a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`（问号后面的32位字符）

### 步骤3：代码类型选择
- 推荐选择"异步代码"
- 可以根据需要启用"自动检测事件"

---

## ⚙️ 配置环境变量

### 📋 **完整环境变量配置**
在您的 `.env.local` 文件中添加：
```env
# ===================
# 百度统计配置
# ===================

# 百度统计站点ID (32位字符串，从跟踪代码URL中提取)
NEXT_PUBLIC_BAIDU_ANALYTICS_ID=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

# ===================
# Google Analytics配置
# ===================

# Google Analytics 4 跟踪ID
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# ===================
# 搜索引擎验证
# ===================

# Google Search Console验证码
GOOGLE_SITE_VERIFICATION=your_google_verification_code

# Bing Webmaster Tools验证码
BING_SITE_VERIFICATION=your_bing_verification_code

# ===================
# 可选高级配置
# ===================

# 是否启用调试模式 (development环境使用)
NEXT_PUBLIC_ANALYTICS_DEBUG=false

# 数据采样率 (1-100，100表示不采样)
NEXT_PUBLIC_ANALYTICS_SAMPLE_RATE=100

# 是否启用跨域跟踪
NEXT_PUBLIC_ANALYTICS_CROSS_DOMAIN=false
```

### 🔧 **环境变量说明**

#### 必需配置项：
- **`NEXT_PUBLIC_BAIDU_ANALYTICS_ID`**: 百度统计站点ID，必须以`NEXT_PUBLIC_`开头使客户端可访问
- **`NEXT_PUBLIC_GOOGLE_ANALYTICS_ID`**: Google Analytics跟踪ID

#### 验证配置项：
- **`GOOGLE_SITE_VERIFICATION`**: Google搜索引擎验证码
- **`BING_SITE_VERIFICATION`**: Bing搜索引擎验证码

#### 可选配置项：
- **`NEXT_PUBLIC_ANALYTICS_DEBUG`**: 开发环境调试模式
- **`NEXT_PUBLIC_ANALYTICS_SAMPLE_RATE`**: 数据采样率控制
- **`NEXT_PUBLIC_ANALYTICS_CROSS_DOMAIN`**: 跨域跟踪设置

### 📝 **不同环境配置**

#### 开发环境 (`.env.local`)：
```env
NEXT_PUBLIC_BAIDU_ANALYTICS_ID=development_test_id
NEXT_PUBLIC_ANALYTICS_DEBUG=true
```

#### 生产环境配置：
```env
NEXT_PUBLIC_BAIDU_ANALYTICS_ID=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
NEXT_PUBLIC_ANALYTICS_DEBUG=false
NEXT_PUBLIC_ANALYTICS_SAMPLE_RATE=100
```

### 💡 **注意事项**
- 环境变量必须以 `NEXT_PUBLIC_` 开头才能在客户端访问
- 站点ID不要包含引号或额外字符
- 修改环境变量后需要重启开发服务器
- 生产环境请使用真实的站点ID

---

## 🌐 DNS记录配置（可选）

### 🎯 **为什么需要DNS配置？**
虽然百度统计主要通过JavaScript代码工作，但DNS记录可以用于：
- **域名验证**：验证网站所有权
- **CDN优化**：提升统计代码加载速度
- **备用验证**：作为代码验证的补充方案

### 📝 **配置步骤（使用Cloudflare）**

#### 1. 添加CNAME记录（用于CDN加速）
```
Type: CNAME - Canonical name record
Host: stats
Answer/Value: hm.baidu.com
TTL: 600 (10分钟)
Priority: 留空
Notes: 百度统计CDN加速
```

#### 2. 添加TXT记录（用于验证）
```
Type: TXT - Text record
Host: _baidu-site-verification
Answer/Value: baidu-site-verification=YOUR_VERIFICATION_CODE
TTL: 600 (10分钟)
Priority: 留空
Notes: 百度站点验证记录
```

#### 3. 添加A记录（可选，用于自定义统计域名）
```
Type: A - Address record
Host: analytics
Answer/Value: 您的服务器IP地址
TTL: 600 (10分钟)
Priority: 留空
Notes: 自定义统计分析域名
```

### 🔄 **DNS记录验证**
使用在线工具验证DNS记录是否生效：
- [DNS Checker](https://dnschecker.org/)
- [What's My DNS](https://www.whatsmydns.net/)
- 命令行验证：`nslookup stats.brickrecipes.ai`

---

## ✅ 验证跟踪代码

### 方法1：浏览器开发者工具检查
1. 打开网站：`http://localhost:3000`
2. 按 `F12` 打开开发者工具
3. 切换到 `Network` 标签
4. 刷新页面
5. 查找 `hm.baidu.com` 的请求

### 方法2：百度统计后台检查
1. 登录百度统计后台
2. 进入"管理"→"代码检查"
3. 输入您的网站URL
4. 点击"检查"查看状态

### 方法3：实时访客验证
1. 在百度统计后台查看"实时访客"
2. 访问您的网站
3. 几分钟后应该能看到访问记录

### 方法4：环境变量验证
在组件中添加调试代码：
```javascript
useEffect(() => {
  console.log('百度统计ID:', process.env.NEXT_PUBLIC_BAIDU_ANALYTICS_ID);
  console.log('Google Analytics ID:', process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID);
}, []);
```

---

## 📊 功能特性

### 1. 流量分析
- **访问量统计**：PV、UV、IP数据
- **来源分析**：搜索引擎、外链、直接访问
- **地域分布**：访客地理位置分析
- **时间分析**：按小时、天、周、月统计

### 2. 实时统计
- **实时访客**：当前在线用户
- **实时事件**：页面浏览、事件触发
- **实时来源**：访客来源追踪

### 3. 搜索词分析
- **百度搜索词**：用户搜索关键词
- **搜索引擎比较**：不同搜索引擎效果
- **长尾词分析**：发现潜在流量词

### 4. 转化分析
- **目标转化**：设置业务目标追踪
- **漏斗分析**：用户行为路径分析
- **事件追踪**：自定义事件统计

---

## 🔧 高级配置

### 自定义事件追踪
在组件中添加事件追踪：
```javascript
// 追踪用户点击行为
const trackEvent = (category: string, action: string, label?: string) => {
  if (typeof window !== 'undefined' && window._hmt) {
    window._hmt.push(['_trackEvent', category, action, label]);
  }
};

// 使用示例
trackEvent('recipe', 'view', 'ingredient-search');
trackEvent('video', 'convert', 'cooking-tutorial');
```

### 页面访问追踪（SPA应用）
```javascript
// 追踪页面访问
const trackPageView = (page: string) => {
  if (typeof window !== 'undefined' && window._hmt) {
    window._hmt.push(['_trackPageview', page]);
  }
};

// 在路由变化时调用
useEffect(() => {
  trackPageView(router.asPath);
}, [router.asPath]);
```

### 多环境配置管理
```javascript
// utils/analytics.ts
export const getAnalyticsConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isDebug = process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === 'true';
  
  return {
    baiduId: process.env.NEXT_PUBLIC_BAIDU_ANALYTICS_ID,
    googleId: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID,
    debug: isDevelopment || isDebug,
    sampleRate: parseInt(process.env.NEXT_PUBLIC_ANALYTICS_SAMPLE_RATE || '100'),
    crossDomain: process.env.NEXT_PUBLIC_ANALYTICS_CROSS_DOMAIN === 'true'
  };
};
```

### 转化目标设置
1. 在百度统计后台设置转化目标
2. 定义关键页面（如注册成功页）
3. 监控转化率和转化路径

---

## 📈 数据分析建议

### 1. 关注核心指标
- **PV（页面浏览量）**：衡量网站受欢迎程度
- **UV（独立访客）**：衡量网站影响力
- **停留时间**：衡量内容质量
- **跳出率**：衡量页面吸引力

### 2. 定期分析报告
- **每日**：查看实时数据和异常情况
- **每周**：分析流量趋势和来源变化
- **每月**：深度分析用户行为和转化效果

### 3. 结合SEO优化
- 分析搜索词，优化关键词策略
- 查看页面性能，优化加载速度
- 监控外链效果，扩展推广渠道

### 4. 对比分析
- **百度统计 vs Google Analytics**：对比不同地区用户行为
- **移动端 vs 桌面端**：优化响应式设计
- **不同时间段**：发现用户活跃规律

---

## 🚨 常见问题

### Q1：环境变量配置错误
**问题症状：**
- 统计代码未加载
- 控制台显示undefined错误
- 数据未上报

**解决方案：**
1. **检查变量名**：确保以`NEXT_PUBLIC_`开头
2. **检查文件位置**：`.env.local`文件在项目根目录
3. **重启服务器**：修改环境变量后必须重启
4. **检查语法**：确保没有引号或多余字符

### Q2：统计代码未生效
**解决方案：**
- 检查站点ID是否正确
- 确认环境变量配置正确
- 重启开发服务器
- 清除浏览器缓存

### Q3：数据显示延迟
**说明：**
- 百度统计数据通常有1-4小时延迟
- 实时数据相对更快
- 完整报告次日更新

### Q4：DNS记录配置问题
**解决方案：**
- 检查记录类型和值是否正确
- 等待DNS传播（可能需要几小时）
- 使用DNS查询工具验证
- 清除本地DNS缓存

### Q5：无法访问百度统计
**解决方案：**
- 确保网络可以访问百度服务
- 海外服务器可能需要特殊配置
- 考虑使用CDN加速
- 检查防火墙设置

### Q6：与Google Analytics冲突
**说明：**
- 两个统计系统可以同时使用
- 不会互相干扰
- 建议对比数据验证准确性

---

## 📞 支持资源

- [百度统计帮助中心](https://tongji.baidu.com/holmes/help)
- [百度统计API文档](https://tongji.baidu.com/api/manual/)
- [百度统计论坛](https://tieba.baidu.com/f?kw=百度统计)
- [Cloudflare DNS文档](https://developers.cloudflare.com/dns/)
- [Next.js环境变量文档](https://nextjs.org/docs/basic-features/environment-variables)

---

## 🎯 **配置检查清单**

### 基础配置：
- [ ] 注册百度统计账号
- [ ] 添加网站并获取站点ID
- [ ] 在 `.env.local` 中配置 `NEXT_PUBLIC_BAIDU_ANALYTICS_ID`
- [ ] 在 `.env.local` 中配置 `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID`
- [ ] 重启开发服务器

### 验证配置：
- [ ] 配置 `GOOGLE_SITE_VERIFICATION`
- [ ] 配置 `BING_SITE_VERIFICATION`
- [ ] 验证跟踪代码已加载
- [ ] 在百度统计后台确认数据收集

### DNS配置（可选）：
- [ ] 添加CNAME记录用于CDN加速
- [ ] 添加TXT记录用于域名验证
- [ ] 验证DNS记录生效

### 高级配置（可选）：
- [ ] 设置转化目标
- [ ] 配置自定义事件追踪
- [ ] 设置多环境配置管理
- [ ] 配置调试模式

### 测试验证：
- [ ] 开发环境测试统计代码
- [ ] 生产环境验证数据收集
- [ ] 检查实时访客数据
- [ ] 验证事件追踪功能

---

*最后更新：2024年12月* 