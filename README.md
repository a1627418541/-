# 模拟女友

基于 React + TypeScript + Vite 的 AI 虚拟女友聊天应用，接入 Moonshot（Kimi）大模型 API。

## 技术栈

- React 19 + TypeScript
- Vite（构建工具）
- Axios（HTTP 请求）
- Moonshot AI API（Kimi 大模型）

## 快速开始

### 1. 配置 API Key

复制环境变量模板：

```bash
cp .env.example .env
```

编辑 `.env`，填入你的 Moonshot API Key（从 [platform.moonshot.cn](https://platform.moonshot.cn/) 获取）：

```
VITE_KIMI_API_KEY=sk-xxx
VITE_KIMI_API_BASE=https://api.moonshot.cn/v1
VITE_KIMI_MODEL=moonshot-v1-128k
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发服务器

```bash
npm run dev
```

### 4. 构建生产版本

```bash
npm run build
```

## 项目结构

```
src/
  components/       # UI 组件
    ChatInput.tsx
    ChatMessage.tsx
  hooks/            # 自定义 Hooks
    useChat.ts      # 聊天状态管理
  services/         # API 服务
    kimi.ts         # Kimi API 封装
  types/            # TypeScript 类型
    index.ts
  App.tsx           # 主应用组件
  App.css           # 应用样式
  main.tsx          # 入口文件
```

## 自定义女友角色

修改 `src/App.tsx` 中的 `SYSTEM_PROMPT`，可以自定义虚拟女友的名字、性格、说话风格等。
