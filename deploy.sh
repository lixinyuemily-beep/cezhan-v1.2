#!/bin/bash

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 杀掉占用端口的进程
echo "清理端口..."
lsof -ti:8001 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
sleep 1

# 构建前端
echo "构建前端..."
cd "$SCRIPT_DIR"
npm run build

# 启动后端
echo "启动后端..."
cd "$SCRIPT_DIR/backend"
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 &
BACKEND_PID=$!

sleep 2

# 启动前端
echo "启动前端..."
cd "$SCRIPT_DIR"
npm run dev -- --host &
FRONTEND_PID=$!

echo ""
echo "部署完成！"
echo "后端: http://localhost:8001"
echo "前端: http://localhost:5173"
echo ""
echo "按 Ctrl+C 停止服务"
