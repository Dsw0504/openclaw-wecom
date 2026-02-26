import { describe, it, expect } from 'vitest';
import { parseXMLToObject, generateMessageId } from '../src/utils/crypto.js';

describe('WeComCrypto', () => {
  describe('generateMessageId', () => {
    it('should generate message IDs with correct format', () => {
      const id = generateMessageId('user1', 'msg1');
      
      expect(id).toContain('wecom_user1_msg1_');
      expect(id).toMatch(/^wecom_user1_msg1_\d+$/);
    });

    it('should generate different IDs for different messages', async () => {
      const id1 = generateMessageId('user1', 'msg1');
      await new Promise((resolve) => setTimeout(resolve, 15));
      const id2 = generateMessageId('user1', 'msg2');
      
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
