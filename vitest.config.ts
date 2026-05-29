import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // 파일에서 import 없이 test, expect 등 전역 API를 사용할 수 있게 한다
    globals: true,
    // 브라우저 DOM 대신 가벼운 jsdom 등이 필요할 때를 대비한 기본 노드 환경
    environment: 'node',
    // 테스트로 인식할 파일 패턴
    include: ['src/**/*.{test,spec}.{js,ts}'],
  },
})
