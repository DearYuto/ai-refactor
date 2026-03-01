import { BadRequestException } from '@nestjs/common';
import { validateDepositAddress } from './address.validator';

describe('validateDepositAddress', () => {
  describe('BTC 주소 검증', () => {
    it('유효한 Legacy P2PKH 주소 (1로 시작)', () => {
      expect(() =>
        validateDepositAddress('BTC', '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'),
      ).not.toThrow();
    });

    it('유효한 P2SH 주소 (3으로 시작)', () => {
      expect(() =>
        validateDepositAddress('BTC', '3J98t1WpEZ73CNmYviecrnyiWrnqRhWNLy'),
      ).not.toThrow();
    });

    it('유효한 Bech32 주소 (bc1로 시작)', () => {
      expect(() =>
        validateDepositAddress(
          'BTC',
          'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
        ),
      ).not.toThrow();
    });

    it('잘못된 BTC 주소 형식 (잘못된 접두사)', () => {
      expect(() =>
        validateDepositAddress('BTC', '2A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'),
      ).toThrow(BadRequestException);
    });

    it('잘못된 BTC 주소 형식 (너무 짧음)', () => {
      expect(() => validateDepositAddress('BTC', '1A1zP1eP')).toThrow(
        BadRequestException,
      );
    });
  });

  describe('USDT (ERC-20) 주소 검증', () => {
    it('유효한 Ethereum 주소', () => {
      expect(() =>
        validateDepositAddress(
          'USDT',
          '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        ),
      ).not.toThrow();
    });

    it('잘못된 USDT 주소 (0x 없음)', () => {
      expect(() =>
        validateDepositAddress(
          'USDT',
          '742d35Cc6634C0532925a3b844Bc454e4438f44e',
        ),
      ).toThrow(BadRequestException);
    });

    it('잘못된 USDT 주소 (길이 부족)', () => {
      expect(() => validateDepositAddress('USDT', '0x742d35Cc')).toThrow(
        BadRequestException,
      );
    });

    it('잘못된 USDT 주소 (hex가 아닌 문자)', () => {
      expect(() =>
        validateDepositAddress(
          'USDT',
          '0x742d35Cc6634C0532925a3b844Bc454e4438f44G',
        ),
      ).toThrow(BadRequestException);
    });
  });

  describe('KRW 주소 검증', () => {
    it('KRW는 블록체인 주소 검증을 건너뜁니다', () => {
      expect(() => validateDepositAddress('KRW', '아무 값이나')).not.toThrow();
    });
  });

  describe('에러 케이스', () => {
    it('빈 주소', () => {
      expect(() => validateDepositAddress('BTC', '')).toThrow(
        BadRequestException,
      );
    });

    it('공백만 있는 주소', () => {
      expect(() => validateDepositAddress('BTC', '   ')).toThrow(
        BadRequestException,
      );
    });

    it('지원하지 않는 자산', () => {
      expect(() =>
        validateDepositAddress(
          'ETH',
          '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        ),
      ).toThrow(BadRequestException);
    });
  });
});
