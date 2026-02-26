import type { WeComCallbackMessage, OpenClawMessage } from '../types/index.js';
import { WeComMsgType, WeComEventType } from '../types/index.js';
import { generateMessageId } from '../utils/crypto.js';

/**
 * 企业微信消息处理器
 */
export class WeComMessageHandler {
  /**
   * 解析XML消息为对象
   */
  parseCallbackMessage(xml: string): WeComCallbackMessage {
    const getValue = (xml: string, tag: string): string => {
      const pattern = new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`);
      const match = xml.match(pattern);
      return match ? match[1] : '';
    };

    const getAttrValue = (xml: string, tag: string): string => {
      const pattern = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`);
      const match = xml.match(pattern);
      return match ? match[1] : '';
    };

    const msgType = getValue(xml, 'MsgType') as WeComMsgType;
    const event = getValue(xml, 'Event');

    return {
      msgType,
      event,
      agentId: getAttrValue(xml, 'AgentID'),
      userId: getValue(xml, 'FromUserName'),
      content: getValue(xml, 'Content'),
      msgId: getAttrValue(xml, 'MsgId'),
      createTime: getAttrValue(xml, 'CreateTime'),
      chatId: getValue(xml, 'ChatId') || undefined
    };
  }

  /**
   * 将企业微信消息转换为OpenClaw消息格式
   */
  toOpenClawMessage(wecomMsg: WeComCallbackMessage): OpenClawMessage {
    const type = this.getMessageType(wecomMsg.msgType, wecomMsg.content);

    return {
      id: generateMessageId(wecomMsg.userId, wecomMsg.msgId),
      type,
      text: this.extractText(wecomMsg),
      userId: wecomMsg.userId,
      chatId: wecomMsg.chatId,
      timestamp: parseInt(wecomMsg.createTime) * 1000,
      raw: wecomMsg
    };
  }

  /**
   * 判断消息类型
   */
  private getMessageType(msgType: string, _content: string): 'text' | 'image' | 'file' | 'voice' {
    switch (msgType) {
      case WeComMsgType.IMAGE:
        return 'image';
      case WeComMsgType.VOICE:
        return 'voice';
      case WeComMsgType.FILE:
        return 'file';
      default:
        return 'text';
    }
  }

  /**
   * 提取文本内容
   */
  private extractText(msg: WeComCallbackMessage): string {
    switch (msg.msgType) {
      case WeComMsgType.TEXT:
        // 处理群聊@消息
        if (msg.chatId && msg.content.includes('@')) {
          return msg.content.replace(/@[^ ]+/, '').trim();
        }
        return msg.content;
      case WeComMsgType.EVENT:
        return this.formatEventMessage(msg);
      default:
        return `[${msg.msgType}] ${msg.content}`;
    }
  }

  /**
   * 格式化事件消息
   */
  private formatEventMessage(msg: WeComCallbackMessage): string {
    switch (msg.event) {
      case WeComEventType.SUBSCRIBE:
        return '[事件] 用户关注';
      case WeComEventType.UNSUBSCRIBE:
        return '[事件] 用户取消关注';
      case WeComEventType.ENTER_AGENT:
        return '[事件] 用户进入应用';
      case WeComEventType.CLICK:
        return `[事件] 用户点击: ${msg.content}`;
      case WeComEventType.VIEW:
        return `[事件] 用户点击链接: ${msg.content}`;
      default:
        return `[事件] ${msg.event}`;
    }
  }

  /**
   * 检查是否为有效消息
   */
  isValidMessage(msg: WeComCallbackMessage): boolean {
    // 过滤心跳和未知消息类型
    if (!msg.msgType || !msg.userId) {
      return false;
    }

    // 过滤事件类型消息中的某些类型
    if (msg.msgType === WeComMsgType.EVENT) {
      // 关注/取消关注/进入应用等事件保留
      const validEvents = [
        WeComEventType.SUBSCRIBE,
        WeComEventType.UNSUBSCRIBE,
        WeComEventType.ENTER_AGENT,
        WeComEventType.CLICK,
        WeComEventType.VIEW
      ];
      return validEvents.includes(msg.event as WeComEventType);
    }

    return true;
  }

  /**
   * 格式化发送消息为纯文本
   */
  formatOutgoingMessage(text: string): string {
    return text;
  }
}
