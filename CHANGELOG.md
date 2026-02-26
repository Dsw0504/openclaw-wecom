# Changelog

All notable changes to this project will be documented in this file.

## [1.0.1] - 2026-02-26

### Fixed
- 修复 ESLint 配置 JSON 格式错误 (不支持注释)
- 修复 TypeScript import type 导致 enum 无法作为值使用的问题
- 修复 crypto.ts 中未使用变量问题
- 修复 api.ts 中 require('fs') 改为 ES 模块导入
- 修复测试用例中时间戳相同导致测试失败的问题
- 添加 package-lock.json 和 node_modules 支持 CI 构建

### Changed
- 更新 CI workflow 优化构建流程

## [1.0.0] - 2026-02-26

### Added
- 初始版本发布
- 消息收发支持 (文本/Markdown/图文卡片)
- 回调消息加密/解密
- 签名验证
- 群聊支持
- 完整的 TypeScript 类型定义
- CI/CD 配置
