# 用户认证检查和使用量跟踪功能实现总结

## 概述
已成功为以下页面的关键按钮添加了用户认证检查和使用量跟踪功能：

## 1. brick-link-recipes 页面
**文件**: `app/brick-link-recipes/page.tsx`

### 功能实现
- **按钮**: "apply filters" (应用筛选)
- **认证检查**: 用户必须登录才能使用筛选功能
- **使用量跟踪**: 每次使用会增加 `user_monthly_brick_use` 计数
- **限制检查**: 检查用户是否达到 `user_monthly_brick_limit` 限制

### 实现细节
```typescript
const handleApplyFilters = async () => {
  const success = await checkAndHandleUsage(
    'brick', 
    language === "zh" ? "筛选功能" : "filter feature",
    () => {
      handleSearch();
    }
  );
};
```

## 2. menu 页面
**文件**: `app/menu/page.tsx`

### 功能实现
- **按钮**: "view recipe" (查看食谱) 和 "view all" (查看全部)
- **认证检查**: 用户必须登录才能查看食谱详情
- **使用量跟踪**: 每次查看食谱会增加 `user_monthly_brick_use` 计数
- **限制检查**: 检查用户是否达到 `user_monthly_brick_limit` 限制

### 实现细节
```typescript
const handleViewRecipe = async (recipeId: string) => {
  const success = await checkAndHandleUsage(
    'brick', 
    language === "zh" ? "查看食谱功能" : "view recipe",
    () => {
      window.location.href = `/recipe-details?id=${recipeId}`;
    }
  );
};

const handleViewAll = () => {
  checkAuthWithMessage(() => {
    router.push(`/menu/${category.id}`);
  }, language === "zh" ? "查看全部功能" : "view all");
};
```

## 3. menu/[category] 页面
**文件**: `app/menu/[category]/page.tsx`

### 功能实现
- **按钮**: "view recipe" (查看食谱)
- **认证检查**: 用户必须登录才能查看食谱详情
- **使用量跟踪**: 每次查看食谱会增加 `user_monthly_brick_use` 计数
- **限制检查**: 检查用户是否达到 `user_monthly_brick_limit` 限制

### 实现细节
```typescript
const handleViewRecipe = async (recipeId: string) => {
  const success = await checkAndHandleUsage(
    'brick', 
    language === "zh" ? "查看食谱功能" : "view recipe",
    () => {
      window.location.href = `/recipe-details?id=${recipeId}`;
    }
  );
};
```

## 4. menu-collection 页面
**文件**: `app/menu-collection/page.tsx`

### 功能实现
- **按钮**: "view recipe" (查看食谱)
- **认证检查**: 用户必须登录才能查看食谱详情
- **使用量跟踪**: 每次查看食谱会增加 `user_monthly_brick_use` 计数
- **限制检查**: 检查用户是否达到 `user_monthly_brick_limit` 限制

### 实现细节
```typescript
const handleViewRecipe = async (recipeId: string) => {
  const success = await checkAndHandleUsage(
    'brick', 
    language === "zh" ? "查看食谱功能" : "view recipe",
    () => {
      window.location.href = `/recipe-details?id=${recipeId}`;
    }
  );
};
```

## 5. videotorecipes 页面
**文件**: `app/videotorecipes/page.tsx`

### 功能实现
- **按钮**: "analyze video" (分析视频)
- **认证检查**: 用户必须登录才能使用视频分析功能
- **使用量跟踪**: 每次分析视频会增加 `user_monthly_video_use` 计数
- **限制检查**: 检查用户是否达到 `user_monthly_video_limit` 限制

### 实现细节
```typescript
const handleAnalyzeVideoWithAuth = async () => {
  const canProceed = await checkAndHandleUsage(
    'video',
    language === "zh" ? "视频分析" : "video analysis",
    () => {
      checkAuthWithMessage(() => {
        handleAnalyzeVideo();
      }, language === "zh" ? "视频分析功能" : "video analysis");
    }
  );
};
```

## 核心 Hooks 使用

### useAuthGuard Hook
- **功能**: 处理用户认证检查
- **方法**: `checkAuthWithMessage` - 检查用户是否登录，未登录时重定向到登录页面

### useUserPlan Hook
- **功能**: 管理用户计划和使用量跟踪
- **方法**: `checkAndHandleUsage` - 检查使用限制并增加使用量
- **参数**:
  - `usageType`: 'brick' 或 'video'
  - `featureName`: 功能名称（用于显示）
  - `onSuccess`: 成功回调函数

## 用户体验流程

### 1. 用户点击受保护的按钮
- 系统首先检查用户是否已登录
- 如果未登录，重定向到登录页面

### 2. 用户已登录
- 检查用户的使用量是否达到计划限制
- 如果未达到限制，增加使用量并执行功能
- 如果达到限制，显示升级提示对话框

### 3. 本地缓存
- 用户计划配置会缓存到 localStorage
- 包括 `user_monthly_brick_limit` 和 `user_monthly_video_limit`

### 4. 使用量更新
- 每次成功使用功能后，更新 Supabase 数据库中的使用量
- 同时更新本地缓存的使用量数据

## 数据库字段

### user 表字段
- `user_monthly_brick_limit`: 用户每月食谱相关功能使用限制
- `user_monthly_brick_use`: 用户当月食谱相关功能使用次数
- `user_monthly_video_limit`: 用户每月视频分析功能使用限制
- `user_monthly_video_use`: 用户当月视频分析功能使用次数

## 测试建议

### 1. 未登录用户测试
- 访问任何受保护的功能
- 验证是否正确重定向到登录页面

### 2. 已登录用户测试
- 使用各种功能验证使用量是否正确增加
- 达到限制后验证是否显示升级提示

### 3. 多语言测试
- 切换中英文验证提示信息是否正确显示

### 4. 缓存测试
- 验证用户计划数据是否正确缓存到 localStorage
- 验证页面刷新后缓存数据是否仍然有效

## 注意事项

1. 所有受保护的按钮都已移除直接的 Link 组件包装
2. 使用 `window.location.href` 进行页面跳转以确保认证检查生效
3. 错误处理包括网络错误和API错误的情况
4. 支持中英文双语显示
5. 使用量跟踪是实时的，每次操作都会立即更新数据库 