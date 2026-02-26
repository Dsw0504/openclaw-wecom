# OpenClaw WeCom Plugin

<p align="center">
  <img src="assets/logo.png" alt="OpenClaw WeCom Logo" width="200"/>
</p>

<p align="center">
  <a href="https://github.com/openclaw/openclaw-wecom/actions/workflows/ci.yml">
    <img src="https://github.com/openclaw/openclaw-wecom/actions/workflows/ci.yml/badge.svg" alt="CI"/>
  </a>
  <a href="https://github.com/openclaw/openclaw-wecom/actions/workflows/release.yml">
    <img src="https://github.com/openclaw/openclaw-wecom/actions/workflows/release.yml/badge.svg" alt="Release"/>
  </a>
  <a href="https://www.npmjs.com/package/@openclaw/wecom">
    <img src="https://img.shields.io/npm/v/@openclaw/wecom" alt="NPM Version"/>
  </a>
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License"/>
  </a>
</p>

> 🚀 OpenClaw 企业微信 (WeCom/WeChat Work) 频道插件

## 功能特性

- 📱 **消息收发** - 支持文本、Markdown、图片、文件等消息类型
- 🔐 **安全验证** - 完整支持企业微信回调消息加密/签名验证
- 👥 **群聊支持** - 支持企业微信群聊消息收发
- 🔌 **Webhook回调** - 支持企业微信事件回调订阅
- 🏢 **多应用支持** - 支持配置多个企业微信应用

## 快速开始

### 安装

```bash
# 使用 npm 安装
npm install @openclaw/wecom

# 或使用 openclaw 插件安装命令
openclaw plugins install @openclaw/wecom
```

### 配置

#### 1. 在企业微信管理后台创建应用

1. 登录 [企业微信管理后台](https://admin.wework.com)
2. 进入「应用管理」→「创建应用」
3. 设置应用名称和LOGO
4. 设置「可见范围」(可接收消息的用户/部门)

#### 2. 配置应用回调

1. 在应用详情页面，点击「设置API接收」
2. 填写以下信息:
   - **URL**: `https://your-domain.com/api/wecom/webhook`
   - **Token**: 输入随机字符串 (保存备用)
   - **EncodingAESKey**: 点击「随机生成」 (43位密钥，保存备用)

3. 获取以下配置信息:
   - **CorpID**: 企业管理后台可查看
   - **AgentId**: 应用详情页可见
   - **Secret**: 应用详情页可见

#### 3. 在 OpenClaw 中配置

```bash
# 使用 onboarding 向导
openclaw onboard

# 或手动添加频道
openclaw channels add
```

选择 **WeCom (企业微信)**，然后按提示输入配置信息。

## 使用示例

### 基本使用

```typescript
import { createWeComPlugin } from '@openclaw/wecom';
import type { WeComConfig } from '@openclaw/wecom';

const config: WeComConfig = {
  corpId: 'your-corp-id',
  agentId: 'your-agent-id',
  secret: 'your-secret',
  token: 'your-token',
  encodingAESKey: 'your-encoding-aes-key'
};

const plugin = createWeComPlugin(config);

// 设置消息处理函数
plugin.onMessage(async (msg) => {
  console.log('收到消息:', msg.text);
  
  // 自动回复
  await plugin.send(msg.userId, `收到: ${msg.text}`);
});
```

### 发送不同类型的消息

```typescript
// 发送文本
await plugin.sendText(userId, 'Hello World');

// 发送 Markdown
await plugin.sendMarkdown(userId, `
### 今日任务
- [ ] 完成需求评审
- [ ] 代码审查

> 加油! 💪
`);

// 发送图文卡片
await plugin.sendTextCard(
  userId,
  'OpenClaw 文档',
  '点击查看 OpenClaw 完整文档',
  'https://docs.openclaw.ai',
  '查看详情'
);
```

### 处理回调事件

```typescript
import express from 'express';

const app = express();
app.use(express.raw({ type: 'application/xml' }));

app.get('/api/wecom/webhook', (req, res) => {
  // URL验证
  const { msg_signature, timestamp, nonce, echostr } = req.query;
  const result = plugin.verifyURL(
    msg_signature as string,
    timestamp as string,
    nonce as string,
    echostr as string
  );
  res.send(result);
});

app.post('/api/wecom/webhook', async (req, res) => {
  // 处理消息
  const { msg_signature, timestamp, nonce } = req.query;
  await plugin.handleCallback(
    msg_signature as string,
    timestamp as string,
    nonce as string,
    req.body.toString()
  );
  res.send('success');
});
```

## API 参考

### WeComPlugin

| 方法 | 描述 |
|------|------|
| `onMessage(handler)` | 设置消息处理函数 |
| `verifyURL(...)` | 验证URL回调 |
| `handleCallback(...)` | 处理接收到的消息 |
| `sendText(userId, content)` | 发送文本消息 |
| `sendMarkdown(userId, content)` | 发送 Markdown 消息 |
| `sendTextCard(userId, title, description, url, btnTxt?)` | 发送图文卡片 |
| `send(userId, content)` | 自动选择合适的消息类型发送 |

### WeComConfig

```typescript
interface WeComConfig {
  corpId: string;        // 企业ID
  agentId: string;       // 应用AgentId
  secret: string;        // 应用Secret
  token: string;         // 回调Token
  encodingAESKey: string; // 回调EncodingAESKey (43位)
}
```

## 项目结构

```
openclaw-wecom/
├── src/
│   ├── index.ts           # 插件主入口
│   ├── handlers/
│   │   └── message.ts     # 消息处理器
│   ├── types/
│   │   └── index.ts       # TypeScript 类型定义
│   └── utils/
│       ├── api.ts         # 企业微信 API 封装
│       └── crypto.ts      # 消息加密/解密工具
├── docs/
│   └── design/            # 设计文档
├── tests/                 # 单元测试
├── .github/
│   └── workflows/        # CI/CD 配置
│       ├── ci.yml        # 持续集成
│       └── release.yml   # 自动发布
├── package.json
├── tsconfig.json
└── README.md
```

## 开发

### 环境要求

- Node.js 18+
- TypeScript 5.3+

### 本地开发

```bash
# 克隆项目
git clone https://github.com/openclaw/openclaw-wecom.git
cd openclaw-wecom

# 安装依赖
npm install

# 编译
npm run build

# 运行测试
npm test

# 监听模式
npm run dev
```

### 代码规范

```bash
# 代码检查
npm run lint

# 代码格式化
npm run format
```

## 贡献指南

欢迎提交 Issue 和 Pull Request!

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/xxx`)
3. 提交更改 (`git commit -m 'Add xxx'`)
4. 推送分支 (`git push origin feature/xxx`)
5. 创建 Pull Request

## 许可证

MIT License - 查看 [LICENSE](LICENSE) 文件

## 相关链接

- [OpenClaw 官方文档](https://docs.openclaw.ai)
- [企业微信开发文档](https://developer.work.weixin.qq.com/document/)
- [OpenClaw GitHub](https://github.com/openclaw/openclaw)
