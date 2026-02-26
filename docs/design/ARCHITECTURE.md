# OpenClaw 企业微信插件 - 设计文档

## 1. 项目概述

### 项目名称
OpenClaw WeCom Plugin

### 项目目标
为 OpenClaw 提供企业微信 (WeCom/WeChat Work) 的对接能力，实现消息收发、事件回调、群聊管理等功能。

### 目标用户
- 需要将企业微信与 AI 助手对接的企业用户
- 使用 OpenClaw 作为核心平台的开发者

---

## 2. 架构设计

### 2.1 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      企业微信服务器                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   用户消息   │───▶│  回调验证   │───▶│   消息解密   │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────┐
│                    OpenClaw Gateway                        │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              WeCom Plugin (本项目)                   │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │  │
│  │  │ 消息验证  │  │ 消息处理  │  │   API 客户端    │   │  │
│  │  └──────────┘  └──────────┘  └──────────────────┘   │  │
│  └─────────────────────────────────────────────────────┘  │
│                             │                              │
│                             ▼                              │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                  OpenClaw Core                      │  │
│  │         (消息路由、AI 处理、技能执行)                  │  │
│  └─────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### 2.2 模块设计

#### 2.2.1 消息加密模块 (WeComCrypto)
- **职责**: 处理企业微信回调消息的加密/解密、签名验证
- **公开 API**:
  - `verifyURL(msgSignature, timestamp, nonce, echostr)`: 验证URL
  - `decryptMessage(...)`: 解密消息
  - `encrypt(message)`: 加密消息

#### 2.2.2 API客户端模块 (WeComAPI)
- **职责**: 封装企业微信 API，支持消息发送、用户获取、群聊管理等
- **公开 API**:
  - `getAccessToken()`: 获取访问令牌
  - `sendText/userId, content)`: 发送文本
  - `sendMarkdown(userId, content)`: 发送 Markdown
  - `sendTextCard(...)`: 发送图文卡片
  - `getUserInfo(userId)`: 获取用户信息
  - `createChat(...)`: 创建群聊
  - `sendChatMessage(...)`: 发送群消息

#### 2.2.3 消息处理器模块 (WeComMessageHandler)
- **职责**: 解析企业微信消息格式，转换为 OpenClaw 标准格式
- **公开 API**:
  - `parseCallbackMessage(xml)`: 解析 XML 消息
  - `toOpenClawMessage(wecomMsg)`: 转换为 OpenClaw 格式
  - `isValidMessage(msg)`: 验证消息有效性

#### 2.2.4 插件主模块 (WeComPlugin)
- **职责**: 整合各模块，提供统一的插件接口
- **公开 API**:
  - `onMessage(handler)`: 设置消息处理函数
  - `handleCallback(...)`: 处理回调
  - `send(...)`: 发送消息

---

## 3. 数据流设计

### 3.1 消息接收流程

```
1. 用户发送消息 → 企业微信服务器
2. 企业微信服务器 → POST 回调到 OpenClaw Gateway
3. WeComPlugin.verifyURL() → 验证签名
4. WeComPlugin.handleCallback() → 解密消息
5. WeComMessageHandler.toOpenClawMessage() → 转换为标准格式
6. 消息注入 OpenClaw Core → AI 处理
7. AI 响应 → WeComPlugin.send() → WeComAPI → 企业微信 → 用户
```

### 3.2 消息格式转换

```
企业微信 XML 格式:
<xml>
  <Encrypt><![CDATA[encrypted_content]]></Encrypt>
  <MsgSignature><![CDATA[signature]]></MsgSignature>
  <TimeStamp>1234567890</TimeStamp>
  <Nonce><![CDATA[random]]></Nonce>
</xml>

OpenClaw 标准格式:
{
  id: "wecom_userid_msgid_timestamp",
  type: "text" | "image" | "file" | "voice",
  text: "消息内容",
  userId: "userid",
  chatId: "chatid (可选)",
  timestamp: 1234567890000,
  raw: { /* 原始消息对象 */ }
}
```

---

## 4. 安全设计

### 4.1 消息加密
- 使用 AES-256-CBC 加密
- EncodingAESKey 为 43 位 Base64 字符串
- 支持 PKCS7 填充

### 4.2 签名验证
- 使用 SHA1 签名算法
- 验证 token、timestamp、nonce、encrypt_msg 的组合

### 4.3 敏感信息存储
- 企业微信密钥不存储在代码中
- 通过环境变量或 OpenClaw 配置获取
- 支持加密存储

---

## 5. 配置设计

### 5.1 配置参数

| 参数 | 必填 | 描述 |
|------|------|------|
| corpId | ✅ | 企业ID，企业管理后台获取 |
| agentId | ✅ | 应用AgentId |
| secret | ✅ | 应用Secret |
| token | ✅ | 回调验证Token |
| encodingAESKey | ✅ | 回调消息加密Key (43位) |

### 5.2 配置方式

```typescript
// 方式1: 代码配置
const plugin = createWeComPlugin({
  corpId: process.env.WECOM_CORP_ID,
  agentId: process.env.WECOM_AGENT_ID,
  secret: process.env.WECOM_SECRET,
  token: process.env.WECOM_TOKEN,
  encodingAESKey: process.env.WECOM_ENCODING_AES_KEY
});

// 方式2: OpenClaw 配置 (推荐)
const config = {
  corpId: '{{openclaw.config.wecom.corpId}}',
  // ...
};
```

---

## 6. 接口设计

### 6.1 REST API

#### 回调验证
```
GET /api/wecom/webhook
Query:
  - msg_signature: 签名
  - timestamp: 时间戳
  - nonce: 随机字符串
  - echostr: 加密的随机字符串

Response:
  解密后的 echostr 字符串
```

#### 消息接收
```
POST /api/wecom/webhook
Query:
  - msg_signature: 签名
  - timestamp: 时间戳
  - nonce: 随机字符串
Body: XML 格式的加密消息

Response:
  "success" (企业微信期望的响应)
```

---

## 7. 错误处理

### 7.1 错误码映射

| 错误码 | 描述 | 处理方式 |
|--------|------|----------|
| 0 | 成功 | 正常处理 |
| 40001 | 无效的access_token | 刷新token后重试 |
| 40013 | Corpid无效 | 检查配置 |
| 40014 | access_token失效 | 刷新token |
| 40066 | URL无效 | 检查回调URL配置 |
| 81013 | 用户不存在 | 检查userId |

### 7.2 重试机制
- API 请求失败自动重试 3 次
- 指数退避: 1s → 2s → 4s
- 记录失败日志

---

## 8. 测试策略

### 8.1 单元测试
- WeComCrypto: 加密/解密、签名验证
- WeComAPI: API 请求模拟
- WeComMessageHandler: 消息解析和转换

### 8.2 集成测试
- 模拟企业微信回调
- 端到端消息收发

### 8.3 Mock 数据
- 使用 nock 模拟 HTTP 请求
- 提供测试用的 XML 消息样本

---

## 9. 性能考虑

### 9.1 缓存
- AccessToken 缓存 7000 秒 (企业微信有效期 7200 秒)
- 用户信息缓存 3600 秒

### 9.2 并发
- 支持多个消息并发处理
- 使用连接池管理 API 请求

### 9.3 限流
- 遵守企业微信 API 调用频率限制
- 消息群发限制: 每小时 200 条

---

## 10. 后续规划

### v1.1.0 (规划中)
- [ ] 支持消息已读回执
- [ ] 支持群聊@消息
- [ ] 支持工作流审批通知

### v1.2.0 (规划中)
- [ ] 支持小程序消息
- [ ] 支持通讯录同步
- [ ] 支持多语言界面

### v2.0.0 (规划中)
- [ ] 支持企业微信开放平台应用
- [ ] 支持第三方应用集成
- [ ] 支持消息审计
