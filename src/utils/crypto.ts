import CryptoJS from 'crypto-js';
import type { WeComConfig } from '../types/index.js';

/**
 * 企业微信消息加密/解密工具
 * 参考: https://developer.work.weixin.qq.com/document/16583/
 */
export class WeComCrypto {
  private token: string;
  private encodingAESKey: string;
  private corpId: string;

  constructor(config: WeComConfig) {
    this.token = config.token;
    this.encodingAESKey = config.encodingAESKey;
    this.corpId = config.corpId;
  }

  /**
   * 验证URL签名
   */
  verifyURL(msgSignature: string, timestamp: string, nonce: string, echostr: string): string {
    const signature = this.getSignature(timestamp, nonce, echostr);
    if (signature !== msgSignature) {
      throw new Error('签名验证失败');
    }
    return this.decrypt(echostr);
  }

  /**
   * 解密消息
   */
  decryptMessage(msgSignature: string, timestamp: string, nonce: string, xmlContent: string): string {
    const signature = this.getSignature(timestamp, nonce, xmlContent);
    if (signature !== msgSignature) {
      throw new Error('签名验证失败');
    }
    return this.decrypt(xmlContent);
  }

  /**
   * 加密消息
   */
  encrypt(message: string): string {
    const randomStr = this.generateRandomStr(16);
    const time = Math.floor(Date.now() / 1000).toString();
    const nonce = this.generateRandomStr(16);

    // 拼接: random(16) + msg_len(4) + msg + corpId
    const content = randomStr + this.int32ToBytes(message.length).toString() + message + this.corpId;
    const encrypted = this.AESEncrypt(content, this.encodingAESKey);

    const signature = this.getSignature(time, nonce, encrypted);

    return this.generateXML(signature, time, nonce, encrypted);
  }

  /**
   * 生成签名
   */
  private getSignature(timestamp: string, nonce: string, encryptMsg: string): string {
    const arr = [this.token, timestamp, nonce, encryptMsg].sort();
    const str = arr.join('');
    return CryptoJS.SHA1(str).toString();
  }

  /**
   * AES解密
   */
  private decrypt(encryptMsg: string): string {
    const encrypted = CryptoJS.enc.Base64.parse(encryptMsg);
    const key = CryptoJS.enc.Base64.parse(this.encodingAESKey);

    const decrypted = CryptoJS.AES.decrypt(
      {
        ciphertext: encrypted
      } as CryptoJS.lib.CipherParams,
      key,
      {
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }
    );

    const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);

    // 解析: random(16) + msg_len(4) + msg + corpId
    const content = decryptedStr.slice(16);
    const msgLen = parseInt(content.slice(0, 4), 10);
    const message = content.slice(4, 4 + msgLen);
    const fromCorpId = content.slice(4 + msgLen);

    if (fromCorpId !== this.corpId) {
      throw new Error('CorpId不匹配');
    }

    return message;
  }

  /**
   * AES加密
   */
  private AESEncrypt(text: string, aesKey: string): string {
    const key = CryptoJS.enc.Base64.parse(aesKey);
    const iv = key.clone();
    iv.words.splice(0, 4); // IV = AESKey[0:16]

    const encrypted = CryptoJS.AES.encrypt(text, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    return encrypted.ciphertext.toString(CryptoJS.enc.Base64);
  }

  /**
   * 生成随机字符串
   */
  private generateRandomStr(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * int转4字节字符串
   */
  private int32ToBytes(n: number): string {
    const bytes = [];
    bytes.push((n >> 24) & 0xff);
    bytes.push((n >> 16) & 0xff);
    bytes.push((n >> 8) & 0xff);
    bytes.push(n & 0xff);
    return String.fromCharCode(...bytes);
  }

  /**
   * 生成回复XML
   */
  private generateXML(signature: string, timestamp: string, nonce: string, encrypt: string): string {
    return `<xml>
<Encrypt><![CDATA[${encrypt}]]></Encrypt>
<MsgSignature><![CDATA[${signature}]]></MsgSignature>
<TimeStamp>${timestamp}</TimeStamp>
<Nonce><![CDATA[${nonce}]]></Nonce>
</xml>`;
  }
}

/**
 * XML解析工具
 */
export function parseXMLToObject(xml: string): Record<string, string> {
  // 简化的XML解析
  const result: Record<string, string> = {};
  const pattern = /<(\w+)><!\[CDATA\[(.*?)\]\]><\/(\w+)>/g;
  let match;
  while ((match = pattern.exec(xml)) !== null) {
    result[match[1]] = match[2];
  }
  return result;
}

/**
 * 生成唯一消息ID
 */
export function generateMessageId(userId: string, msgId: string): string {
  return `wecom_${userId}_${msgId}_${Date.now()}`;
}
