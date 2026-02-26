# Phoenix Growth OS

集项目管理、认知心理学干预、AI 深度复盘于一体的自驱型操作系统。

## 快速开始

使用 SQLite 本地数据库，无需 Docker。

### 1. 安装依赖并初始化

```bash
npm install
cp .env.example .env
# 编辑 .env 填写 OPENAI_API_KEY（或 ANTHROPIC_API_KEY / DEEPSEEK_API_KEY）
npx prisma db push
npx prisma generate
```

### 2. 运行开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 环境变量

| 变量 | 说明 |
|------|------|
| DATABASE_URL | SQLite 本地文件路径，默认 `file:./dev.db` |
| LLM_PROVIDER | openai / claude / deepseek |
| OPENAI_API_KEY | OpenAI API Key |
| ANTHROPIC_API_KEY | Anthropic API Key |
| DEEPSEEK_API_KEY | DeepSeek API Key |
