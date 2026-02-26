import type { WeComConfig, OpenClawMessage, WeComCallbackMessage } from './types/index.js';
import { WeComCrypto } from './utils/crypto.js';
import { WeComAPI } from './utils/api.js';
import { WeComMessageHandler } from './handlers/message.js';

/**
 * OpenClaw 企业微信插件
 */
export class WeComPlugin {
  private config: WeComConfig;
  private crypto: WeComCrypto;
  private api: WeComAPI;
  private handler: WeComMessageHandler;
  private messageHandler?: (msg: OpenClawMessage) => void;

  constructor(config: WeComConfig) {
    this.config = config;
    this.crypto = new WeComCrypto(config);
    this.api = new WeComAPI(config);
    this.handler = new WeComMessageHandler();
  }

  /**
   * 设置消息处理器
   */
  onMessage(handler: (msg: OpenClawMessage) => void): void {
    this.messageHandler = handler;
  }

  /**
   * 处理企业微信回调验证 (URL验证)
   */
  verifyURL(
    msgSignature: string,
    timestamp: string,
    nonce: string,
    echostr: string
  ): string {
    return this.crypto.verifyURL(msgSignature, timestamp, nonce, echostr);
  }

  /**
   * 处理接收到的消息
   */
  async handleCallback(
    msgSignature: string,
    timestamp: string,
    nonce: string,
    xmlContent: string
  ): Promise<void> {
    try {
      const decrypted = this.crypto.decryptMessage(
        msgSignature,
        timestamp,
        nonce,
        xmlContent
      );

      const wecomMsg = this.handler.parseCallbackMessage(decrypted);

      if (!this.handler.isValidMessage(wecomMsg)) {
        return;
      }

      const openclawMsg = this.handler.toOpenClawMessage(wecomMsg);

      if (this.messageHandler) {
        await this.messageHandler(openclawMsg);
      }
    } catch (error) {
      console.error('处理企业微信消息失败:', error);
      throw error;
    }
  }

  /**
   * 直接处理消息对象 (用于测试或内部消息)
   */
  async processMessage(wecomMsg: WeComCallbackMessage): Promise<void> {
    if (!this.handler.isValidMessage(wecomMsg)) {
      return;
    }

    const openclawMsg = this.handler.toOpenClawMessage(wecomMsg);

    if (this.messageHandler) {
      await this.messageHandler(openclawMsg);
    }
  }

  /**
   * 发送文本消息
   */
  async sendText(userId: string, content: string): Promise<void> {
    const result = await this.api.sendText(userId, content);
    if (result.errcode !== 0) {
      throw new Error(`发送消息失败: ${result.errmsg}`);
    }
  }

  /**
   * 发送Markdown消息
   */
  async sendMarkdown(userId: string, content: string): Promise<void> {
    const result = await this.api.sendMarkdown(userId, content);
    if (result.errcode !== 0) {
      throw new Error(`发送消息失败: ${result.errmsg}`);
    }
  }

  /**
   * 发送图文卡片
   */
  async sendTextCard(
    userId: string,
    title: string,
    description: string,
    url: string,
    btnTxt?: string
  ): Promise<void> {
    const result = await this.api.sendTextCard(userId, title, description, url, btnTxt);
    if (result.errcode !== 0) {
      throw new Error(`发送消息失败: ${result.errmsg}`);
    }
  }

  /**
   * 发送消息 (根据消息类型自动选择发送方式)
   */
  async send(userId: string, content: string): Promise<void> {
    // 如果包含Markdown语法，使用Markdown发送
    if (this.isMarkdownContent(content)) {
      await this.sendMarkdown(userId, content);
    } else {
      await this.sendText(userId, content);
    }
  }

  /**
   * 获取API实例 (用于高级操作)
   */
  getAPI(): WeComAPI {
    return this.api;
  }

  /**
   * 检查是否为Markdown内容
   */
  private isMarkdownContent(content: string): boolean {
    const markdownIndicators = [
      '###',
      '**',
      '```',
      '- ',
      '1. ',
      '[',
      '](',
      '> '
    ];
    return markdownIndicators.some((indicator) => content.includes(indicator));
  }
}

/**
 * 创建插件实例
 */
export function createWeComPlugin(config: WeComConfig): WeComPlugin {
  return new WeComPlugin(config);
}

export default WeComPlugin;
