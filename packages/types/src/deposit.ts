export interface DepositRecord {
  id: string;
  userId: string;
  asset: string;
  amount: number;
  txHash: string | null;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  createdAt: string;
  confirmedAt: string | null;
}
