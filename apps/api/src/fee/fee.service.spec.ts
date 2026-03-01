import { Test, TestingModule } from '@nestjs/testing';
import { FeeService } from './fee.service';
import { PrismaService } from '../database/prisma.service';

describe('FeeService', () => {
  let service: FeeService;
  let prisma: PrismaService;

  const mockFeeConfig = {
    id: 'fee-123',
    asset: 'BTC',
    makerFee: 0.001, // 0.1%
    takerFee: 0.002, // 0.2%
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeeService,
        {
          provide: PrismaService,
          useValue: {
            fee: {
              findUnique: jest.fn(),
              upsert: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<FeeService>(FeeService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateFee', () => {
    it('limit 주문에 대해 Maker 수수료를 계산해야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.fee, 'findUnique').mockResolvedValue(mockFeeConfig);

      // Act
      const fee = await service.calculateFee('limit', 0.5, 50000, 'BTC');

      // Assert
      // fee = size * price * makerFee
      // fee = 0.5 * 50000 * 0.001 = 25
      expect(fee).toBe(25);
    });

    it('market 주문에 대해 Taker 수수료를 계산해야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.fee, 'findUnique').mockResolvedValue(mockFeeConfig);

      // Act
      const fee = await service.calculateFee('market', 0.5, 50000, 'BTC');

      // Assert
      // fee = size * price * takerFee
      // fee = 0.5 * 50000 * 0.002 = 50
      expect(fee).toBe(50);
    });

    it('DB에 수수료 설정이 없으면 기본값을 사용해야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.fee, 'findUnique').mockResolvedValue(null);

      // Act
      const makerFee = await service.calculateFee('limit', 1, 1000, 'ETH');
      const takerFee = await service.calculateFee('market', 1, 1000, 'ETH');

      // Assert
      // DEFAULT_MAKER_FEE = 0.001 (0.1%)
      // DEFAULT_TAKER_FEE = 0.002 (0.2%)
      expect(makerFee).toBe(1); // 1 * 1000 * 0.001
      expect(takerFee).toBe(2); // 1 * 1000 * 0.002
    });

    it('수수료는 거래 금액에 비례해야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.fee, 'findUnique').mockResolvedValue(mockFeeConfig);

      // Act
      const smallFee = await service.calculateFee('limit', 0.1, 50000, 'BTC');
      const largeFee = await service.calculateFee('limit', 1.0, 50000, 'BTC');

      // Assert
      expect(largeFee).toBe(smallFee * 10);
    });

    it('수수료는 가격에 비례해야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.fee, 'findUnique').mockResolvedValue(mockFeeConfig);

      // Act
      const lowPriceFee = await service.calculateFee('limit', 1, 10000, 'BTC');
      const highPriceFee = await service.calculateFee('limit', 1, 50000, 'BTC');

      // Assert
      expect(highPriceFee).toBe(lowPriceFee * 5);
    });
  });

  describe('getFeeConfig', () => {
    it('DB에서 자산별 수수료 설정을 조회해야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.fee, 'findUnique').mockResolvedValue(mockFeeConfig);

      // Act
      const config = await service.getFeeConfig('BTC');

      // Assert
      expect(config).toEqual({
        makerFee: 0.001,
        takerFee: 0.002,
      });
      expect(prisma.fee.findUnique).toHaveBeenCalledWith({
        where: { asset: 'BTC' },
      });
    });

    it('설정이 없으면 기본값을 반환해야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.fee, 'findUnique').mockResolvedValue(null);

      // Act
      const config = await service.getFeeConfig('UNKNOWN');

      // Assert
      expect(config).toEqual({
        makerFee: 0.001, // DEFAULT_MAKER_FEE
        takerFee: 0.002, // DEFAULT_TAKER_FEE
      });
    });
  });

  describe('setFeeConfig', () => {
    it('자산별 수수료율을 설정해야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.fee, 'upsert').mockResolvedValue({
        id: 'fee-456',
        asset: 'ETH',
        makerFee: 0.0005,
        takerFee: 0.001,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      await service.setFeeConfig('ETH', 0.0005, 0.001);

      // Assert
      expect(prisma.fee.upsert).toHaveBeenCalledWith({
        where: { asset: 'ETH' },
        update: { makerFee: 0.0005, takerFee: 0.001 },
        create: { asset: 'ETH', makerFee: 0.0005, takerFee: 0.001 },
      });
    });

    it('기존 설정이 있으면 업데이트해야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.fee, 'upsert').mockResolvedValue({
        id: 'fee-789',
        asset: 'BTC',
        makerFee: 0.0008,
        takerFee: 0.0015,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      await service.setFeeConfig('BTC', 0.0008, 0.0015);

      // Assert
      expect(prisma.fee.upsert).toHaveBeenCalled();
    });
  });

  describe('estimateFee', () => {
    it('수수료와 수수료율을 함께 반환해야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.fee, 'findUnique').mockResolvedValue(mockFeeConfig);

      // Act
      const result = await service.estimateFee('limit', 0.5, 50000, 'BTC');

      // Assert
      expect(result).toEqual({
        fee: 25, // 0.5 * 50000 * 0.001
        feeRate: 0.001, // makerFee
      });
    });

    it('market 주문에 대해 Taker 수수료율을 반환해야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.fee, 'findUnique').mockResolvedValue(mockFeeConfig);

      // Act
      const result = await service.estimateFee('market', 0.5, 50000, 'BTC');

      // Assert
      expect(result).toEqual({
        fee: 50, // 0.5 * 50000 * 0.002
        feeRate: 0.002, // takerFee
      });
    });

    it('DB 설정이 없으면 기본 수수료율을 반환해야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.fee, 'findUnique').mockResolvedValue(null);

      // Act
      const makerResult = await service.estimateFee('limit', 1, 1000, 'ETH');
      const takerResult = await service.estimateFee('market', 1, 1000, 'ETH');

      // Assert
      expect(makerResult.feeRate).toBe(0.001);
      expect(takerResult.feeRate).toBe(0.002);
    });
  });

  describe('수수료율 검증', () => {
    it('Taker 수수료는 Maker 수수료보다 높아야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.fee, 'findUnique').mockResolvedValue(mockFeeConfig);

      // Act
      const config = await service.getFeeConfig('BTC');

      // Assert
      expect(config.takerFee).toBeGreaterThan(config.makerFee);
    });

    it('기본 Taker 수수료는 기본 Maker 수수료보다 높아야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.fee, 'findUnique').mockResolvedValue(null);

      // Act
      const config = await service.getFeeConfig('UNKNOWN');

      // Assert
      expect(config.takerFee).toBeGreaterThan(config.makerFee);
      expect(config.takerFee).toBe(0.002);
      expect(config.makerFee).toBe(0.001);
    });
  });
});
