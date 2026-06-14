# 策展智能助手后端

基于 FastAPI 的后端服务，连接 Supabase 数据库和元景大模型平台。

## 项目结构

```
backend/
├── app/
│   ├── config.py          # 配置文件
│   ├── main.py            # FastAPI 主入口
│   ├── __init__.py
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py     # Pydantic 数据模型
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── projects.py    # 项目 API
│   │   ├── exhibits.py    # 展品 API
│   │   └── ai.py          # AI API
│   └── services/
│       ├── __init__.py
│       ├── database.py     # Supabase 数据库服务
│       └── ai_service.py  # 元景大模型服务
├── .env.example           # 环境变量示例
├── requirements.txt        # Python 依赖
└── init_db.py             # 数据库初始化脚本
```

## 快速开始

### 1. 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# Supabase 配置
SUPABASE_URL=你的Supabase项目URL
SUPABASE_KEY=你的Supabase服务密钥
SUPABASE_ANON_KEY=你的Supabase匿名密钥

# 元景AI配置
YUANJING_API_KEY=你的元景API密钥
YUANJING_BASE_URL=https://api.yuanjing.ai

# 应用配置
DEBUG=true
```

### 3. 初始化数据库

在 Supabase SQL 编辑器中执行以下 SQL：

```sql
-- 项目表
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT DEFAULT 'default_user',
    title TEXT NOT NULL,
    theme TEXT,
    narrative JSONB,
    narrative_options JSONB,
    step INTEGER DEFAULT 1,
    status TEXT DEFAULT 'in_progress',
    exhibit_count INTEGER DEFAULT 0,
    time TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 单元表
CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    theme TEXT,
    items INTEGER DEFAULT 0,
    "order" INTEGER DEFAULT 0,
    confirmed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 展品表
CREATE TABLE IF NOT EXISTS exhibits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    era TEXT,
    material TEXT,
    size TEXT,
    weight INTEGER,
    source TEXT,
    confidence INTEGER,
    kept BOOLEAN DEFAULT TRUE,
    manual BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 文本段落表
CREATE TABLE IF NOT EXISTS text_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT,
    "order" INTEGER DEFAULT 0,
    is_ai BOOLEAN DEFAULT TRUE,
    edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE exhibits ENABLE ROW LEVEL SECURITY;
ALTER TABLE text_sections ENABLE ROW LEVEL SECURITY;

-- RLS 策略（开发环境允许所有操作）
CREATE POLICY "Allow all" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON units FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON exhibits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON text_sections FOR ALL USING (true) WITH CHECK (true);
```

### 4. 启动服务

```bash
# 开发模式
uvicorn app.main:app --reload --port 8000

# 或直接运行
python -m uvicorn app.main:app --reload --port 8000
```

服务启动后访问：
- API 文档：http://localhost:8000/docs
- ReDoc：http://localhost:8000/redoc

## API 端点

### 项目 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/projects` | 获取项目列表 |
| GET | `/projects/{project_id}` | 获取单个项目 |
| POST | `/projects` | 创建项目 |
| PUT | `/projects/{project_id}` | 更新项目 |
| DELETE | `/projects/{project_id}` | 删除项目 |
| GET | `/projects/{project_id}/units` | 获取项目单元 |
| POST | `/projects/units` | 创建单元 |
| PUT | `/projects/units/{unit_id}` | 更新单元 |
| DELETE | `/projects/units/{unit_id}` | 删除单元 |

### 展品 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/exhibits` | 获取展品列表 |
| GET | `/exhibits/{exhibit_id}` | 获取单个展品 |
| POST | `/exhibits` | 创建展品 |
| PUT | `/exhibits/{exhibit_id}` | 更新展品 |
| DELETE | `/exhibits/{exhibit_id}` | 删除展品 |
| POST | `/exhibits/batch` | 批量创建展品 |

### AI API

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/ai/narrative` | 生成叙事方向 |
| POST | `/ai/units` | 生成单元结构 |
| POST | `/ai/recommend` | 推荐展品 |
| POST | `/ai/text-section` | 生成文本内容 |
| POST | `/ai/outline` | 生成展览大纲 |
| GET | `/ai/health` | AI 服务健康检查 |

## 连接前端

前端需要将 API 请求地址改为后端服务地址：

```javascript
// 在前端 .env 文件中
VITE_API_BASE_URL=http://localhost:8000
```

或修改前端的 API 请求基础路径。
