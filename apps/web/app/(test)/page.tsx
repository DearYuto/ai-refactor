'use client' // 이 줄은 "브라우저에서 실행되는 컴포넌트"라는 뜻이에요

// React에서 상태를 관리하기 위한 도구를 가져옵니다
import { useState } from 'react'

/**
 * 카운터 앱 페이지
 *
 * 이 페이지는 /test 주소로 접속하면 볼 수 있어요
 */
export default function CounterTestPage() {
  // ===== 상태 관리 =====
  // count: 현재 숫자 값 (처음엔 0부터 시작)
  // setCount: 숫자를 바꾸는 함수
  const [count, setCount] = useState(0)

  // ===== 버튼 동작 함수들 =====

  // 숫자를 1 증가시키는 함수
  const increment = () => {
    setCount(count + 1)
  }

  // 숫자를 1 감소시키는 함수
  const decrement = () => {
    setCount(count - 1)
  }

  // 숫자를 0으로 초기화하는 함수
  const reset = () => {
    setCount(0)
  }

  // ===== 화면에 보여줄 내용 =====
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-main)]">
      {/* 카운터 카드 */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-8 shadow-[var(--shadow-card)] border border-[var(--color-border)]">
        {/* 제목 */}
        <h1 className="text-3xl font-bold text-[var(--color-text-main)] mb-8 text-center">
          테스트 카운터 앱
        </h1>

        {/* 현재 카운트 숫자 (크게 표시) */}
        <div className="text-center mb-8">
          <div className="text-7xl font-bold text-[var(--color-brand-400)]">
            {count}
          </div>
          <div className="text-sm text-[var(--color-text-sub)] mt-2">
            현재 카운트
          </div>
        </div>

        {/* 버튼들 */}
        <div className="flex gap-4">
          {/* 감소 버튼 (빨간색 계열) */}
          <button
            onClick={decrement}
            className="flex-1 bg-[var(--color-sell-bg)] text-[var(--color-sell)] hover:bg-[var(--color-sell)] hover:text-white border border-[var(--color-sell-border)] rounded-xl px-6 py-3 font-semibold transition-all"
          >
            감소 (-)
          </button>

          {/* 리셋 버튼 (회색 계열) */}
          <button
            onClick={reset}
            className="flex-1 bg-[var(--color-surface-muted)] text-[var(--color-text-main)] hover:bg-[var(--color-border)] border border-[var(--color-border)] rounded-xl px-6 py-3 font-semibold transition-all"
          >
            리셋 (0)
          </button>

          {/* 증가 버튼 (초록색 계열) */}
          <button
            onClick={increment}
            className="flex-1 bg-[var(--color-buy-bg)] text-[var(--color-buy)] hover:bg-[var(--color-buy)] hover:text-white border border-[var(--color-buy-border)] rounded-xl px-6 py-3 font-semibold transition-all"
          >
            증가 (+)
          </button>
        </div>

        {/* 설명 텍스트 */}
        <div className="mt-6 text-center text-sm text-[var(--color-text-sub)]">
          버튼을 클릭해서 숫자를 조작해보세요!
        </div>
      </div>
    </div>
  )
}
