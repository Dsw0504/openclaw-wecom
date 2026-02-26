/**
 * 企业微信消息类型
 */
export enum WeComMsgType {
  TEXT = 'text',
  IMAGE = 'image',
  VOICE = 'voice',
  VIDEO = 'video',
  FILE = 'file',
  TEXTCARD = 'textcard',
  NEWS = 'news',
  Markdown = 'markdown',
  MINIPROGRAM_NOTICE = 'miniprogram_notice',
  EVENT = 'event'
}

/**
 * 企业微信事件类型
 */
export enum WeComEventType {
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
  ENTER_AGENT = 'enter_agent',
  LOCATION_SELECT = 'location_select',
  PIC_PHOTO_OR_ALBUM = 'pic_photo_or_album',
  PIC_WECHAT = 'pic_weixin',
  PIC_SYSPHOTO = 'pic_sysphoto',
  CLICK = 'click',
  VIEW = 'view',
  SCAN_CODE_PUSH = 'scancode_push',
  SCAN_CODE_WAIT_MSG = 'scancode_waitmsg',
  TEMPLATE_SEND_JOB_FINISH = 'template_send_job_finish'
}

/**
 * 企业微信回调消息结构
 */
export interface WeComCallbackMessage {
  msgType: string;
  event: string;
  agentId: string;
  userId: string;
  content: string;
  msgId: string;
  createTime: string;
  chatId?: string;
}

/**
 * 发送文本消息请求
 */
export interface SendTextRequest {
  touser: string;
  msgtype: string;
  agentid: string;
  text: {
    content: string;
  };
}

/**
 * 发送Markdown请求
 */
export interface SendMarkdownRequest {
  touser: string;
  msgtype: string;
  agentid: string;
  markdown: {
    content: string;
  };
}

/**
 * 发送图文卡片请求
 */
export interface SendTextCardRequest {
  touser: string;
  msgtype: string;
  agentid: string;
  textcard: {
    title: string;
    description: string;
    url: string;
    btntxt: string;
  };
}

/**
 * 发送应用消息响应
 */
export interface SendResponse {
  errcode: number;
  errmsg: string;
  msgid?: string;
  invaliduser?: string;
  invalidparty?: string;
  invalidtag?: string;
  unlicenseduser?: string;
  msgid_list?: string[];
}

/**
 * 获取AccessToken响应
 */
export interface AccessTokenResponse {
  errcode: number;
  errmsg: string;
  access_token?: string;
  expires_in?: number;
}

/**
 * 插件配置
 */
export interface WeComConfig {
  corpId: string;
  agentId: string;
  secret: string;
  token: string;
  encodingAESKey: string;
}

/**
 * OpenClaw消息格式
 */
export interface OpenClawMessage {
  id: string;
  type: 'text' | 'image' | 'file' | 'voice';
  text?: string;
  userId: string;
  chatId?: string;
  timestamp: number;
  raw: WeComCallbackMessage;
}
