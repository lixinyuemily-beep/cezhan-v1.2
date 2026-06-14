"""
FastAPI 主入口 - 策展智能助手 API
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routers import projects, exhibits, ai, auth

# 创建 FastAPI 应用
app = FastAPI(
    title=settings.app_name,
    description="策展智能助手后端API - 提供项目管理、展品筛选、AI生成等功能",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(projects.router)
app.include_router(exhibits.router)
app.include_router(ai.router)
app.include_router(auth.router)


@app.get("/")
async def root():
    """根路径 - API 信息"""
    return {
        "name": settings.app_name,
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "database": "supabase",
        "ai": "yuanjing",
        "supabase_url": settings.supabase_url
    }


# 启动提示
if __name__ == "__main__":
    import uvicorn
    print(f"🚀 启动 {settings.app_name}")
    print(f"📚 API 文档: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000)
