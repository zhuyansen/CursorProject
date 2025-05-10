# 砖块食谱 (Brick Recipes)

一个具有视频食谱提取和多语言支持的烹饪应用。

## 项目结构

```
brick-recipes/
│
├── app/                # Next.js 应用目录
│   ├── api/            # API路由
│   │   ├── menu/       # 菜单分类API
│   │   ├── recipes/    # 食谱API
│   │   └── tags/       # 标签API
│   │
│   ├── menu/           # 菜单页面
│   │   └── [category]/ # 分类详情页
│   │
│   └── ...             # 其他页面
│
├── components/         # 共享组件
│   └── ui/             # UI组件库
│
├── config/             # 配置文件
│   └── redis.ts        # Redis配置
│
├── data/               # 数据文件
│   ├── recipes.ts      # 菜谱数据
│   └── translations.ts # 翻译文本
│
├── public/             # 静态资源
│
├── .env.local          # 环境变量（本地开发）
├── .env.example        # 环境变量示例
└── ...
```

## 开发设置

### 前提条件

- Node.js 18+
- Redis 数据库

### 安装依赖

```bash
npm install
```

### 配置环境变量

1. 复制示例环境变量文件：

```bash
cp .env.example .env.local
```

2. 在 `.env.local` 中编辑您的Redis连接信息：

```
REDIS_HOST=your-redis-host
REDIS_PORT=your-redis-port
REDIS_PASSWORD=your-redis-password
```

### 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## Redis数据结构

本应用使用以下Redis键模式：

- `recipe:{id}` - 存储食谱详情（JSON字符串）
- `idx:strTags:{tag}` - 按标签索引食谱ID（集合）
- `idx:categories:{category}` - 按分类索引食谱ID（集合）
- `idx:ingredient:{ingredient}` - 按配料索引食谱ID（集合）
- `idx:cookingMethods:{method}` - 按烹饪方法索引食谱ID（集合）
- `idx:mealStyle:{style}` - 按菜系风格索引食谱ID（集合）

## API端点

### 菜单API

- `GET /api/menu?category={category}&page={page}&pageSize={pageSize}`
  - 获取指定分类的菜谱列表
  - 支持分页

### 食谱API

- `GET /api/recipes?ingredients={ing1,ing2}&methods={method1,method2}&cuisine={cuisine}&tags={tag1,tag2}&search={search}&page={page}&pageSize={pageSize}`
  - 搜索食谱
  - 支持按配料、烹饪方法、菜系、标签和文本搜索
  - 支持分页

### 标签API

- `GET /api/tags`
  - 获取系统中所有可用的标签和分类 