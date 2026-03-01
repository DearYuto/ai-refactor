import { BadRequestException } from '@nestjs/common';

/**
 * 비트코인 주소 검증 (Base58 또는 Bech32)
 * - Legacy (P2PKH): 1로 시작, 26-35자
 * - P2SH: 3으로 시작, 26-35자
 * - Bech32 (SegWit): bc1로 시작, 42-62자
 */
function validateBitcoinAddress(address: string): boolean {
  // Legacy P2PKH: 1로 시작
  const p2pkhRegex = /^1[a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  // P2SH: 3으로 시작
  const p2shRegex = /^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  // Bech32 SegWit: bc1로 시작 (소문자)
  const bech32Regex = /^bc1[a-z0-9]{39,59}$/;

  return (
    p2pkhRegex.test(address) ||
    p2shRegex.test(address) ||
    bech32Regex.test(address)
  );
}

/**
 * USDT (ERC-20) 주소 검증
 * - Ethereum 주소 형식: 0x로 시작, 총 42자 (0x + 40자 hex)
 */
function validateEthereumAddress(address: string): boolean {
  const ethRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethRegex.test(address);
}

/**
 * 자산별 입금 주소 검증
 * @param asset 자산 코드 (BTC, USDT, KRW)
 * @param address 입금 주소
 * @throws BadRequestException 잘못된 주소 형식 시
 */
export function validateDepositAddress(asset: string, address: string): void {
  if (!address || address.trim() === '') {
    throw new BadRequestException('입금 주소가 비어있습니다.');
  }

  const trimmedAddress = address.trim();

  switch (asset) {
    case 'BTC':
      if (!validateBitcoinAddress(trimmedAddress)) {
        throw new BadRequestException(
          '올바르지 않은 비트코인 주소 형식입니다. (1, 3, bc1로 시작하는 주소만 지원)',
        );
      }
      break;

    case 'USDT':
      if (!validateEthereumAddress(trimmedAddress)) {
        throw new BadRequestException(
          '올바르지 않은 USDT (ERC-20) 주소 형식입니다. (0x로 시작하는 42자 Ethereum 주소 필요)',
        );
      }
      break;

    case 'KRW':
      // KRW는 블록체인 주소가 필요 없음 (은행 계좌 등 별도 처리)
      // 필요시 은행 계좌 검증 로직 추가
      break;

    default:
      throw new BadRequestException(`지원하지 않는 자산입니다: ${asset}`);
  }
}
