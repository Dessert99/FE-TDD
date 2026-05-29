import { describe, test, expect } from 'vitest';

/** 연관된 테스트 케이스들을 하나의 묶음으로 그룹화하는 역할을 한다 */
describe('환경 설정 점검', () => {
  /** 검증하고 싶은 동작 하나를 정의하는 최소 테스트 단위이다 */
  test('Vitest가 정상 동작한다', () => {
    /** 실제 값이 기대 값과 정확히 같은지(Object.is) 단언한다 */
    expect(1 + 1).toBe(2);
  });
});
