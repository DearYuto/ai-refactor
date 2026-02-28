/**
 * Skeleton 컴포넌트
 *
 * 로딩 상태를 나타내는 애니메이션 placeholder
 *
 * @example
 * ```tsx
 * <Skeleton className="h-8 w-32" />
 * ```
 */
export function Skeleton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
    />
  );
}

/**
 * 주문 목록 로딩 Skeleton
 */
export function OrderListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-2 items-center">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-32 flex-1" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

/**
 * 잔고 정보 로딩 Skeleton
 */
export function BalanceSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-6 w-32" />
      </div>
    </div>
  );
}

/**
 * 호가창 로딩 Skeleton
 */
export function OrderbookSkeleton() {
  return (
    <div className="space-y-1">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="flex gap-2">
          <Skeleton className="h-6 w-24 flex-1" />
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}

/**
 * 체결 내역 로딩 Skeleton
 */
export function TradeListSkeleton() {
  return (
    <div className="space-y-1">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
        <div key={i} className="flex gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24 flex-1" />
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
}

/**
 * 카드 형태 로딩 Skeleton
 */
export function CardSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

/**
 * 테이블 행 로딩 Skeleton
 */
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex gap-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-8 flex-1" />
      ))}
    </div>
  );
}

/**
 * 테이블 로딩 Skeleton
 */
export function TableSkeleton({
  rows = 5,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} columns={columns} />
      ))}
    </div>
  );
}
