# Agent Tool Web Interface

基于 React + TypeScript + Ant Design 的 Agent Tool 前端交互界面。

## 功能特性

- 💬 **实时聊天**: 通过 WebSocket 与 Agent 进行实时对话
- 🔧 **工具调用展示**: 可视化展示 `calculate_square` 工具的调用过程和结果
- 📚 **会话管理**: 创建、切换、删除会话，保存历史记录
- 🎨 **精美界面**: 使用 Ant Design 组件库，支持响应式布局

## 技术栈

### 后端
- FastAPI - Web 框架
- WebSocket - 实时通信
- Google ADK - Agent 框架
- LiteLLM - 模型接入

### 前端
- React 18 - UI 框架
- TypeScript - 类型安全
- Vite - 构建工具
- Ant Design - UI 组件库
- Zustand - 状态管理
- date-fns - 日期格式化

## 项目结构

```
agent_tool/
├── api/                    # FastAPI 后端
│   ├── main.py            # WebSocket + REST API
│   └── requirements.txt   # Python 依赖
├── web/                    # React 前端
│   ├── src/
│   │   ├── components/    # React 组件
│   │   ├── pages/         # 页面组件
│   │   ├── services/      # API 服务
│   │   ├── store/         # Zustand 状态管理
│   │   └── types/         # TypeScript 类型
│   └── package.json       # Node 依赖
└── src/agent_tool/        # 原始 Agent 代码
```

## 快速开始

### 1. 安装后端依赖

```bash
cd agent_tool/api
pip install -r requirements.txt
```

### 2. 配置环境变量

在运行前，确保设置了 DashScope API Key:

```bash
export DASHSCOPE_API_KEY=your_api_key_here
```

### 3. 启动后端服务

```bash
cd agent_tool/api
python main.py
```

后端将运行在 `http://localhost:8000`

### 4. 安装前端依赖

```bash
cd agent_tool/web
npm install
```

### 5. 启动前端开发服务器

```bash
cd agent_tool/web
npm run dev
```

前端将运行在 `http://localhost:5173`

## API 接口

### REST API

- `GET /api/sessions` - 获取所有会话列表
- `POST /api/sessions` - 创建新会话
- `DELETE /api/sessions/{session_id}` - 删除会话
- `GET /api/sessions/{session_id}/messages` - 获取会话消息

### WebSocket

- `ws://localhost:8000/ws/chat/{session_id}` - 实时聊天

## 使用说明

1. 打开浏览器访问 `http://localhost:5173`
2. 在左侧会话列表中选择一个会话或创建新会话
3. 在底部输入框中输入消息，按 Enter 发送
4. 观察右侧聊天区域，可以看到：
   - 用户消息（蓝色气泡，右侧）
   - Agent 回复（灰色气泡，左侧）
   - 工具调用卡片（绿色卡片，显示函数调用过程和结果）

### 示例对话

输入: "12 的平方是多少？"

输出:
- Agent 回复："我来计算一下..."
- 工具调用卡片：
  - 函数名: `calculate_square`
  - 参数: `{"number": 12}`
  - 结果: `144`
- Agent 回复："12 的平方是 144"

## 开发

### 添加新工具

1. 在 `api/main.py` 中定义新的工具函数
2. 将工具添加到 Agent 的 `tools` 列表中
3. 前端会自动显示所有工具调用

### 自定义样式

- 全局样式: `web/src/index.css`
- Ant Design 主题: `web/src/App.tsx` 中的 `ConfigProvider`

## 生产部署

### 构建前端

```bash
cd agent_tool/web
npm run build
```

### 使用生产服务器

推荐使用 Gunicorn + Uvicorn:

```bash
cd agent_tool/api
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

## 许可证

MIT
