/**
 * 클래스 이름을 병합하는 유틸 함수
 * 간단한 버전 (clsx와 tailwind-merge 없이)
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
