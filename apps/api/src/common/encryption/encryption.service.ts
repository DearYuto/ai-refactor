import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');

    if (!encryptionKey) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('ENCRYPTION_KEY must be set in production');
      }
      // 개발 환경용 임시 키 (32바이트)
      console.warn('⚠️ Using temporary encryption key for development');
      this.key = Buffer.from('0'.repeat(64), 'hex');
    } else {
      this.key = Buffer.from(encryptionKey, 'hex');
    }

    if (this.key.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
    }
  }

  /**
   * AES-256-GCM으로 텍스트 암호화
   * @param text 암호화할 평문
   * @returns Base64 인코딩된 암호문 (IV + AuthTag + Ciphertext)
   */
  encrypt(text: string): string {
    const iv = randomBytes(16); // 128-bit IV
    const cipher = createCipheriv(this.algorithm, this.key, iv);

    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    // IV (16) + AuthTag (16) + Ciphertext를 하나의 버퍼로 결합
    return Buffer.concat([iv, authTag, encrypted]).toString('base64');
  }

  /**
   * AES-256-GCM으로 암호문 복호화
   * @param encrypted Base64 인코딩된 암호문
   * @returns 복호화된 평문
   */
  decrypt(encrypted: string): string {
    const data = Buffer.from(encrypted, 'base64');

    const iv = data.subarray(0, 16);
    const authTag = data.subarray(16, 32);
    const ciphertext = data.subarray(32);

    const decipher = createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);

    return decipher.update(ciphertext) + decipher.final('utf8');
  }
}
