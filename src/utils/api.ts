import axios, { AxiosInstance } from 'axios';
import type {
  WeComConfig,
  AccessTokenResponse,
  SendResponse,
  SendTextRequest,
  SendMarkdownRequest,
  SendTextCardRequest
} from '../types/index.js';

/**
 * 企业微信API客户端
 */
export class WeComAPI {
  private config: WeComConfig;
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpireTime: number = 0;

  constructor(config: WeComConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: 'https://qyapi.weixin.qq.com',
      timeout: 10000
    });
  }

  /**
   * 获取AccessToken
   */
  async getAccessToken(): Promise<string> {
    // 检查缓存的token是否有效
    if (this.accessToken && Date.now() < this.tokenExpireTime) {
      return this.accessToken;
    }

    const response = await this.client.get<AccessTokenResponse>('/cgi-bin/gettoken', {
      params: {
        corpid: this.config.corpId,
        corpsecret: this.config.secret
      }
    });

    const data = response.data;
    if (data.errcode !== 0) {
      throw new Error(`获取AccessToken失败: ${data.errmsg}`);
    }

    this.accessToken = data.access_token!;
    // 提前5分钟过期
    this.tokenExpireTime = Date.now() + (data.expires_in! - 300) * 1000;
    return this.accessToken!;
  }

  /**
   * 发送文本消息
   */
  async sendText(userId: string, content: string): Promise<SendResponse> {
    const token = await this.getAccessToken();
    const request: SendTextRequest = {
      touser: userId,
      msgtype: 'text',
      agentid: this.config.agentId,
      text: { content }
    };

    const response = await this.client.post<SendResponse>(
      `/cgi-bin/message/send?access_token=${token}`,
      request
    );

    return response.data;
  }

  /**
   * 发送Markdown消息
   */
  async sendMarkdown(userId: string, content: string): Promise<SendResponse> {
    const token = await this.getAccessToken();
    const request: SendMarkdownRequest = {
      touser: userId,
      msgtype: 'markdown',
      agentid: this.config.agentId,
      markdown: { content }
    };

    const response = await this.client.post<SendResponse>(
      `/cgi-bin/message/send?access_token=${token}`,
      request
    );

    return response.data;
  }

  /**
   * 发送图文卡片
   */
  async sendTextCard(
    userId: string,
    title: string,
    description: string,
    url: string,
    btnTxt: string = '详情'
  ): Promise<SendResponse> {
    const token = await this.getAccessToken();
    const request: SendTextCardRequest = {
      touser: userId,
      msgtype: 'textcard',
      agentid: this.config.agentId,
      textcard: {
        title,
        description,
        url,
        btntxt: btnTxt
      }
    };

    const response = await this.client.post<SendResponse>(
      `/cgi-bin/message/send?access_token=${token}`,
      request
    );

    return response.data;
  }

  /**
   * 发送图片消息
   */
  async sendImage(userId: string, mediaId: string): Promise<SendResponse> {
    const token = await this.getAccessToken();
    const request = {
      touser: userId,
      msgtype: 'image',
      agentid: this.config.agentId,
      image: { media_id: mediaId }
    };

    const response = await this.client.post<SendResponse>(
      `/cgi-bin/message/send?access_token=${token}`,
      request
    );

    return response.data;
  }

  /**
   * 上传临时素材
   */
  async uploadMedia(type: 'image' | 'voice' | 'video' | 'file', filePath: string): Promise<{ media_id: string }> {
    const token = await this.getAccessToken();
    const formData = new FormData();
    formData.append('media', new Blob([require('fs').readFileSync(filePath)]), 'file');

    const response = await this.client.post(
      `/cgi-bin/media/upload?access_token=${token}&type=${type}`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );

    const data = response.data as { errcode: number; errmsg: string; media_id: string };
    if (data.errcode !== 0) {
      throw new Error(`上传素材失败: ${data.errmsg}`);
    }

    return { media_id: data.media_id };
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(userId: string): Promise<{ name: string; avatar?: string }> {
    const token = await this.getAccessToken();
    const response = await this.client.get('/cgi-bin/user/get', {
      params: {
        access_token: token,
        userid: userId
      }
    });

    const data = response.data;
    if (data.errcode !== 0) {
      throw new Error(`获取用户信息失败: ${data.errmsg}`);
    }

    return {
      name: data.name,
      avatar: data.avatar
    };
  }

  /**
   * 创建群聊
   */
  async createChat(name: string, ownerUserId: string, userIds: string[]): Promise<{ chatid: string }> {
    const token = await this.getAccessToken();
    const response = await this.client.post(
      `/cgi-bin/appchat/create?access_token=${token}`,
      {
        name,
        owner: ownerUserId,
        userlist: userIds
      }
    );

    const data = response.data;
    if (data.errcode !== 0) {
      throw new Error(`创建群聊失败: ${data.errmsg}`);
    }

    return { chatid: data.chatid };
  }

  /**
   * 发送群消息
   */
  async sendChatMessage(chatId: string, content: string): Promise<SendResponse> {
    const token = await this.getAccessToken();
    const request = {
      chatid: chatId,
      msgtype: 'text',
      text: { content }
    };

    const response = await this.client.post<SendResponse>(
      `/cgi-bin/appchat/send?access_token=${token}`,
      request
    );

    return response.data;
  }
}
