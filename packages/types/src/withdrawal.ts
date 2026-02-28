export interface WithdrawalRecord {
  id: string;
  userId: string;
  asset: string;
  amount: number;
  fee: number;
  toAddress: string;
  txHash: string | null;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected';
  rejectReason: string | null;
  requestedAt: string;
  approvedAt: string | null;
  completedAt: string | null;
}
