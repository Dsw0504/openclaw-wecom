import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WeComCrypto, parseXMLToObject, generateMessageId } from '../src/utils/crypto.js';
import type { WeComConfig } from '../src/types/index.js';

describe('WeComCrypto', () => {
  const config: WeComConfig = {
    corpId: 'test-corp-id',
    agentId: '1000001',
    secret: 'test-secret',
    token: 'test-token',
    encodingAESKey: 'abcdefghijklmnopqrstuvwxyz1234567890abcd' // 43位
  };

  let crypto: WeComCrypto;

  beforeEach(() => {
    crypto = new WeComCrypto(config);
  });

  describe('generateMessageId', () => {
    it('should generate unique message IDs', () => {
      const id1 = generateMessageId('user1', 'msg1');
      const id2 = generateMessageId('user1', 'msg1');
      
      expect(id1).toContain('wecom_user1_msg1_');
      // 由于时间戳不同，ID 应该不同
      expect(id1).not.toBe(id2);
    });
  });

  describe('parseXMLToObject', () => {
    it('should parse simple XML', () => {
      const xml = '<xml><Name><![CDATA[test]]></Name></xml>';
      const result = parseXMLToObject(xml);
      
      expect(result.Name).toBe('test');
    });
  });
});
