import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// 각 테스트 후 자동으로 cleanup
afterEach(() => {
  cleanup();
});

// 환경 변수 설정
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:4000';
