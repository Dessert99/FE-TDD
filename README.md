# 프론트엔드 TDD 학습을 위한 래포입니다.

> Vitest는 Vite 기반의 빠른 테스트 러너로, 프론트엔드의 회귀 위험을 자동화된 명세로 막아주는 도구이다.
> 

## 🔗 프론트엔드에서 TDD가 필요한 이유

1. 프론트엔드 코드는 사용자 입력, 비동기 응답, 외부 API, 브라우저 상태 같은 여러 변수가 얽혀 동작하기 때문에, 한 곳을 수정하면 예상치 못한 다른 곳이 깨지는 일이 자주 일어난다.
2. 그래서 기능을 바꿀 때마다 영향을 받는 부분을 직접 클릭으로 확인하게 되는데, 이렇게 수동으로 검증하면 시간이 오래 걸리고 검증 누락도 쉽게 생긴다.
3. 구체적인 예로, 처음에는 단순히 가격을 더하기만 하던 장바구니 합계 함수를 떠올려 보자.
    
    ```tsx
    // 처음에는 단순한 합계 함수였다
    function getTotal(items) {
      return items.reduce((sum, item) => sum + item.price, 0)
    }
    ```
    
4. 여기에 할인 로직을 추가했을 때, 기존의 "할인이 없을 때 가격을 그대로 더한다"는 동작이 깨지지 않았다는 것을 어떻게 확신할 수 있을지가 핵심 문제로 떠오른다.
5. TDD는 이 문제에 대한 답으로 등장한 방식인데, 구현보다 먼저 기대 동작을 테스트로 명세해 두고 그 테스트를 통과시키는 코드를 작성한 뒤 리팩터링하는 사이클을 반복한다.
    
    ```tsx
    // 1) 먼저 명세를 테스트로 작성한다
    test('할인이 없으면 단가의 합을 그대로 반환한다', () => {
      expect(getTotal([{ price: 1000 }, { price: 2000 }])).toBe(3000) // ✅
    })
    
    test('10% 할인이 적용되면 90%만 계산한다', () => {
      expect(getTotal([{ price: 1000 }], { discount: 0.1 })).toBe(900) // ✅
    })
    // 2) 이제 두 테스트를 통과시키는 구현을 작성한다
    ```
    
6. 이렇게 명세를 먼저 두면 함수의 의도가 테스트라는 형태로 코드에 남고, 이후 누군가 로직을 수정해도 기존 명세를 깨는 순간 즉시 실패로 드러난다.
7. 결과적으로 변경이 잦고 의존성이 많은 프론트엔드 도메인일수록 이 안전망의 효과가 크다.
8. 그중에서도 Vitest를 선택하는 실용적 이유는, Vite의 설정과 트랜스파일 파이프라인을 그대로 공유하므로 빌드 환경과 테스트 환경이 어긋나는 문제를 줄일 수 있다는 점이다.

## 🔗 테스트 구조 정의 메서드

1. 테스트 파일을 작성할 때 가장 먼저 결정해야 할 것은 "어떤 단위의 동작을, 어떤 묶음으로 검증할지"이고, 이 골격을 잡아주는 메서드들이 바로 테스트 구조 정의 메서드이다.
2. 그중 가장 자주 쓰이는 한 쌍은 개별 케이스를 선언하는 `test`(별칭 `it`)와, 관련 케이스들을 한 묶음으로 모아주는 `describe`이다.
3. 이 둘을 중심에 두고, 객체 형태의 정의까지 허용하는 저수준 API인 `suite`가 보조적으로 존재한다.

### test / it

1. 무엇인가
    1. `test`는 검증하고 싶은 동작 하나를 표현하는 단위로, 테스트 케이스 하나를 정의하는 함수이다.
    2. 같은 동작을 BDD 스타일 문장("it should ~")으로 표현하고 싶을 때를 위해, 동일한 구현을 가리키는 별칭 `it`이 함께 제공된다.
    3. 두 함수 모두 사용법은 같아서, 첫 인자로는 무엇을 검증하는지 알려주는 테스트 이름을, 두 번째 인자로는 실제 검증 로직이 담긴 콜백을 전달한다.
        
        ```tsx
        import { test, it, expect } from 'vitest'
        
        test('1 더하기 1은 2', () => {
          expect(1 + 1).toBe(2) // ✅
        })
        
        it('it도 동일하게 동작한다', () => {
          expect(true).toBe(true) // ✅
        })
        ```
        
2. 보통 어디에 쓰이나
    1. 기본 원칙은 "검증할 동작 하나당 `test` 하나"이며, 함수의 입출력처럼 결과가 명확한 단일 동작을 확인할 때 가장 자연스럽게 들어맞는다.
    2. 같은 패턴이 컴포넌트 단위로 확장되면, 특정 상호작용이 기대한 결과로 이어지는지 확인하는 데에도 그대로 적용된다.
        
        ```tsx
        test('formatNumber는 숫자에 천 단위 콤마를 붙인다', () => {
          expect(formatNumber(1000000)).toBe('1,000,000') // ✅
        })
        
        test('비동기 동작은 async 콜백으로 검증한다', async () => {
          const data = await fetchUser(1)
          expect(data.name).toBe('Alice') // ✅
        })
        ```
        
3. 특징/주의사항
    1. 콜백이 `Promise`를 반환하면 Vitest가 결과를 자동으로 `await` 해주므로, 비동기 검증은 단순히 `async` 콜백으로 작성하면 된다.
    2. 다만 작업이 길어져 기본 5초 타임아웃을 넘길 가능성이 있다면, 세 번째 인자로 직접 타임아웃(ms)이나 옵션 객체를 지정해 늘려줄 수 있다.
        
        ```tsx
        test('느린 작업', async () => {
          await heavyTask()
        }, 10_000) // 10초 타임아웃
        ```
        
    3. 테스트 이름은 실패 메시지에 그대로 노출되므로, "무엇을 검증하는지"가 한눈에 드러나는 서술형 문장으로 적는 편이 디버깅에 유리하다.

### describe

1. 무엇인가
    1. `describe`는 단일 케이스를 정의하는 `test`와 달리, 관련된 여러 테스트를 하나의 스위트로 묶는 그룹 단위 함수이다.
    2. 그룹 이름과 콜백을 인자로 받고, 콜백 안에서 `test`나 또 다른 `describe`를 선언해 테스트를 트리 구조로 구성한다.
        
        ```tsx
        import { describe, test, expect } from 'vitest'
        
        describe('formatNumber', () => {
          test('정수에 콤마를 붙인다', () => {
            expect(formatNumber(1000)).toBe('1,000') // ✅
          })
        
          test('0은 그대로 0이다', () => {
            expect(formatNumber(0)).toBe('0') // ✅
          })
        })
        ```
        
2. 보통 어디에 쓰이나
    1. 가장 흔한 패턴은 한 함수나 컴포넌트에 대한 여러 케이스를 그 대상 이름의 `describe`로 묶어, 무엇에 대한 테스트인지 한눈에 드러나게 만드는 것이다.
    2. 같은 대상이라도 조건에 따라 동작이 갈리는 경우에는, 조건별로 `describe`를 중첩해 시나리오를 시각적으로 분리한다.
        
        ```tsx
        describe('Button 컴포넌트', () => {
          describe('disabled가 true일 때', () => {
            test('클릭 핸들러가 호출되지 않는다', () => { /* ... */ })
          })
          describe('loading이 true일 때', () => {
            test('스피너가 표시된다', () => { /* ... */ })
          })
        })
        ```
        
3. 특징/주의사항
    1. `describe` 블록 자체는 그룹일 뿐 테스트가 아니므로, 안에 `test`가 하나도 없으면 실행되는 것 없이 그대로 지나간다.
    2. 라이프사이클 훅(`beforeEach` 등)을 `describe` 안에 두면 적용 범위가 해당 스위트로 한정되므로, 일부 케이스에만 필요한 셋업을 자연스럽게 격리할 수 있다.
    3. 실행 결과는 "그룹명 > 테스트명" 형태로 표시되기 때문에, 그룹 이름은 보통 대상의 함수명이나 컴포넌트명을 그대로 적는 것이 관례이다.

## 🔗 라이프사이클 훅 메서드

1. 라이프사이클 훅은 테스트 실행 전후에 자동으로 호출되는 콜백을 등록하는 메서드들이다.
2. 반복되는 셋업·정리 코드를 한곳에 모아 테스트마다 중복하지 않도록 해준다.
3. 훅이 적용되는 범위는 호출 위치에 따라 달라지며, 파일 최상위에 두면 파일 전체에, `describe` 내부에 두면 해당 스위트에만 적용된다.
4. 주요 메서드는 매 테스트 전후의 `beforeEach`/`afterEach`와, 묶음 전후의 `beforeAll`/`afterAll`이다.

### beforeEach

1. 무엇인가
    1. `beforeEach`는 현재 컨텍스트의 각 테스트가 실행되기 직전에 호출되는 콜백을 등록하는 함수이다.
    2. 콜백이 `Promise`를 반환하면 Vitest는 그 결과를 기다린 뒤 테스트를 시작한다.
        
        ```tsx
        import { beforeEach, test, expect } from 'vitest'
        
        let user
        beforeEach(() => {
          user = { name: 'Alice', age: 30 } // 매 테스트 직전 새 객체로 초기화
        })
        
        test('이름은 Alice이다', () => {
          expect(user.name).toBe('Alice') // ✅ beforeEach가 매번 user를 초기화
        })
        test('나이는 30이다', () => {
          expect(user.age).toBe(30) // ✅
        })
        ```
        
2. 보통 어디에 쓰이나
    1. 각 테스트가 동일한 초기 상태에서 시작하도록 데이터를 매번 새로 만들 때 사용한다.
    2. 모킹 초기화, 타이머 셋업, 임시 DOM 생성처럼 테스트 사이에 격리가 필요한 작업에 적합하다.
        
        ```tsx
        import { beforeEach, vi } from 'vitest'
        
        beforeEach(() => {
          vi.useFakeTimers() // 매 테스트 전에 가짜 타이머 셋업
        })
        ```
        
3. 특징/주의사항
    1. 콜백이 함수를 반환하면 Vitest는 그 함수를 정리 단계에서 자동으로 호출하므로 `afterEach`를 따로 적지 않아도 된다.
        
        ```tsx
        beforeEach(() => {
          const server = startFakeServer()
          return () => server.close() // afterEach 효과
        })
        ```
        
    2. 두 번째 인자로 타임아웃(ms)을 지정할 수 있고, 기본값은 5초이다.
    3. 외부 변수에 값을 담아 공유하는 패턴은 가능하지만, 콜백 안에서 매번 새 객체를 만드는 편이 테스트 간 누수를 줄인다.

### afterEach

1. 무엇인가
    1. `afterEach`는 현재 컨텍스트의 각 테스트가 끝난 직후에 호출되는 콜백을 등록하는 함수이다.
    2. 테스트가 실패해도 동일하게 실행되므로, 자원 정리에 안전하게 쓸 수 있다.
        
        ```tsx
        import { afterEach } from 'vitest'
        
        afterEach(() => {
          console.log('test 끝') // 매 테스트 직후 호출
        })
        ```
        
2. 보통 어디에 쓰이나
    1. 테스트가 만든 임시 데이터, DOM, 모킹 상태 등을 원복할 때 사용한다.
    2. 다음 테스트가 이전 상태에 영향받지 않게 하는 작업에 적합하다.
        
        ```tsx
        import { afterEach, vi } from 'vitest'
        
        afterEach(() => {
          vi.clearAllMocks() // 모든 mock 호출 기록 제거
          vi.useRealTimers() // 실제 타이머로 복귀
        })
        ```
        
3. 특징/주의사항
    1. 같은 컨텍스트에 여러 개를 등록하면 기본적으로 등록 역순으로 실행되며, 설정에서 `sequence.hooks`로 변경할 수 있다.
    2. 두 번째 인자로 타임아웃(ms)을 지정할 수 있고, 기본값은 5초이다.

### beforeAll

1. 무엇인가
    1. `beforeAll`은 현재 컨텍스트의 모든 테스트가 실행되기 전에 단 한 번 호출되는 콜백을 등록하는 함수이다.
    2. 파일 최상위에 두면 파일당 한 번, `describe` 내부에 두면 해당 스위트가 시작할 때 한 번 실행된다.
        
        ```tsx
        import { beforeAll } from 'vitest'
        
        let db
        beforeAll(async () => {
          db = await connectToTestDb() // 파일 시작 시 한 번만 연결
        })
        ```
        
2. 보통 어디에 쓰이나
    1. DB 연결, 서버 기동, 큰 파일 로드처럼 비용이 크면서 모든 테스트가 공유해도 안전한 셋업에 사용한다.
    2. 한 번 초기화한 외부 의존성을 여러 테스트에서 재사용할 때 적합하다.
        
        ```tsx
        import { beforeAll } from 'vitest'
        
        beforeAll(async () => {
          await startMockServer() // 모든 테스트가 같은 가짜 서버를 사용
        })
        ```
        
3. 특징/주의사항
    1. `beforeEach`와 마찬가지로 콜백이 함수를 반환하면 그 함수가 `afterAll`처럼 정리 단계에서 호출된다.
        
        ```tsx
        beforeAll(async () => {
          const server = await startServer()
          return () => server.stop() // afterAll 대신 사용 가능
        })
        ```
        
    2. 테스트끼리 상태가 공유되므로, 한 테스트의 부작용이 다음 테스트에 영향을 줄 수 있다는 점에 주의해야 한다.
    3. 기본 타임아웃은 5초이며, 두 번째 인자로 변경할 수 있다.

### afterAll

1. 무엇인가
    1. `afterAll`은 현재 컨텍스트의 모든 테스트가 끝난 뒤에 단 한 번 호출되는 콜백을 등록하는 함수이다.
    2. `beforeAll`로 만든 자원을 정리하는 짝으로 자주 함께 쓰인다.
        
        ```tsx
        import { afterAll } from 'vitest'
        
        afterAll(async () => {
          await db.disconnect() // 모든 테스트가 끝난 뒤 연결 종료
        })
        ```
        
2. 보통 어디에 쓰이나
    1. DB 연결 종료, 서버 셧다운, 임시 파일 삭제처럼 파일 단위의 정리 작업에 사용한다.
    2. 전역 모킹 해제나 환경 변수 원복에도 활용한다.
        
        ```tsx
        import { afterAll, vi } from 'vitest'
        
        afterAll(() => {
          vi.restoreAllMocks() // spy로 가로챈 원본 구현 모두 복원
        })
        ```
        
3. 특징/주의사항
    1. 테스트 중 일부가 실패해도 `afterAll`은 호출되므로 자원 해제 누락이 발생하지 않는다.
    2. 기본 타임아웃은 5초이며, 두 번째 인자로 변경할 수 있다.

### 훅 실행 순서

1. 무엇인가
    1. 여러 훅이 중첩되어 등록되면, 바깥 훅이 안쪽 훅을 감싸는 구조로 실행된다.
    2. 공식 문서의 예시로 흐름을 확인하면 다음과 같다.
        
        ```tsx
        beforeAll(() => console.log('1 - beforeAll'))
        afterAll(() => console.log('8 - afterAll'))
        beforeEach(() => console.log('2 - beforeEach'))
        afterEach(() => console.log('5 - afterEach'))
        
        describe('suite', () => {
          beforeEach(() => console.log('3 - inner beforeEach'))
          afterEach(() => console.log('4 - inner afterEach'))
        
          test('first test', () => { /* ... */ })
          test('second test', () => { /* ... */ })
        })
        // 출력:
        // 1 - beforeAll
        // 2 - beforeEach → 3 - inner beforeEach → first test
        // 4 - inner afterEach → 5 - afterEach
        // 2 - beforeEach → 3 - inner beforeEach → second test
        // 4 - inner afterEach → 5 - afterEach
        // 8 - afterAll
        ```
        
2. 보통 어디에 쓰이나
    1. 공통 셋업은 파일 최상위에 두고, 특정 그룹에만 필요한 셋업은 해당 `describe` 안에 두어 계층을 활용한다.
    2. 비용이 큰 셋업은 `beforeAll`로, 테스트 간 격리가 필요한 셋업은 `beforeEach`로 두어 성능과 안정성을 함께 챙긴다.
3. 특징/주의사항
    1. `beforeAll`/`afterAll`은 스위트 시작·종료 시 한 번씩, `beforeEach`/`afterEach`는 매 테스트마다 호출된다.
    2. 같은 컨텍스트에 같은 종류의 훅을 여러 번 등록할 수 있고, 기본적으로 `before*`는 등록 순서대로, `after*`는 역순으로 실행된다.

## 어설션 메서드1)  : `expect`와 동등 비교

1. 테스트는 구조(`test`, `describe`)와 셋업(훅)만으로는 완성되지 않으며, 그 안에서 "결과가 맞는지"를 실제로 판정해 줄 도구가 필요하다.
2. 그 판정을 담당하는 것이 어설션이고, Vitest에서 모든 어설션은 `expect` 함수에서 시작한다.
3. `expect`는 검사하고 싶은 값을 받아 매처(matcher)라는 검사 메서드를 호출할 수 있는 객체를 돌려준다.
4. 매처는 "어떤 기준으로 검사할 것인가"에 따라 `toBe`, `toEqual`, `toContain` 등 종류가 많으므로, 의도에 맞춰 골라 쓰는 방식이 된다.
5. 그 수가 많기 때문에 동등 비교, 진리값/숫자/문자열, 배열/객체, 함수 호출, 예외, 비동기 식으로 묶어 정리하며, 이번 묶음은 그 출발점인 `expect` 자체와 "두 값이 같은가"를 다루는 동등 비교 매처들이다.

### expect

1. 무엇인가
    1. `expect`는 검사하고 싶은 값을 인자로 받아, 매처를 체이닝할 수 있는 어설션 객체를 반환하는 함수이다.
    2. 어설션은 `expect(실제값).매처(기대값)` 형태로 작성하며, 매처가 실패로 판정하면 그 즉시 테스트가 실패로 마킹된다.
    3. 모든 매처는 `.not`으로 한 번 뒤집을 수 있어, 같은 매처를 부정 조건에도 그대로 활용할 수 있다.
        
        ```tsx
        import { expect, test } from 'vitest'
        
        test('expect의 기본 사용', () => {
          expect(1 + 1).toBe(2)     // ✅ 1+1은 2다
          expect(1 + 1).not.toBe(3) // ✅ 3이 아닌 것은 맞다
        })
        ```
        
2. 보통 어디에 쓰이나
    1. `test` 콜백 안에서 함수의 반환값, 컴포넌트 상태, 모킹된 함수의 호출 기록 등 모든 검증의 진입점으로 사용한다.
    2. 한 테스트에 여러 개의 `expect`를 두는 것도 가능하며, 보통 "한 단위 동작이 만족해야 할 조건들"을 함께 묶어서 표현한다.
        
        ```tsx
        test('회원가입 결과 객체 검증', () => {
          const user = signUp({ name: 'Alice', age: 30 })
          expect(user.id).toBeDefined()               // ✅ id가 부여되어 있다
          expect(user.name).toBe('Alice')             // ✅ 입력한 이름이 그대로 들어갔다
          expect(user.createdAt).toBeInstanceOf(Date) // ✅ 생성 시각은 Date 인스턴스다
        })
        ```
        
3. 특징/주의사항
    1. Vitest는 내부적으로 Chai를 사용하지만 표면적으로는 Jest 호환 API를 제공하므로, `toBe`/`toEqual` 같은 익숙한 이름을 그대로 쓰면 된다.
    2. `resolves`/`rejects`로 `Promise`를 풀어서 검증할 수 있는데, 이때 `await`을 빠뜨리면 어설션이 실제로 평가되지 않을 수 있으므로 반드시 `await`을 붙여야 한다.
        
        ```tsx
        // ❌ await 누락 → 어설션이 실제로 평가되지 않을 수 있다
        // expect(fetchUser()).resolves.toEqual({ id: 1 })
        
        // ✅ 올바른 사용
        await expect(fetchUser()).resolves.toEqual({ id: 1 })
        ```
        
    3. `expect.soft`를 쓰면 실패가 발생해도 즉시 테스트를 멈추지 않고, 같은 테스트 안의 어설션을 끝까지 모두 평가한 뒤 실패로 표시한다.

### toBe

1. 무엇인가
    1. `toBe`는 두 값이 같은지를 `Object.is` 기준으로 판정하는 가장 기본 동등 비교 매처이다.
    2. `Object.is`는 `===`와 거의 같지만 `NaN === NaN`을 `true`로 보고, `+0`과 `-0`은 다르다고 보는 점에서 미세하게 다르다.
    3. 따라서 원시값(`number`, `string`, `boolean` 등)의 동일성을 비교하거나, 객체·배열이라면 동일한 "참조"인지 확인할 때 쓴다.
        
        ```tsx
        test('원시값과 참조 동등성', () => {
          expect(2 + 2).toBe(4)             // ✅ number, 값이 같음
          expect('hello').toBe('hello')     // ✅ string, 값이 같음
        
          const obj = { id: 1 }
          expect(obj).toBe(obj)             // ✅ 동일한 참조
          expect(obj).toBe({ id: 1 })       // ❌ 내용은 같지만 새 객체 → 참조 다름
          expect({ id: 1 }).toBe({ id: 1 }) // ❌ 둘 다 새 객체 리터럴 → 다른 참조
        })
        ```
        
2. 보통 어디에 쓰이나
    1. 함수가 반환한 원시값이 기대값과 정확히 같은지 확인하는 가장 일반적인 검증에 쓴다.
    2. 캐시·싱글턴처럼 "동일한 인스턴스"를 그대로 반환하는지 검증할 때도 자연스럽게 들어맞는다.
        
        ```tsx
        test('getInstance는 항상 같은 인스턴스를 반환한다', () => {
          const a = getInstance()
          const b = getInstance()
          expect(a).toBe(b) // ✅ 캐시된 동일 인스턴스
        })
        
        test('new로 매번 생성하는 객체는 toBe로 비교하면 안 된다', () => {
          expect(new User('Alice')).toBe(new User('Alice')) // ❌ 매번 새 인스턴스 → 참조 다름
        })
        ```
        
3. 특징/주의사항
    1. 객체나 배열의 "내용"이 같은지 비교하려면 `toBe`가 아니라 `toEqual`을 써야 한다.
    2. `NaN`은 `===`로는 항상 `false`지만 `toBe(NaN)`은 통과하도록 처리되어 있어, 안전하게 비교할 수 있다.
        
        ```tsx
        expect(NaN).toBe(NaN)          // ✅ Object.is 기반이라 통과
        expect(0).toBe(-0)             // ❌ Object.is는 +0과 -0을 다르게 본다
        ```
        

### toEqual

1. 무엇인가
    1. `toEqual`은 객체나 배열의 "구조적 동등성"을 깊은 비교로 판정하는 매처이다.
    2. 즉 참조가 달라도 내부 프로퍼티의 값이 재귀적으로 모두 같으면 통과한다.
    3. 다만 값이 `undefined`인 프로퍼티는 비교에서 무시한다는 점이 동작상의 특징이다.
        
        ```tsx
        test('객체의 깊은 비교', () => {
          const a = { id: 1, profile: { name: 'Alice' } }
          const b = { id: 1, profile: { name: 'Alice' } }
        
          expect(a).toEqual(b) // ✅ 참조는 다르지만 내용이 같음
          expect(a).toBe(b)    // ❌ 참조가 다름
        })
        
        test('undefined 프로퍼티는 무시한다', () => {
          expect({ a: 1 }).toEqual({ a: 1, b: undefined }) // ✅ undefined 키는 비교에서 제외
        })
        ```
        
2. 보통 어디에 쓰이나
    1. 함수가 새 객체를 생성해 반환할 때, 결과가 기대한 형태와 같은지 확인하는 대부분의 상황에서 사용한다.
    2. 배열 결과의 내용이 같은지 검사할 때도 `toEqual`이 기본 선택이다.
        
        ```tsx
        test('parseQuery는 URL 쿼리를 객체로 변환한다', () => {
          expect(parseQuery('?a=1&b=2')).toEqual({ a: '1', b: '2' }) // ✅
        })
        
        test('정렬 결과 비교', () => {
          expect(sort([3, 1, 2])).toEqual([1, 2, 3]) // ✅
        })
        ```
        
3. 특징/주의사항
    1. `undefined` 프로퍼티를 무시하는 동작 때문에, "이 키가 정말로 없는가"를 엄격하게 검증하고 싶다면 `toStrictEqual`을 써야 한다.
    2. 클래스 인스턴스끼리 비교할 때도 `toEqual`은 클래스 종류를 따지지 않으므로, 그 부분이 중요하다면 마찬가지로 `toStrictEqual`이 필요하다.

### toStrictEqual

1. 무엇인가
    1. `toStrictEqual`은 `toEqual`보다 더 엄격한 깊은 비교를 수행하는 매처이다.
    2. `toEqual`이 느슨하게 넘기던 `undefined` 프로퍼티의 존재 여부와, 객체의 타입(클래스)까지 비교 대상에 포함시킨다.
        
        ```tsx
        test('toEqual과 toStrictEqual의 차이', () => {
          expect({ a: 1 }).toEqual({ a: 1, b: undefined })       // ✅ undefined 키 무시
          expect({ a: 1 }).toStrictEqual({ a: 1, b: undefined }) // ❌ 엄격 비교는 키 존재까지 본다
        })
        
        class User {
          constructor(public name: string) {}
        }
        test('클래스 타입까지 본다', () => {
          const u1 = new User('Alice')
          const u2 = { name: 'Alice' }
          expect(u1).toEqual(u2)       // ✅ 구조만 보면 같음
          expect(u1).toStrictEqual(u2) // ❌ User 인스턴스 vs 일반 객체 → 타입이 다름
        })
        ```
        
2. 보통 어디에 쓰이나
    1. 도메인 모델 클래스의 인스턴스를 검증할 때, "POJO가 아니라 정말 `User` 인스턴스인가"까지 확인하고 싶을 때 사용한다.
    2. API 응답에서 누락된 필드와 명시적인 `undefined` 필드를 구분해야 하는 등, 키의 존재 여부 자체가 의미를 갖는 경우에 적합하다.
        
        ```tsx
        test('User 인스턴스로 잘 변환되는가', () => {
          const result = fromJson({ name: 'Alice' })
          expect(result).toStrictEqual(new User('Alice')) // ✅ 동일 구조 + User 타입
        })
        ```
        
3. 특징/주의사항
    1. 엄격한 만큼 사소한 타입 차이로도 실패할 수 있으므로, "구조만 맞으면 된다"는 검증에는 `toEqual`로 충분하다.
    2. 따라서 `toBe` → 참조·원시값, `toEqual` → 구조, `toStrictEqual` → 타입까지 라는 점점 강한 비교 순서로 외워두면 선택이 쉬워진다.

## 어설션 메서드2) 진리값·숫자·문자열

1. 동등 비교가 "두 값이 같은가"를 다뤘다면, 그다음으로 자주 쓰이는 검증은 "값이 어떤 성질을 가지는가"이다.
2. 예를 들어 "참인가 거짓인가", "`null`인가", "특정 숫자보다 큰가", "어떤 문자열 패턴을 포함하는가" 같은 검사가 여기에 해당한다.
3. 이런 검사들을 다루는 매처는 크게 진리값·존재 여부, 숫자 비교, 문자열 검사로 묶을 수 있다.
4. 매처 수는 많지만 사용법은 모두 `expect(값).매처(...)` 형태로 일관되며, `.not`을 붙여 반대 조건도 그대로 표현할 수 있다.

### toBeTruthy / toBeFalsy

1. 무엇인가
    1. `toBeTruthy`는 값이 JavaScript의 truthy 규칙으로 평가했을 때 참이 되는지를 검사하는 매처이다.
    2. 반대로 `toBeFalsy`는 falsy로 평가되는 값(즉 `false`, `0`, `''`, `null`, `undefined`, `NaN`)인지를 검사한다.
    3. 두 매처 모두 값의 정확한 타입까지는 따지지 않으므로, "어떤 형태로든 결과가 있다·없다"를 단순하게 표현할 때 쓴다.
        
        ```tsx
        test('truthy / falsy 판정', () => {
          expect(1).toBeTruthy()    // ✅ 0이 아닌 숫자는 truthy
          expect('hi').toBeTruthy() // ✅ 빈 문자열이 아니면 truthy
          expect([]).toBeTruthy()   // ✅ 빈 배열도 객체라서 truthy
          expect(0).toBeTruthy()    // ❌ 0은 falsy
        
          expect(0).toBeFalsy()         // ✅
          expect('').toBeFalsy()        // ✅
          expect(null).toBeFalsy()      // ✅
          expect(undefined).toBeFalsy() // ✅
          expect(NaN).toBeFalsy()       // ✅
        })
        ```
        
2. 보통 어디에 쓰이나
    1. 함수가 "어떤 종류든 결과를 만들어 냈는가" 정도로 결과의 유무만 확인하고 싶을 때 사용한다.
    2. 폼 유효성 검사, 권한 체크처럼 결과가 결국 boolean으로 압축되는 케이스에 자연스럽게 들어맞는다.
        
        ```tsx
        test('비어 있지 않은 검색 결과를 받았는지', () => {
          const result = search('vitest')
          expect(result).toBeTruthy() // ✅ null/undefined가 아니면 통과
        })
        
        test('비밀번호가 비어 있으면 검증 실패한다', () => {
          expect(isValidPassword('')).toBeFalsy() // ✅ 빈 문자열은 false 반환
        })
        ```
        
3. 특징/주의사항
    1. truthy/falsy는 타입을 모호하게 다루기 때문에, "정말로 `null`인가" 또는 "정말로 `false`인가"를 정확히 보고 싶다면 `toBeNull`/`toBe(false)`가 더 안전하다.
    2. `[]`, `{}`처럼 빈 컬렉션이 truthy로 판정되는 점은 헷갈리기 쉬우므로, 이런 경우에는 `toHaveLength(0)` 같은 명시적 매처가 의도를 더 잘 드러낸다.

### toBeNull / toBeUndefined / toBeDefined

1. 무엇인가
    1. 세 매처는 "값이 비어 있는가, 명시적으로 비어 있는가, 어쨌든 값이 있는가"를 구분해서 검사한다.
    2. `toBeNull`은 값이 정확히 `null`인지를, `toBeUndefined`는 정확히 `undefined`인지를 본다.
    3. `toBeDefined`는 그 반대로, 값이 `undefined`가 아닌지만 확인한다.
        
        ```tsx
        test('null / undefined / defined 구분', () => {
          expect(null).toBeNull()           // ✅
          expect(undefined).toBeNull()      // ❌ null과 undefined는 다른 값
        
          expect(undefined).toBeUndefined() // ✅
          expect(null).toBeUndefined()      // ❌
        
          expect(0).toBeDefined()           // ✅ 0도 정의된 값
          expect(undefined).toBeDefined()   // ❌
        })
        ```
        
2. 보통 어디에 쓰이나
    1. 함수가 의도적으로 "값이 없음"을 `null`로 표현하는 경우, 그 결과를 `toBeNull`로 검증한다.
    2. 옵셔널 인자가 생략됐을 때 `undefined`가 반환되는지, 반대로 어떤 값이든 반드시 채워지는지(`toBeDefined`)를 확인할 때 사용한다.
        
        ```tsx
        test('찾는 사용자가 없으면 null을 반환한다', () => {
          expect(findUser('unknown')).toBeNull() // ✅
        })
        
        test('회원가입 결과에는 id가 반드시 부여된다', () => {
          const user = signUp({ name: 'Alice' })
          expect(user.id).toBeDefined() // ✅ id가 빠지지 않음
        })
        ```
        
3. 특징/주의사항
    1. `toBeDefined`는 "`undefined`가 아니다"만 검사하므로 `null`도 통과시킨다. "값이 진짜로 있는가"를 보고 싶다면 `null`까지 함께 배제해야 한다.
    2. 팀 내에서 "비어 있음을 `null`로만 표현한다"처럼 규약을 통일해 두면, 어떤 매처를 쓸지 자연스럽게 결정된다.

### toBeNaN

1. 무엇인가
    1. `toBeNaN`은 값이 `NaN`인지를 검사하는 매처이다.
    2. JavaScript에서 `NaN === NaN`이 `false`이기 때문에 `===`나 `toBe`만으로는 깔끔하게 판정하기 어려운데, 이 매처가 그 불편함을 해결해 준다.
        
        ```tsx
        test('NaN 검증', () => {
          expect(Number('abc')).toBeNaN() // ✅ 숫자 변환 실패 → NaN
          expect(0 / 0).toBeNaN()         // ✅ 0/0은 NaN
          expect(1).toBeNaN()             // ❌ 1은 NaN이 아님
        })
        ```
        
2. 보통 어디에 쓰이나
    1. 숫자 변환·연산 함수에서 "잘못된 입력에 대해 `NaN`을 반환하는지" 확인할 때 사용한다.
    2. `parseInt`, `parseFloat`, `Number(...)` 같은 변환 결과를 검증하는 테스트에 자주 등장한다.
        
        ```tsx
        test('숫자 변환의 경계 케이스', () => {
          expect(Number('')).toBe(0)      // ✅ 흔히 헷갈리는 케이스: 빈 문자열은 0
          expect(Number('abc')).toBeNaN() // ✅ 진짜 변환 실패 시에는 NaN
        })
        ```
        
3. 특징/주의사항
    1. 앞서 본 `toBe(NaN)`도 통과하도록 처리되어 있지만, "`NaN`을 확인한다"는 의도가 한눈에 드러나는 `toBeNaN`을 쓰는 편이 가독성에 좋다.

### toBeGreaterThan / toBeGreaterThanOrEqual / toBeLessThan / toBeLessThanOrEqual

1. 무엇인가
    1. 네 매처는 숫자의 부등호 비교를 직접 표현하기 위한 매처들이다.
    2. 이름 그대로 `Greater`/`Less`는 엄격한 부등호(`>`, `<`)에, `OrEqual`이 붙은 변형은 같은 값까지 포함하는 부등호(`>=`, `<=`)에 대응한다.
        
        ```tsx
        test('숫자 부등호 비교', () => {
          expect(10).toBeGreaterThan(5)       // ✅ 10 > 5
          expect(5).toBeGreaterThan(5)        // ❌ 엄격한 부등호는 같은 값을 거절
          expect(5).toBeGreaterThanOrEqual(5) // ✅ 같은 값 허용
        
          expect(1).toBeLessThan(2)           // ✅
          expect(2).toBeLessThanOrEqual(2)    // ✅
          expect(3).toBeLessThanOrEqual(2)    // ❌
        })
        ```
        
2. 보통 어디에 쓰이나
    1. 카운트, 통계, 성능 측정처럼 정확한 값보다 범위로 검증해야 하는 경우에 사용한다.
    2. 응답 시간, 길이, 개수가 임계값을 넘지 않아야 하는 정책 검증에도 적합하다.
        
        ```tsx
        test('API 응답 시간이 200ms 이하여야 한다', async () => {
          const t = await measureResponseTime()
          expect(t).toBeLessThanOrEqual(200) // ✅ 정책 만족
        })
        
        test('검색 결과가 최소 1건 이상이어야 한다', () => {
          const result = search('vitest')
          expect(result.length).toBeGreaterThan(0) // ✅
        })
        ```
        
3. 특징/주의사항
    1. 비교 대상은 숫자형이어야 하며 `BigInt`도 지원된다. 비교 불가능한 타입이 섞이면 의도치 않게 실패할 수 있다.
    2. 부동소수점 결과를 부등호로 비교하면 미세한 오차로 결과가 흔들릴 수 있어, "근사값" 비교에는 `toBeCloseTo`를 함께 고려해야 한다.

### toBeCloseTo

1. 무엇인가
    1. `toBeCloseTo`는 두 부동소수점 수가 정해진 자릿수만큼 가까운지를 검사하는 매처이다.
    2. 두 번째 인자 `numDigits`(기본값 2)는 소수점 자릿수를 의미하며, 두 값의 차이가 `10^-numDigits / 2` 미만이면 통과한다.
        
        ```tsx
        test('부동소수점은 toBeCloseTo로 비교', () => {
          expect(0.1 + 0.2).toBe(0.3)            // ❌ 실제 값은 0.30000000000000004
          expect(0.1 + 0.2).toBeCloseTo(0.3)     // ✅ 기본 2자리까지 일치
          expect(0.1 + 0.2).toBeCloseTo(0.3, 5)  // ✅ 5자리까지도 충분히 가까움
          expect(0.1 + 0.2).toBeCloseTo(0.3, 20) // ❌ 자릿수를 너무 엄격하게 잡으면 실패
        })
        ```
        
2. 보통 어디에 쓰이나
    1. 통화 계산, 좌표·각도, 비율 계산처럼 부동소수점이 끼는 모든 수치 검증에 사용한다.
    2. `Math` 함수의 출력처럼 본질적으로 근사값을 다루는 계산을 비교할 때 적합하다.
        
        ```tsx
        test('할인 금액 계산은 근사값으로 검증', () => {
          expect(applyDiscount(1000, 0.1)).toBeCloseTo(900) // ✅ 부동소수점 오차 허용
        })
        ```
        
3. 특징/주의사항
    1. `toEqual`이나 `toBe`로 부동소수점을 비교하면 미세 오차로 실패하는 일이 잦으므로, "소수점이 끼는 순간 `toBeCloseTo`"를 기본 옵션으로 두면 좋다.
    2. 의도와 다르게 너무 엄격한 자릿수를 지정하면 통과하던 테스트도 깨질 수 있어, 도메인이 요구하는 정확도 수준에 맞춰 자릿수를 정하는 것이 중요하다.

### toMatch

1. 무엇인가
    1. `toMatch`는 문자열이 특정 패턴과 일치하는지를 검사하는 매처이다.
    2. 인자로 정규식이나 부분 문자열을 받으며, 검사 대상은 반드시 문자열이어야 한다.
        
        ```tsx
        test('문자열 패턴 매칭', () => {
          expect('vitest is fast').toMatch('fast')  // ✅ 부분 문자열 포함
          expect('vitest is fast').toMatch(/v\w+/)  // ✅ 정규식 매칭
          expect('vitest is fast').toMatch(/^fast/) // ❌ 'fast'로 시작하지 않음
        })
        ```
        
2. 보통 어디에 쓰이나
    1. 로그, 에러 메시지, 응답 본문에서 특정 키워드나 패턴이 포함되어 있는지 확인할 때 사용한다.
    2. 전체 문자열이 매번 조금씩 달라지는 경우(타임스탬프·ID 등), 가변 부분은 무시하고 핵심 부분만 검증할 때도 유용하다.
        
        ```tsx
        test('에러 메시지에 사용자 ID가 들어 있어야 한다', () => {
          const msg = formatError({ id: 'u_42' })
          expect(msg).toMatch(/u_42/) // ✅ 메시지의 어느 위치에 있든 ID가 포함되면 OK
        })
        ```
        
3. 특징/주의사항
    1. 검사 대상이 문자열이 아니라 객체 안의 필드라면 해당 필드를 꺼내서 넘기거나, 객체 단위로 비교한다면 `toMatchObject`(다음 묶음에서 다룸)를 고려한다.
    2. 부분 문자열을 그대로 넘기면 "포함되어 있다"는 의미가 되지만, 시작·끝 위치를 정확히 지정하려면 정규식을 쓰는 편이 의도가 분명하다.

### toContain

1. 무엇인가
    1. `toContain`은 문자열·배열·이터러블에 특정 값이 포함되어 있는지를 검사하는 매처이다.
    2. 문자열 대상에서는 부분 문자열의 포함 여부를, 배열 대상에서는 `Object.is` 기반 동등성으로 특정 원소가 들어 있는지를 본다.
        
        ```tsx
        test('문자열에 toContain 적용', () => {
          expect('vitest is fast').toContain('fast') // ✅ 부분 문자열 포함
          expect('vitest is fast').toContain('slow') // ❌ 포함되지 않음
        })
        
        test('배열에 toContain 적용', () => {
          expect([1, 2, 3]).toContain(2)           // ✅
          expect([{ id: 1 }]).toContain({ id: 1 }) // ❌ 참조 비교라 새 객체는 실패
        })
        ```
        
2. 보통 어디에 쓰이나
    1. 응답 메시지나 페이지 텍스트에 특정 키워드가 있는지 확인할 때 사용한다.
    2. 원시값 배열에서 특정 원소가 존재하는지 빠르게 검증할 때도 자연스럽게 쓰인다.
        
        ```tsx
        test('사용자 권한 목록에 admin이 포함되어야 한다', () => {
          expect(getRoles(user)).toContain('admin') // ✅
        })
        ```
        
3. 특징/주의사항
    1. 객체나 배열을 깊은 비교로 포함 여부를 확인하고 싶다면 `toContain` 대신 `toContainEqual`을 써야 하며, 이는 다음 묶음(배열·객체 매처)에서 다룬다.
    2. `toContain`은 문자열·배열·이터러블에 두루 쓰이지만, "패턴" 일치 의도라면 `toMatch`가 더 명확하게 읽힌다.

## 어설션 메서드3) 배열·객체

1. 앞 두 묶음에서 다룬 매처는 주로 단일 값이나 패턴에 집중했는데, 실제 프론트엔드 테스트에서는 객체나 배열을 부분적으로 검증해야 하는 일이 훨씬 많다.
2. 예를 들어 "API 응답에서 핵심 필드 몇 개만 맞으면 된다", "배열에 특정 형태의 객체가 들어 있어야 한다" 같은 상황이다.
3. 이를 직접 풀어쓰면 매번 분해해서 검증해야 해서 코드가 길어지는데, Vitest는 이런 패턴을 깔끔하게 표현하는 매처들과 비대칭 매처를 함께 제공한다.
4. 이번 묶음에서는 길이·포함·프로퍼티 존재 같은 기본 구조 매처와, `toEqual`·`toMatchObject`와 조합해서 쓰는 비대칭 매처를 같이 정리한다.

### toHaveLength

1. 무엇인가
    1. `toHaveLength`는 값의 `length` 속성이 기대한 숫자와 같은지 검사하는 매처이다.
    2. 배열뿐 아니라 문자열, `arguments` 객체, 일부 유사 배열처럼 `length`를 가진 모든 값에 쓸 수 있다.
        
        ```tsx
        test('toHaveLength로 길이 검증', () => {
          expect([1, 2, 3]).toHaveLength(3) // ✅
          expect('vitest').toHaveLength(6)  // ✅
          expect([]).toHaveLength(0)        // ✅ 빈 배열
          expect('hi').toHaveLength(3)      // ❌ 실제 길이는 2
        })
        ```
        
2. 보통 어디에 쓰이나
    1. 검색 결과 개수, 폼 에러 개수, 페이지네이션 결과처럼 "몇 건인지"를 검증할 때 가장 자주 쓰인다.
    2. `expect(arr.length).toBe(n)` 패턴 대신 사용해 의도가 더 분명하게 읽히는 코드를 만들 수 있다.
        
        ```tsx
        test('검색은 최대 10건만 반환한다', () => {
          const result = search('vitest', { limit: 10 })
          expect(result).toHaveLength(10) // ✅
        })
        ```
        
3. 특징/주의사항
    1. `Map`·`Set`처럼 `length` 대신 `size`를 가진 자료구조에는 쓸 수 없으므로, 이때는 `expect(set.size).toBe(n)`로 풀어 써야 한다.
    2. "비어 있다"는 검증에서는 `toBeFalsy()`나 `toEqual([])`보다 `toHaveLength(0)`이 의도를 가장 분명하게 드러낸다.

### toContainEqual

1. 무엇인가
    1. `toContainEqual`은 배열 안에 "구조적으로 동등한" 원소가 들어 있는지를 검사하는 매처이다.
    2. 즉 `toContain`이 참조 비교라면, `toContainEqual`은 `toEqual`과 같은 깊은 비교를 사용한다.
        
        ```tsx
        test('객체 배열에 특정 객체가 포함되어 있는지', () => {
          const users = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]
        
          expect(users).toContainEqual({ id: 1, name: 'Alice' }) // ✅ 구조가 같은 원소 존재
          expect(users).toContain({ id: 1, name: 'Alice' })      // ❌ 같은 참조가 아니므로 실패
          expect(users).toContainEqual({ id: 99, name: 'Eve' })  // ❌ 그런 원소 없음
        })
        ```
        
2. 보통 어디에 쓰이나
    1. API 응답 배열이나 컴포넌트가 렌더한 항목 목록에서 "이런 모양의 데이터가 있어야 한다"를 검증할 때 사용한다.
    2. 정확한 순서까지 검증할 필요가 없는 케이스에 잘 어울린다.
        
        ```tsx
        test('알림 목록에 새 댓글 알림이 포함되어야 한다', () => {
          const list = getNotifications()
          expect(list).toContainEqual({ type: 'comment', read: false }) // ✅
        })
        ```
        
3. 특징/주의사항
    1. 원소 전체가 정확히 일치해야 하므로, "일부 필드만 맞아도 된다"는 의도라면 비대칭 매처 `expect.objectContaining(...)`과 함께 써야 한다.
    2. 깊은 비교 비용이 작지 않으므로 매우 큰 배열에서는 검색 전략을 다르게 가져가는 것이 좋다.

### toHaveProperty

1. 무엇인가
    1. `toHaveProperty`는 객체에 특정 키 경로의 프로퍼티가 존재하는지, 선택적으로 그 값까지 일치하는지를 검사하는 매처이다.
    2. 첫 인자는 키 또는 점 표기·배열 표기의 경로이며, 두 번째 인자로 기대값을 함께 넘길 수 있다.
        
        ```tsx
        test('toHaveProperty 사용', () => {
          const user = { id: 1, profile: { name: 'Alice', age: 30 } }
        
          expect(user).toHaveProperty('id')                    // ✅ 키 존재
          expect(user).toHaveProperty('id', 1)                 // ✅ 키와 값 모두 일치
          expect(user).toHaveProperty('profile.name', 'Alice') // ✅ 중첩 경로(점 표기)
          expect(user).toHaveProperty(['profile', 'age'], 30)  // ✅ 배열 경로
          expect(user).toHaveProperty('profile.name', 'Bob')   // ❌ 값이 다름
          expect(user).toHaveProperty('unknown')               // ❌ 키 없음
        })
        ```
        
2. 보통 어디에 쓰이나
    1. 응답 객체의 일부 필드만 확인하면 충분할 때, 전체 객체를 비교하지 않고 핵심 키만 짚어서 검증할 때 쓴다.
    2. 깊게 중첩된 객체의 특정 위치에 값이 들어 있는지를 한 줄로 표현할 수 있어, 분해 검증이 길어지는 상황에 유용하다.
        
        ```tsx
        test('signUp 응답에 토큰이 포함되어야 한다', () => {
          const res = signUp({ name: 'Alice' })
          expect(res).toHaveProperty('auth.token') // ✅ 값은 안 보고 존재만 확인
        })
        ```
        
3. 특징/주의사항
    1. 키 이름 자체에 `.`이 들어 있는 경우 점 표기와 충돌할 수 있으므로, 이런 키는 배열 경로(`['a.b']`)로 명시해야 안전하다.
    2. 두 번째 인자의 값 비교는 `toEqual`과 같은 깊은 비교 규칙을 따른다.

### toMatchObject

1. 무엇인가
    1. `toMatchObject`는 받은 객체에 "기대 객체의 모든 필드"가 같은 값으로 들어 있는지를 검사하는 부분 매칭 매처이다.
    2. 즉 받은 객체에 추가 필드가 더 있어도 무방하며, 기대 객체에 적힌 필드들만 모두 만족하면 통과한다.
        
        ```tsx
        test('toMatchObject로 부분 비교', () => {
          const user = { id: 1, name: 'Alice', age: 30, role: 'admin' }
        
          expect(user).toMatchObject({ name: 'Alice', age: 30 }) // ✅ 일부만 일치해도 OK
          expect(user).toMatchObject({ name: 'Alice', age: 31 }) // ❌ 값이 다름
          expect(user).toMatchObject({ extra: true })            // ❌ 받은 객체에 없는 키
        })
        
        test('배열에도 toMatchObject가 동작한다', () => {
          const users = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]
          expect(users).toMatchObject([{ name: 'Alice' }, { name: 'Bob' }]) // ✅ 같은 위치 필드만 비교
        })
        ```
        
2. 보통 어디에 쓰이나
    1. API 응답이나 객체 결과에서 "이 핵심 필드들은 반드시 이 값이어야 한다"는 의도를 표현할 때 가장 자주 쓴다.
    2. 응답에 시간·자동 생성 ID처럼 변동 필드가 섞여 있을 때, 그 부분을 무시하고 핵심 필드만 검증하는 데에 적합하다.
        
        ```tsx
        test('주문 생성 응답', () => {
          const order = createOrder({ itemId: 'A', count: 2 })
          expect(order).toMatchObject({
            itemId: 'A',
            count: 2,
            status: 'pending',
          }) // ✅ id, createdAt 같은 자동 필드는 검증하지 않음
        })
        ```
        
3. 특징/주의사항
    1. 받은 객체에만 있는 필드는 무시되지만, 기대 객체에 적힌 키는 모두 존재해야 한다.
    2. 부분 매칭이라 자칫 검증이 헐거워질 수 있으므로, 핵심 필드는 명시적으로 적고 변동 필드는 아래의 비대칭 매처와 조합하는 편이 안전하다.

### 비대칭 매처 (`expect.any` · `expect.anything` · `expect.objectContaining` · `expect.arrayContaining` · `expect.stringContaining` · `expect.stringMatching`)

1. 무엇인가
    1. 비대칭 매처는 `expect(값).매처(...)` 형태가 아니라, `toEqual`이나 `toMatchObject` 같은 매처의 "기대값 자리"에 끼워 넣어 부분 조건을 표현하는 도구이다.
    2. 종류별로 의도가 다르고, 그중 자주 쓰이는 것은 다음과 같다.
        
        ```tsx
        test('비대칭 매처 기본 사용', () => {
          expect({ id: 1, createdAt: new Date() }).toEqual({
            id: 1,
            createdAt: expect.any(Date), // ✅ Date 인스턴스이기만 하면 OK
          })
        
          expect({ id: 1, name: 'Alice' }).toEqual({
            id: expect.anything(),       // ✅ null/undefined만 아니면 OK
            name: 'Alice',
          })
        
          expect({ id: 1, name: 'Alice', age: 30 }).toEqual(
            expect.objectContaining({ name: 'Alice' }) // ✅ name만 맞으면 OK
          )
        
          expect([1, 2, 3]).toEqual(expect.arrayContaining([2, 3])) // ✅ 두 원소 모두 포함
          expect([1, 2, 3]).toEqual(expect.arrayContaining([4]))    // ❌ 4가 없음
        
          expect('vitest is fast').toEqual(expect.stringContaining('fast')) // ✅
          expect('user_42').toEqual(expect.stringMatching(/^user_/))        // ✅
        })
        ```
        
        - `expect.any(생성자)`: 특정 타입(`Number`, `String`, `Date`, 클래스 등)의 어떤 값이든 통과.
        - `expect.anything()`: `null`/`undefined`만 아니면 통과.
        - `expect.objectContaining({ ... })`: 객체에 명시한 필드들이 같은 값으로 포함되어 있으면 통과.
        - `expect.arrayContaining([ ... ])`: 배열에 명시한 원소들이 모두 포함되어 있으면 통과(순서 무관).
        - `expect.stringContaining(str)` / `expect.stringMatching(regex)`: 문자열의 부분 일치·정규식 일치.
2. 보통 어디에 쓰이나
    1. 응답 객체나 mock 함수 인자처럼 "정확한 값은 알 수 없지만 형태만 맞으면 OK"인 케이스에서, 변동 필드를 비대칭 매처로 표현한다.
    2. `toMatchObject`로 부분 매칭하면서, 그 안에서 일부 필드는 타입만 보고 일부는 패턴만 보고 싶을 때 자연스럽게 조합된다.
        
        ```tsx
        test('주문 응답의 자동 생성 필드는 형태만 검증', () => {
          const order = createOrder({ itemId: 'A', count: 2 })
          expect(order).toMatchObject({
            id: expect.stringMatching(/^order_/), // ✅ 접두사만 일치하면 OK
            itemId: 'A',
            count: 2,
            createdAt: expect.any(Date),          // ✅ Date 타입이면 OK
          })
        })
        
        test('모킹된 함수가 특정 형태의 인자로 호출되었는지', () => {
          const handler = vi.fn()
          handler({ id: 1, payload: { name: 'Alice' } })
        
          expect(handler).toHaveBeenCalledWith(
            expect.objectContaining({ payload: { name: 'Alice' } })
          ) // ✅ id는 무엇이든 상관없음
        })
        ```
        
3. 특징/주의사항
    1. 비대칭 매처는 단독으로 호출하지 않고 반드시 다른 매처의 "기대값" 자리에 들어가야 한다. 그래서 항상 `expect(...).toEqual(expect.any(...))`처럼 조합 형태로 등장한다.
    2. `toEqual`·`toMatchObject`·`toHaveBeenCalledWith`처럼 깊은 비교를 수행하는 매처와는 잘 어울리지만, 참조 비교를 하는 `toBe`나 `toContain`과 함께 쓰면 의도대로 동작하지 않는다.
    3. 부분 매칭을 너무 광범위하게 쓰면 테스트가 헐거워져 회귀를 잡지 못할 수 있다. 변동 필드는 정확히 어디까지가 변동인지 의식하고, 형태(타입·접두사·패턴) 정도는 최대한 좁혀서 표현하는 편이 안전하다.

## 어설션 메서드4) 예외·비동기

1. 지금까지 다룬 매처는 "함수가 어떤 값을 반환했는가"에 초점이 있었지만, 실제 코드에서는 "예외를 던져야 하는가" 또는 "Promise가 어떤 결과로 풀리는가"가 검증 대상이 되는 일이 많다.
2. 잘못된 입력에 대해 `throw`로 거절하는 함수, `fetch` 같은 비동기 API를 감싼 함수의 성공·실패 케이스가 대표적인 예이다.
3. 이런 검증을 단순히 `try/catch`나 `.then`으로 풀어 쓰면 코드가 길고, 무엇보다 어설션이 실제로 실행됐는지 보장하기 어려워진다.
4. Vitest는 이를 위해 동기 예외용 `toThrow`/`toThrowError`, 비동기 풀림용 `resolves`/`rejects`, 그리고 "어설션이 진짜로 실행됐는지" 자체를 보장하는 `expect.assertions` 계열을 제공한다.

### toThrow / toThrowError

1. 무엇인가
    1. `toThrow`(별칭 `toThrowError`)는 함수를 실행했을 때 예외가 던져지는지를 검사하는 매처이다.
    2. 검사 대상은 값이 아니라 "호출하면 예외가 날 수 있는 함수"여야 하므로, 대상을 `expect(() => 호출())` 형태의 콜백으로 감싸 전달한다.
    3. 인자 없이 호출하면 "어쨌든 throw 되었는지"만 확인하고, 인자에 문자열·정규식·`Error` 클래스·에러 객체 형태를 넘기면 메시지·타입까지 검증할 수 있다.
        
        ```tsx
        function divide(a: number, b: number) {
          if (b === 0) throw new RangeError('cannot divide by zero')
          return a / b
        }
        
        test('toThrow의 다양한 인자', () => {
          expect(() => divide(1, 0)).toThrow()                 // ✅ 어쨌든 throw
          expect(() => divide(1, 0)).toThrow('divide by zero') // ✅ 메시지 부분 일치
          expect(() => divide(1, 0)).toThrow(/zero/)           // ✅ 정규식 매칭
          expect(() => divide(1, 0)).toThrow(RangeError)       // ✅ 에러 타입 일치
          expect(() => divide(1, 0)).toThrow(TypeError)        // ❌ 다른 타입
          expect(() => divide(1, 2)).toThrow()                 // ❌ throw가 발생하지 않음
        })
        ```
        
2. 보통 어디에 쓰이나
    1. 입력값 검증이나 가드 절로 잘못된 호출을 거절하는 함수에서, "이 입력이면 예외를 던져야 한다"를 검증할 때 사용한다.
    2. 도메인 규칙을 위반했을 때 특정 에러 클래스를 던지는 코드(예: `ValidationError`, `UnauthorizedError`)의 분기 동작을 검증할 때 자연스럽게 들어맞는다.
        
        ```tsx
        class ValidationError extends Error {}
        
        function createUser(name: string) {
          if (!name) throw new ValidationError('name is required')
          return { name }
        }
        
        test('빈 이름으로 createUser를 호출하면 ValidationError를 던진다', () => {
          expect(() => createUser('')).toThrow(ValidationError) // ✅
          expect(() => createUser('')).toThrow(/required/)      // ✅ 메시지에 키워드 포함
        })
        ```
        
3. 특징/주의사항
    1. `expect(divide(1, 0))`처럼 함수를 직접 호출해 결과를 넘기면, 예외는 `expect` 호출 전에 던져져 매처가 평가되지 못하므로 반드시 콜백으로 감싸야 한다.
    2. 비동기 함수가 던지는 예외(거부된 `Promise`)는 `toThrow`로 잡을 수 없고, 아래의 `rejects`를 써야 한다.
    3. 메시지에 문자열을 넘기면 "부분 일치"이고, 정확히 일치시키고 싶다면 정규식 앵커(`/^...$/`)를 사용하는 편이 의도가 분명하다.

### resolves / rejects

1. 무엇인가
    1. `resolves`/`rejects`는 어설션 체인 중간에 끼워 `Promise`를 풀어주는 변환자이다.
    2. `expect(promise).resolves.매처(...)`는 Promise가 정상 풀렸을 때의 값에 매처를 적용하고, `expect(promise).rejects.매처(...)`는 거부되었을 때의 사유(보통 `Error`)에 매처를 적용한다.
    3. 두 변환자 모두 자체가 `Promise`를 반환하므로, 결과를 받기까지 기다리려면 반드시 `await`을 붙여야 한다.
        
        ```tsx
        async function fetchUser(id: number) {
          if (id < 0) throw new Error('invalid id')
          return { id, name: 'Alice' }
        }
        
        test('resolves로 정상 결과 검증', async () => {
          await expect(fetchUser(1)).resolves.toEqual({ id: 1, name: 'Alice' }) // ✅
          await expect(fetchUser(1)).resolves.toHaveProperty('name', 'Alice')   // ✅
          await expect(fetchUser(1)).resolves.toBe(null)                        // ❌ 결과는 객체
        })
        
        test('rejects로 거부 사유 검증', async () => {
          await expect(fetchUser(-1)).rejects.toThrow('invalid id') // ✅ 에러 메시지 일치
          await expect(fetchUser(-1)).rejects.toThrow(/invalid/)    // ✅ 정규식 일치
          await expect(fetchUser(1)).rejects.toThrow()              // ❌ 거부되지 않음
        })
        ```
        
2. 보통 어디에 쓰이나
    1. `fetch`로 데이터를 가져오는 함수, 외부 API를 호출하는 서비스 계층, 비동기 폼 제출 등 `Promise`를 반환하는 모든 함수의 결과·실패를 검증할 때 사용한다.
    2. `try/catch`로 결과를 받아 풀어 쓰는 패턴 대신, 한 줄로 "성공 케이스"와 "실패 케이스"를 모두 명확히 표현할 수 있다.
        
        ```tsx
        test('인증 실패 시 401 에러로 거부된다', async () => {
          await expect(authorize('wrong-token')).rejects.toThrow(/401/) // ✅
        })
        ```
        
3. 특징/주의사항
    1. `await`을 빠뜨리면 Vitest 3 기준 경고가 나오고, Vitest 4부터는 어설션이 실제로 평가되지 않은 채 테스트가 "통과"로 잘못 마킹되는 일을 막기 위해 실패로 처리된다.
        
        ```tsx
        // ❌ await 누락 → 어설션이 실제로 평가되지 않을 수 있다
        // expect(fetchUser(1)).resolves.toEqual({ id: 1, name: 'Alice' })
        
        // ✅ 올바른 사용
        await expect(fetchUser(1)).resolves.toEqual({ id: 1, name: 'Alice' })
        ```
        
    2. `rejects` 다음의 매처는 거부 사유를 인자로 받으므로, 일반적으로 `toThrow`/`toBeInstanceOf`/`toMatchObject` 등 에러를 검증하는 매처와 조합된다.
    3. `await expect(promise).resolves...` 형태 대신 `const v = await promise; expect(v)...`로 풀어 쓰는 것도 가능하지만, `resolves`/`rejects`를 쓰면 "비동기를 검증한다"는 의도가 한눈에 드러난다.

### expect.assertions / expect.hasAssertions

1. 무엇인가
    1. `expect.assertions(n)`은 현재 테스트 안에서 정확히 `n`개의 어설션이 실행되어야 한다고 선언하는 함수이다.
    2. `expect.hasAssertions()`는 "최소한 하나의 어설션은 실행되어야 한다"는 약한 형태이다.
    3. 어느 쪽이든 약속한 만큼 어설션이 실행되지 않으면 테스트가 실패로 처리되며, 콜백 기반 비동기 코드나 분기가 갈리는 코드에서 어설션 누락을 잡아내는 안전장치 역할을 한다.
        
        ```tsx
        test('expect.assertions: 정확히 2개의 어설션이 실행돼야 한다', async () => {
          expect.assertions(2)
        
          const user = await fetchUser(1)
          expect(user.id).toBe(1)         // ✅ 1번째
          expect(user.name).toBe('Alice') // ✅ 2번째 → 약속한 2개 충족
        })
        
        test('약속한 수보다 적으면 실패한다', async () => {
          expect.assertions(2)
        
          const user = await fetchUser(1)
          expect(user.id).toBe(1)         // 1번째만 실행
          // 2번째 어설션 누락 → ❌ 테스트 실패
        })
        ```
        
2. 보통 어디에 쓰이나
    1. `try/catch`로 `Promise`의 거부를 검증할 때 `catch` 블록의 어설션이 실제로 실행됐는지를 보장해야 하는 상황에 가장 자주 쓰인다.
    2. 콜백이나 이벤트 핸들러 안에서 비동기로 어설션이 호출되는 패턴에서도, 어설션이 호출되지 않은 채 테스트가 통과하는 사고를 막아 준다.
        
        ```tsx
        test('잘못된 입력은 거부 사유로 안내 메시지를 담는다', async () => {
          expect.assertions(1) // catch 블록이 반드시 실행되어야 한다
        
          try {
            await fetchUser(-1)
          } catch (err) {
            expect((err as Error).message).toMatch(/invalid id/) // ✅
          }
        })
        ```
        
3. 특징/주의사항
    1. `expect.assertions`/`expect.hasAssertions`는 동기 흐름이 단순하고 `await expect(...).rejects...` 형태로 직접 검증할 수 있는 경우에는 굳이 필요하지 않다.
    2. 비대칭 매처나 `resolves`/`rejects`로 풀 수 있는 케이스는 그쪽을 우선 쓰고, 어쩔 수 없이 `try/catch`·콜백 기반으로 흐름이 갈리는 곳에만 안전장치로 끼워 넣는 편이 깔끔하다.

## 모킹1) `vi.fn`과 호출 검증

1. 지금까지의 어설션은 입력을 넣고 결과를 검증하는 "함수의 출력"에 집중했지만, 실무에서는 그 출력만으로 충분하지 않은 경우가 많다.
2. 예를 들어 "사용자가 버튼을 누르면 `onSubmit`이 한 번만, 특정 인자로 호출되어야 한다", "캐시 미스가 나면 API를 호출하지만 캐시 히트면 호출하지 않아야 한다" 같은 검증이 그렇다.
3. 이런 경우 검증 대상은 "어떤 함수가 어떻게 호출되었는가"인데, 진짜 함수를 그대로 쓰면 호출 기록을 남기지 않아 사후에 검증할 수 없다.
4. 그래서 호출 기록을 자동으로 남기고 원하는 동작도 지정할 수 있는 "가짜 함수"가 필요해지며, Vitest에서는 `vi.fn`이 그 역할을 한다.
5. 이번 묶음에서는 `vi.fn`으로 mock 함수를 만드는 법, 그 동작을 지정하는 메서드들, 그리고 호출 기록을 검증하는 매처들을 함께 정리한다.

### vi.fn

1. 무엇인가
    1. `vi.fn`은 호출 기록을 자동으로 남기는 mock 함수를 만드는 함수이다.
    2. 인자 없이 호출하면 항상 `undefined`를 반환하는 빈 함수가 만들어지고, 콜백을 인자로 넘기면 그 콜백이 기본 구현이 된다.
    3. 만들어진 함수는 일반 함수처럼 호출 가능하며, `.mock` 프로퍼티에 호출 기록(`calls`, `results`, `instances` 등)이 누적된다.
        
        ```tsx
        import { vi, test, expect } from 'vitest'
        
        test('vi.fn 기본 사용', () => {
          const fn = vi.fn() // 빈 mock 함수
          fn(1, 2)
          fn('hello')
        
          expect(fn.mock.calls).toEqual([[1, 2], ['hello']]) // ✅ 호출 인자 기록
          expect(fn.mock.calls).toHaveLength(2)              // ✅ 두 번 호출됨
          expect(fn()).toBeUndefined()                       // ✅ 기본 반환은 undefined
        })
        
        test('초기 구현 지정', () => {
          const add = vi.fn((a: number, b: number) => a + b)
          expect(add(1, 2)).toBe(3)              // ✅ 콜백이 그대로 실행됨
          expect(add).toHaveBeenCalledWith(1, 2) // ✅ 호출 기록도 남음
        })
        ```
        
2. 보통 어디에 쓰이나
    1. 컴포넌트의 prop으로 넘기는 콜백(`onClick`, `onSubmit`, `onChange` 등)을 대신해, "호출되었는지 / 어떤 인자로 호출되었는지"를 검증하는 데 가장 자주 쓴다.
    2. 의존성 주입 형태로 함수를 받는 모듈을 테스트할 때, 진짜 의존성 대신 mock 함수를 넘겨 동작과 호출 기록을 동시에 제어한다.
        
        ```tsx
        function submit(form: { name: string }, onSuccess: (id: string) => void) {
          onSuccess(`u_${form.name}`)
        }
        
        test('submit은 성공 콜백을 호출한다', () => {
          const onSuccess = vi.fn()
          submit({ name: 'Alice' }, onSuccess)
        
          expect(onSuccess).toHaveBeenCalledOnce()          // ✅ 한 번 호출
          expect(onSuccess).toHaveBeenCalledWith('u_Alice') // ✅ 특정 인자로
        })
        ```
        
3. 특징/주의사항
    1. `vi.fn` 자체에는 다른 의존성이 없으므로 "이 함수의 호출만 추적하면 된다"는 단순한 케이스에는 다음에 다룰 `vi.spyOn`보다 가볍게 쓸 수 있다.
    2. 진짜 객체의 메서드를 가로채야 할 때는 `vi.fn`이 아니라 `vi.spyOn`이 적합하며, 두 도구의 사용 시점은 그 차이로 갈린다.

### 동작 지정: `mockReturnValue` / `mockResolvedValue` / `mockRejectedValue` / `mockImplementation`

1. 무엇인가
    1. mock 함수에는 "호출됐을 때 어떤 결과를 만들어 낼지"를 지정하는 메서드들이 체이닝으로 제공된다.
    2. 자주 쓰는 것들은 다음과 같다.
        - `mockReturnValue(v)`: 호출 시 동기적으로 `v`를 반환.
        - `mockResolvedValue(v)`: `Promise.resolve(v)`를 반환하는 비동기 mock.
        - `mockRejectedValue(err)`: `Promise.reject(err)`를 반환하는 비동기 mock.
        - `mockImplementation(fn)`: 호출 시 임의의 콜백을 실행하도록 구현 자체를 교체.
    3. 각 메서드에는 "다음 한 번 호출에만 적용"되는 `mockReturnValueOnce`·`mockResolvedValueOnce`·`mockRejectedValueOnce`·`mockImplementationOnce` 변형이 있어, 호출 순서별로 다른 결과를 줄 수 있다.
        
        ```tsx
        test('동작 지정 4종 비교', async () => {
          const sync = vi.fn().mockReturnValue(42)
          expect(sync()).toBe(42)                        // ✅
        
          const ok = vi.fn().mockResolvedValue({ id: 1 })
          await expect(ok()).resolves.toEqual({ id: 1 }) // ✅
        
          const fail = vi.fn().mockRejectedValue(new Error('boom'))
          await expect(fail()).rejects.toThrow('boom')   // ✅
        
          const upper = vi.fn().mockImplementation((s: string) => s.toUpperCase())
          expect(upper('hi')).toBe('HI')                 // ✅
        })
        
        test('Once 변형으로 호출 순서별 결과 지정', () => {
          const fn = vi.fn()
            .mockReturnValueOnce(1)
            .mockReturnValueOnce(2)
            .mockReturnValue(0) // 그 이후는 모두 0
        
          expect(fn()).toBe(1) // ✅
          expect(fn()).toBe(2) // ✅
          expect(fn()).toBe(0) // ✅
          expect(fn()).toBe(0) // ✅
        })
        ```
        
2. 보통 어디에 쓰이나
    1. API 호출을 모킹할 때 `mockResolvedValue`로 성공 응답을, `mockRejectedValue`로 실패 응답을 한 줄로 설정해 두 분기를 각각 테스트한다.
    2. 호출에 따라 결과가 달라야 하는 시나리오(예: 첫 호출은 캐시 미스, 두 번째 호출은 캐시 히트)에서는 Once 계열을 차례로 체이닝해서 표현한다.
        
        ```tsx
        const fetchUser = vi.fn()
        
        test('API가 실패하면 fallback UI를 보여준다', async () => {
          fetchUser.mockRejectedValue(new Error('network'))
          await expect(loadProfile(fetchUser)).resolves.toMatchObject({
            status: 'fallback',
          }) // ✅
        })
        
        test('재시도: 첫 호출은 실패, 두 번째 호출은 성공', async () => {
          fetchUser
            .mockRejectedValueOnce(new Error('network'))
            .mockResolvedValueOnce({ id: 1, name: 'Alice' })
        
          await expect(loadProfileWithRetry(fetchUser)).resolves.toEqual({
            id: 1, name: 'Alice',
          }) // ✅
        })
        ```
        
3. 특징/주의사항
    1. `mockReturnValue`로 `Promise`를 직접 넘기는 것보다 `mockResolvedValue`를 쓰는 편이 의도가 분명하고 코드도 짧다.
    2. `mockImplementation`은 표현력이 가장 크지만 그만큼 "어떻게 동작하는지"가 mock 자체에 묻혀, 테스트가 진짜 검증 대상보다 mock 구현에 가까워질 위험이 있으므로 절제해서 쓴다.

### 호출 여부·횟수: `toHaveBeenCalled` / `toHaveBeenCalledTimes` / `toHaveBeenCalledOnce`

1. 무엇인가
    1. 세 매처는 mock 함수가 호출되었는지를 횟수 기준으로 검사한다.
    2. `toHaveBeenCalled`는 최소 한 번이라도 호출되었는지를 본다.
    3. `toHaveBeenCalledTimes(n)`은 정확히 `n`회 호출되었는지를, `toHaveBeenCalledOnce`는 정확히 한 번만 호출되었는지를 본다(`toHaveBeenCalledTimes(1)`과 같다).
        
        ```tsx
        test('호출 여부·횟수 매처', () => {
          const fn = vi.fn()
          fn()
          fn()
        
          expect(fn).toHaveBeenCalled()       // ✅ 1번 이상 호출
          expect(fn).toHaveBeenCalledTimes(2) // ✅ 정확히 2번
          expect(fn).toHaveBeenCalledTimes(1) // ❌ 실제로는 2번
          expect(fn).toHaveBeenCalledOnce()   // ❌ 정확히 1번이 아님
        })
        ```
        
2. 보통 어디에 쓰이나
    1. "이벤트가 발생하면 핸들러가 호출되어야 한다"처럼 호출 자체를 확인할 때, 가장 단순하게 `toHaveBeenCalled`만으로 충분한 경우가 많다.
    2. 디바운스·스로틀·중복 클릭 방지처럼 호출 횟수가 의미를 갖는 로직에서는 `toHaveBeenCalledTimes`/`toHaveBeenCalledOnce`로 정확한 횟수를 검증한다.
        
        ```tsx
        test('중복 클릭 방지: 빠르게 두 번 눌러도 onSubmit은 한 번만 호출된다', async () => {
          const onSubmit = vi.fn()
          await fastDoubleClick(onSubmit)
        
          expect(onSubmit).toHaveBeenCalledOnce() // ✅
        })
        ```
        
3. 특징/주의사항
    1. 이전 테스트의 호출 기록이 다음 테스트로 이어지면 횟수 검증이 어긋날 수 있으므로, `beforeEach`에서 `vi.clearAllMocks()`로 기록을 비워두는 것이 안전하다.

### 호출 인자: `toHaveBeenCalledWith` / `toHaveBeenLastCalledWith` / `toHaveBeenNthCalledWith`

1. 무엇인가
    1. 세 매처는 mock이 어떤 인자로 호출되었는지를 검사한다.
    2. `toHaveBeenCalledWith(...args)`는 "한 번이라도 그런 인자 조합으로 호출된 적이 있는가"를, `toHaveBeenLastCalledWith`는 "마지막 호출의 인자가 그와 같았는가"를, `toHaveBeenNthCalledWith(n, ...args)`는 "n번째 호출의 인자가 그와 같았는가"를 본다.
    3. 인자 비교는 `toEqual` 규칙(깊은 비교)을 따르므로, 비대칭 매처와 자연스럽게 조합된다.
        
        ```tsx
        test('호출 인자 매처', () => {
          const fn = vi.fn()
          fn(1)
          fn(2, 3)
          fn({ id: 1, name: 'Alice' })
        
          expect(fn).toHaveBeenCalledWith(1)                            // ✅ 어딘가에 그 호출 있음
          expect(fn).toHaveBeenLastCalledWith({ id: 1, name: 'Alice' }) // ✅ 마지막 호출
          expect(fn).toHaveBeenNthCalledWith(2, 2, 3)                   // ✅ 2번째 호출 인자
          expect(fn).toHaveBeenCalledWith(99)                           // ❌ 그런 호출 없음
        
          // 비대칭 매처와 조합
          expect(fn).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'Alice' })
          ) // ✅ name만 맞아도 OK
        })
        ```
        
2. 보통 어디에 쓰이나
    1. 컴포넌트가 콜백 prop에 어떤 형태의 데이터를 넘기는지 검증할 때, `toHaveBeenCalledWith`로 인자를 검사한다.
    2. 외부 API 클라이언트나 분석 이벤트 트래커처럼 호출 인자가 외부 계약에 해당하는 경우에 강력하다.
        
        ```tsx
        test('analytics.track은 클릭 이벤트를 정해진 형식으로 보낸다', () => {
          const track = vi.fn()
          handleClick({ id: 'btn_1' }, track)
        
          expect(track).toHaveBeenCalledWith(
            'click',
            expect.objectContaining({ id: 'btn_1' }),
          ) // ✅ 이벤트 이름 + 페이로드 형태 검증
        })
        ```
        
3. 특징/주의사항
    1. 인자가 객체라면 `toEqual` 기반의 깊은 비교이므로, 변동 필드는 비대칭 매처로 풀어주어야 테스트가 깨지지 않는다.
    2. 여러 번 호출되는 함수에서 "마지막 호출만 중요한가, 모든 호출이 중요한가"를 의식하지 않으면 `toHaveBeenLastCalledWith`와 `toHaveBeenCalledWith`의 의도가 헷갈릴 수 있다.

### 반환값 검증: `toHaveReturned` / `toHaveReturnedTimes` / `toHaveReturnedWith` / `toHaveLastReturnedWith` / `toHaveNthReturnedWith`

1. 무엇인가
    1. 위의 호출 매처들이 "인자"를 보는 매처라면, 이쪽은 mock 함수가 "어떤 값을 반환했는가"를 보는 매처이다.
    2. `toHaveReturned`는 한 번이라도 정상 반환됐는지(도중에 throw 되지 않았는지)를, `toHaveReturnedTimes(n)`은 정상 반환 횟수가 정확히 `n`회인지를 검사한다.
    3. `toHaveReturnedWith(v)` / `toHaveLastReturnedWith(v)` / `toHaveNthReturnedWith(n, v)`는 반환값이 특정 값과 같았는지를 각각 한 번이라도/마지막/n번째 호출 기준으로 본다.
        
        ```tsx
        test('반환값 검증 매처', () => {
          const add = vi.fn((a: number, b: number) => a + b)
          add(1, 2)
          add(10, 20)
        
          expect(add).toHaveReturned()            // ✅ 정상 반환된 적 있음
          expect(add).toHaveReturnedTimes(2)      // ✅ 두 번 정상 반환
          expect(add).toHaveReturnedWith(3)       // ✅ 어딘가에서 3을 반환
          expect(add).toHaveLastReturnedWith(30)  // ✅ 마지막 반환은 30
          expect(add).toHaveNthReturnedWith(1, 3) // ✅ 첫 호출의 반환값은 3
          expect(add).toHaveReturnedWith(999)     // ❌ 그런 반환 없음
        })
        ```
        
2. 보통 어디에 쓰이나
    1. `mockImplementation`으로 동작을 지정한 mock의 결과가 의도대로 흘러갔는지 확인할 때, 인자 검증과 함께 보조적으로 쓰인다.
    2. mock의 반환을 고정하지 않고 입력에 따라 계산하도록 둔 뒤, "어떤 입력에 어떤 결과가 나왔는지"까지 같이 검증하는 방식의 테스트에 적합하다.
3. 특징/주의사항
    1. 호출 인자 검증(`toHaveBeenCalledWith`)만으로 충분한 경우가 많아서, 반환값 매처는 실제 사용 빈도가 그보다 낮다.
    2. `mockReturnValue`로 고정 반환을 설정한 mock에는 굳이 반환값 매처를 또 검증할 필요가 없으며, 검증할 가치가 있을 때만 사용한다.

### 상태 관리: `mockClear` / `mockReset` / `mockRestore` (+ 전역 변형)

1. 무엇인가
    1. mock 함수에는 호출 기록·구현·원본 복원을 다루는 세 단계의 정리 메서드가 있다.
    2. 각각의 역할은 다음과 같다.
        - `mockClear()`: 호출 기록(`mock.calls`, `mock.results`, `mock.instances`)만 비운다. 구현은 그대로.
        - `mockReset()`: 호출 기록을 비우고, 지정해 둔 구현·반환값까지 모두 초기화한다.
        - `mockRestore()`: `vi.spyOn`으로 가로챈 메서드를 원본 구현으로 되돌린다. `vi.fn`만으로 만든 mock에는 효과가 없다.
    3. 전역 변형으로 `vi.clearAllMocks()`, `vi.resetAllMocks()`, `vi.restoreAllMocks()`가 있어, 모든 mock에 같은 정리를 한 번에 수행한다.
        
        ```tsx
        import { beforeEach, vi } from 'vitest'
        
        beforeEach(() => {
          vi.clearAllMocks() // ✅ 매 테스트 전 호출 기록만 비움 (구현은 유지)
        })
        
        test('mockClear vs mockReset', () => {
          const fn = vi.fn().mockReturnValue(42)
          fn() // 호출 기록 + 반환값 42 적용 상태
        
          fn.mockClear()
          expect(fn).not.toHaveBeenCalled() // ✅ 호출 기록은 비워짐
          expect(fn()).toBe(42)             // ✅ 구현은 살아있음
        
          fn.mockReset()
          expect(fn()).toBeUndefined()      // ✅ 구현까지 초기화됨
        })
        ```
        
2. 보통 어디에 쓰이나
    1. 테스트 간 호출 기록 누수를 막기 위해 `beforeEach`에서 `vi.clearAllMocks()`를 호출하는 패턴이 가장 흔하다.
    2. `vi.spyOn`으로 모듈의 메서드를 가로챈 테스트라면, `afterEach`에 `vi.restoreAllMocks()`를 두어 다른 테스트나 파일에 영향이 새지 않도록 한다.
    3. 글로벌 설정의 `test.clearMocks` / `test.restoreMocks` / `test.unstubGlobals` 같은 옵션으로 자동화할 수도 있다.
3. 특징/주의사항
    1. `mockReset`은 구현까지 초기화하므로, 매 테스트마다 mock 동작을 새로 지정하지 않으면 의도치 않게 `undefined`를 반환하게 만들 수 있다. 보통은 `mockClear` 정도면 충분하다.
    2. `mockRestore`는 spy에만 의미가 있어서 `vi.fn`만으로 만든 mock에 호출해도 호출 기록·구현은 그대로 남는다. 두 도구의 책임 차이를 의식하고 사용해야 한다.

## 모킹2) `vi.spyOn` (기존 객체의 메서드 가로채기)

1. `vi.fn`이 "이 자리에 끼울 새 함수"를 만드는 도구라면, `vi.spyOn`은 그 반대로 "이미 존재하는 메서드를 가로채" 호출을 추적하거나 동작을 갈아 끼우는 도구이다.
2. 외부 라이브러리의 함수, 전역 객체(`console`, `Math`, `Date`), 모듈이 export한 함수, 클래스 인스턴스의 메서드처럼 직접 만들지 않은 함수의 호출을 검증해야 하는 상황이 그 대상이다.
3. 두 도구는 같은 mock 메서드 집합(`mockImplementation`, `mockReturnValue`, `mockClear` 등)을 공유하기 때문에, 호출 검증 매처와 동작 지정 방식은 그대로 적용된다.
4. 이번 묶음에서는 `vi.spyOn`의 기본 동작, 접근자(getter/setter) 스파이, 그리고 동작 교체와 자동 복원 패턴을 차례로 정리한다.

### vi.spyOn

1. 무엇인가
    1. `vi.spyOn(object, method)`은 기존 객체의 메서드를 가로채 스파이로 감싸는 함수이다.
    2. 기본 동작은 "원본 구현을 그대로 실행하면서 호출 기록만 남기는" 형태이므로, 진짜 동작을 유지한 채 호출 검증만 추가하고 싶을 때 자연스럽게 들어맞는다.
    3. 반환된 스파이는 `vi.fn`이 만든 mock과 동일한 메서드를 공유하므로, 필요하면 그 위에 `mockImplementation` 등을 체이닝해 동작 자체를 바꿀 수 있다.
        
        ```tsx
        import { vi, test, expect } from 'vitest'
        
        const cart = {
          getApples: () => 13,
        }
        
        test('vi.spyOn 기본 — 원본 실행 + 호출 추적', () => {
          const spy = vi.spyOn(cart, 'getApples')
        
          expect(cart.getApples()).toBe(13)           // ✅ 원본 구현이 그대로 동작
          expect(spy).toHaveBeenCalledOnce()          // ✅ 호출 기록도 남음
          expect(spy.getMockName()).toBe('getApples') // ✅ 원본 메서드 이름을 그대로 추적
        })
        ```
        
2. 보통 어디에 쓰이나
    1. 외부 라이브러리나 전역 객체(`console`, `Math.random`, `Date.now` 등)의 메서드를 가로채, 호출 여부를 검증하거나 동작을 일시적으로 바꿔야 할 때 사용한다.
    2. 모듈 일부분만 검증·제어하고 싶을 때(모듈 전체를 모킹하는 `vi.mock`까지는 과한 경우) 자연스러운 단위가 된다.
    3. 모듈 import 객체에 대해 `vi.spyOn(mod, 'export명')` 형태로, 그 모듈이 export한 함수 하나만 골라 가로채는 패턴도 자주 쓰인다.
        
        ```tsx
        test('console.log 호출 검증 + 출력 억제', () => {
          const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
        
          greet('Alice') // 내부적으로 console.log를 호출하는 함수
          expect(spy).toHaveBeenCalledWith('Hello, Alice') // ✅
        })
        
        // 모듈 export 가로채기
        import * as mathMod from './math'
        
        test('square는 내부에서 multiply를 호출한다', () => {
          const spy = vi.spyOn(mathMod, 'multiply')
          mathMod.square(3)
        
          expect(spy).toHaveBeenCalledWith(3, 3) // ✅
        })
        ```
        
3. 특징/주의사항
    1. 가로챈 메서드는 테스트가 끝나도 자동으로 복원되지 않으므로, `afterEach`에 `vi.restoreAllMocks()`를 두거나 개별 spy의 `mockRestore()`를 호출해 원본을 되돌려야 한다.
        
        ```tsx
        afterEach(() => {
          vi.restoreAllMocks() // ✅ 모든 spy의 원본 메서드 복원
        })
        ```
        
    2. `mockRestore`는 `vi.spyOn`이 만든 스파이에서는 "원본 프로퍼티 디스크립터까지 되돌리는" 의미가 있지만, `vi.fn`만으로 만든 mock에서는 `mockReset`과 동일하게 동작한다. 두 도구의 차이를 의식하고 사용해야 한다.

### getter / setter 스파이

1. 무엇인가
    1. 일반 메서드뿐 아니라 접근자(getter/setter)도 가로챌 수 있으며, 세 번째 인자로 `'get'` 또는 `'set'`을 넘기면 된다.
    2. 그러면 그 속성에 대한 읽기·쓰기 호출이 추적되며, 다른 mock 메서드와 동일하게 `mockReturnValue` 등으로 값도 갈아 끼울 수 있다.
        
        ```tsx
        class Dog {
          constructor(public name: string) {}
        }
        
        const dog = new Dog('Cooper')
        
        test('getter 스파이', () => {
          const nameSpy = vi.spyOn(dog, 'name', 'get').mockReturnValue('Max')
        
          expect(dog.name).toBe('Max')           // ✅ getter가 가로채진 값을 반환
          expect(nameSpy).toHaveBeenCalledOnce() // ✅ getter 접근 1회 기록
        })
        
        test('setter 스파이', () => {
          const setSpy = vi.spyOn(dog, 'name', 'set')
        
          dog.name = 'Buddy'
        
          expect(setSpy).toHaveBeenCalledWith('Buddy') // ✅ 설정한 값이 인자로 기록됨
        })
        ```
        
2. 보통 어디에 쓰이나
    1. `window.location`, `document.cookie`처럼 접근자로 구현된 브라우저 API의 동작을 테스트 안에서 임의로 가로챌 때 사용한다.
    2. 클래스 인스턴스의 계산 속성이 시나리오별로 다른 값을 반환해야 하는 케이스를 검증할 때에도 자연스럽게 들어맞는다.
        
        ```tsx
        test('window.location.href를 가짜 URL로 가로채기', () => {
          vi.spyOn(window, 'location', 'get').mockReturnValue({
            href: 'https://mocked-url.com',
          } as Location)
        
          expect(window.location.href).toBe('https://mocked-url.com') // ✅
        })
        ```
        
3. 특징/주의사항
    1. 일반 메서드 스파이와 마찬가지로 `mockRestore`로 복원해야 다른 테스트에 영향이 새지 않으며, 접근자는 한 번 가로채면 디스크립터 자체가 바뀌므로 복원 누락이 더 치명적이다.
    2. 브라우저 모드에서는 모듈 export 객체의 getter 스파이가 동작하지 않는 등 환경에 따른 제한이 있어, 실제 적용 전에 공식 가이드의 환경별 주석을 확인해 두는 편이 안전하다.

### 동작 교체와 자동 복원 (`mockImplementation` · `using` 키워드)

1. 무엇인가
    1. spy 위에 `mockImplementation`, `mockReturnValue`, `mockResolvedValue` 같은 메서드를 체이닝하면 원본 동작 대신 임의의 동작을 끼울 수 있다.
    2. Explicit Resource Management(`using`) 문법이 지원되는 환경에서는 `using spy = vi.spyOn(...)` 형태로 선언해, 블록을 벗어나는 순간 자동으로 `mockRestore`가 호출되게 만들 수 있다.
        
        ```tsx
        test('동작 교체', () => {
          const cart = { getApples: () => 13 }
        
          const spy = vi.spyOn(cart, 'getApples').mockImplementation(() => 0)
        
          expect(cart.getApples()).toBe(0)   // ✅ 가로채진 구현이 동작
          expect(spy).toHaveBeenCalledOnce() // ✅
        })
        
        test('using으로 블록 종료 시 자동 복원', () => {
          using spy = vi.spyOn(console, 'log').mockImplementation(() => {})
          // 블록을 벗어나면 console.log가 자동으로 원본 복원
        
          debug('message')
          expect(spy).toHaveBeenCalled() // ✅
        })
        ```
        
2. 보통 어디에 쓰이나
    1. 외부 의존(시간·랜덤·로깅·HTTP 등)의 동작을 시나리오별로 다르게 만들고 싶을 때, 원본 메서드를 갈아 끼우는 가장 간단한 방법으로 쓴다.
    2. 한 번만 다른 동작을 주고 다시 원본으로 돌아가야 한다면, `mockImplementationOnce`로 호출 1회짜리 교체를 끼우는 식으로 응용한다.
        
        ```tsx
        test('Math.random을 한 번만 고정값으로', () => {
          const spy = vi.spyOn(Math, 'random').mockImplementationOnce(() => 0.42)
        
          expect(pickItem(['a', 'b', 'c'])).toBe('b') // ✅ 0.42에 해당하는 인덱스 결과
          expect(Math.random()).not.toBe(0.42)        // ✅ 두 번째 호출은 원본 동작
        })
        ```
        
3. 특징/주의사항
    1. `mockImplementation`에 화살표 함수를 넘기면 `new`로 호출되는 생성자 케이스에서 동작하지 않으므로, 클래스를 모킹할 때는 `function` 키워드나 클래스 자체를 넘겨야 한다.
    2. spy의 동작 교체는 강력한 만큼 테스트가 mock 구현에 의존하기 쉬워지므로, 가능하면 원본을 그대로 두고 호출만 추적하는 단순한 형태를 우선 시도하는 편이 안전하다.

## 10. 모킹 ③ — `vi.mock` (모듈 단위 모킹)

1. `vi.fn`이 새 함수를, `vi.spyOn`이 기존 객체의 메서드 하나를 가로챘다면, `vi.mock`은 그보다 한 단계 위에서 모듈 전체를 가짜로 바꾼다.
2. 외부 라이브러리(`axios`, `dayjs`, 사내 SDK 등)나, 검증 대상 코드 안에서 직접 `import`하는 모듈을 통째로 대체해야 할 때 사용한다.
3. `vi.spyOn`은 "이미 import한 객체"의 메서드를 가로채는 것이라 일부만 덮기에는 좋지만, 모듈 안쪽 코드가 따로 `import`해서 쓰는 결과까지 같이 영향을 주려면 모듈 캐시 자체를 갈아치워야 한다. 그 역할이 `vi.mock`이다.
4. 가장 큰 특징은 호이스팅이라, `vi.mock` 호출은 정적 분석으로 파일 최상단으로 끌어올려져 어떤 `import`보다 먼저 실행된다.
5. 이번 묶음에서는 기본 사용법, 원본 일부만 덮는 패턴(`vi.importActual`/`importOriginal`), 외부 변수를 안전하게 끼우는 `vi.hoisted`, 호이스팅을 피하는 변형(`vi.doMock`), 그리고 모킹 해제(`vi.unmock`)와 `{ spy: true }` 옵션까지 다룬다.

### vi.mock

1. 무엇인가
    1. `vi.mock(path)` 또는 `vi.mock(path, factory)`은 지정한 모듈 경로의 모든 export를 자동 mock 또는 팩토리 결과로 대체하는 함수이다.
    2. 팩토리를 생략하면 Vitest가 모듈을 자동으로 mock해 모든 export를 `vi.fn()` 또는 빈 객체로 채운다.
    3. 팩토리를 넘기면 그 함수가 반환한 객체가 그대로 모듈의 새 export 모음이 되며, 팩토리는 비동기여도 된다.
    4. `vi.mock` 호출은 파일 최상단으로 호이스팅되므로 코드의 어느 줄에 적든 모든 `import`보다 먼저 실행된다.
        
        ```tsx
        import { vi, test, expect } from 'vitest'
        import { fetchData } from './api'
        
        // 모듈 전체를 팩토리 결과로 교체
        vi.mock('./api', () => ({
          fetchData: vi.fn().mockResolvedValue({ ok: true }),
        }))
        
        test('fetchData가 가짜 응답을 돌려준다', async () => {
          await expect(fetchData()).resolves.toEqual({ ok: true }) // ✅
          expect(fetchData).toHaveBeenCalledOnce()                  // ✅
        })
        ```
        
2. 보통 어디에 쓰이나
    1. HTTP 클라이언트(`axios`, `fetch` 래퍼)나 외부 SDK처럼 테스트에서 실제 호출을 막아야 하는 모듈을 통째로 교체할 때 가장 자주 쓴다.
    2. 시간·랜덤·UUID처럼 결정적이지 않은 결과를 만들어 내는 모듈을, 테스트에서는 고정된 가짜 함수로 바꿔놓을 때 적합하다.
    3. 검증 대상이 내부에서 다른 모듈을 import 해 그 결과를 그대로 사용하는 구조(테스트 코드에서 직접 의존성에 손댈 수 없는 경우)에서 의존성을 갈아 끼우기 위해 사용한다.
        
        ```tsx
        // 외부 라이브러리를 통째로 교체
        vi.mock('uuid', () => ({
          v4: () => 'fixed-uuid', // ✅ 항상 같은 ID → 결정적 테스트
        }))
        
        // 사내 SDK 클라이언트를 가짜로 교체
        vi.mock('./analytics', () => ({
          track: vi.fn(),
        }))
        ```
        
3. 특징/주의사항
    1. 팩토리는 호이스팅된 위치에서 실행되므로, 팩토리 안에서 파일 최상위 스코프의 변수를 참조하면 "변수가 정의되기 전에 접근"하는 형태가 되어 에러가 난다. 이 패턴은 뒤의 `vi.hoisted`로 해결한다.
        
        ```tsx
        // ❌ 호이스팅 때문에 mockUser가 아직 undefined
        const mockUser = { id: 1, name: 'Alice' }
        vi.mock('./api', () => ({
          fetchUser: vi.fn().mockResolvedValue(mockUser),
        }))
        ```
        
    2. `vi.mock`의 `vi`는 반드시 `'vitest'`에서 직접 import 한 것이어야 한다. 유틸 파일에서 re-export한 `vi`로 호출하면 정적 분석이 호이스팅 대상을 식별하지 못해 동작하지 않는다.
    3. `vi.mock(import('./path'), ...)`처럼 동적 import 표현식을 첫 인자에 쓰면 TypeScript가 모듈 경로를 검증해 주고, 팩토리에 들어오는 `importOriginal` 헬퍼의 타입도 자동으로 추론된다.

### `vi.importActual` / 팩토리의 `importOriginal`

1. 무엇인가
    1. 모듈 전체를 다 갈아치우지 않고 "일부 export만 mock으로 바꾸고 싶다"는 흔한 요구를 위해, 두 가지 방식이 제공된다.
    2. `vi.importActual<typeof Module>(path)`는 mock을 무시하고 원본 모듈을 그대로 가져오는 비동기 헬퍼이다.
    3. 팩토리에 매개변수로 들어오는 `importOriginal` 헬퍼도 같은 역할을 하며, `vi.mock(import('./path'), ...)` 형태와 함께 쓰면 타입이 자동으로 추론된다.
        
        ```tsx
        import { vi, test, expect } from 'vitest'
        import { add, multiply } from './math'
        
        vi.mock('./math', async () => {
          const actual = await vi.importActual<typeof import('./math')>('./math')
          return {
            ...actual,
            multiply: vi.fn(() => 999), // ✅ multiply만 가짜로 교체
          }
        })
        
        test('add는 원본, multiply는 mock', () => {
          expect(add(1, 2)).toBe(3)        // ✅ 원본 동작 유지
          expect(multiply(2, 3)).toBe(999) // ✅ mock이 동작
        })
        ```
        
        ```tsx
        // importOriginal 패턴 (타입 추론에 유리)
        vi.mock(import('./math'), async (importOriginal) => {
          const actual = await importOriginal()
          return {
            ...actual,
            multiply: vi.fn(() => 999),
          }
        })
        ```
        
2. 보통 어디에 쓰이나
    1. 외부 라이브러리에서 함수 하나만 갈아 끼우고 나머지는 원래 동작을 그대로 쓰고 싶을 때 사용한다.
    2. 모듈 전체를 모킹하면 다른 곳에서 쓰는 export까지 망가지는 부작용을 막기 위해, "일부만 덮기" 패턴이 사실상 표준에 가깝다.
        
        ```tsx
        vi.mock('axios', async (importOriginal) => {
          const actual = await importOriginal<typeof import('axios')>()
          return {
            ...actual,
            default: {
              ...actual.default,
              post: vi.fn().mockResolvedValue({ data: {} }),
            },
            // ✅ post만 mock, get/put/delete 등은 원본 유지
          }
        })
        ```
        
3. 특징/주의사항
    1. 팩토리에서 export하지 않은 키에 접근하면 Vitest가 친절한 에러로 알려 주므로, 누락된 export는 빠르게 찾을 수 있다.
    2. `default` export도 적절히 spread해서 함께 넘겨야 default를 사용하는 코드가 깨지지 않는다.

### vi.hoisted

1. 무엇인가
    1. `vi.hoisted(factory)`는 인자로 받은 콜백을 `vi.mock`보다 먼저 실행되도록 호이스팅 단계로 끌어올리는 함수이다.
    2. 팩토리의 결과는 동기·비동기 모두 가능하며, 그 결과를 변수에 받아 `vi.mock`의 팩토리 내부에서 안전하게 참조할 수 있다.
        
        ```tsx
        const mocks = vi.hoisted(() => ({
          fetchUser: vi.fn().mockResolvedValue({ id: 1, name: 'Alice' }),
        }))
        
        vi.mock('./api', () => ({
          fetchUser: mocks.fetchUser, // ✅ 호이스팅 시점에 이미 정의되어 있음
        }))
        
        test('mocks 변수를 통해 호출도 검증할 수 있다', async () => {
          const { fetchUser } = await import('./api')
          await fetchUser()
        
          expect(mocks.fetchUser).toHaveBeenCalledOnce() // ✅
        })
        ```
        
2. 보통 어디에 쓰이나
    1. `vi.mock` 팩토리 안에서 외부 스코프의 mock 함수·픽스처를 참조해야 하지만 호이스팅 때문에 직접은 쓸 수 없을 때 사용한다.
    2. 여러 mock 함수를 한 객체에 모아 두고 테스트 안에서 호출 기록까지 같이 검증하는 패턴에 잘 맞는다.
3. 특징/주의사항
    1. `vi.hoisted` 안에서 만든 mock 함수는 일반 `vi.fn()`과 같으므로 호출 검증 매처(`toHaveBeenCalledWith` 등)를 그대로 쓸 수 있다.
    2. 팩토리 안에 무거운 로직을 넣으면 호이스팅 단계가 느려져 전체 테스트 부트스트랩이 늦어질 수 있으니, mock 정의 정도로 가볍게 유지하는 편이 좋다.

### vi.doMock

1. 무엇인가
    1. `vi.doMock(path, factory)`은 `vi.mock`의 호이스팅되지 않는 변형이다.
    2. 호출 위치 그대로 실행되므로, 팩토리 안에서 그 시점까지 정의된 변수·픽스처를 자유롭게 사용할 수 있다.
    3. 단 호이스팅이 없는 만큼 이미 정적으로 import 된 모듈에는 영향을 줄 수 없고, 호출 이후의 동적 `import`부터 적용된다.
        
        ```tsx
        import { test, expect, vi } from 'vitest'
        
        test('doMock은 호출 이후의 동적 import에만 적용된다', async () => {
          const suffix = 'dummy text'
        
          vi.doMock('./formatter', () => ({
            format: (s: string) => `${s} :: ${suffix}`, // ✅ 외부 변수 사용 OK
          }))
        
          const { format } = await import('./formatter')
          expect(format('hello')).toBe('hello :: dummy text') // ✅
        })
        ```
        
2. 보통 어디에 쓰이나
    1. 테스트 시나리오별로 mock 동작을 다르게 주고 싶을 때, 매번 다른 클로저 변수를 끼워 팩토리를 만드는 패턴에 적합하다.
    2. 모듈을 mock한 뒤 동적 import로 새로 로드해 "이번 케이스용 모듈"을 받아 쓰는 방식의 테스트 구성에 어울린다.
3. 특징/주의사항
    1. 호출 시점 이전에 이미 정적으로 import된 모듈은 영향을 받지 않으므로, 보통 `await import(...)`와 짝지어 쓴다.
    2. 한 번 적용된 효과는 그대로 남기 때문에, 시나리오가 끝나면 `vi.doUnmock(path)`로 풀어 줘야 다음 테스트가 깨끗한 상태에서 시작된다.

### `vi.unmock` / `vi.doUnmock` / `{ spy: true }` 옵션

1. 무엇인가
    1. `vi.unmock(path)`는 mock된 모듈을 등록에서 제외해, 이후 모든 import가 원본 모듈을 받도록 만드는 함수이다. `vi.mock`과 마찬가지로 호이스팅된다.
    2. `vi.doUnmock(path)`는 호이스팅되지 않는 변형으로, 호출 이후의 동적 import부터 원본 모듈을 돌려준다.
    3. `vi.mock(path, { spy: true })`은 "모듈을 자동 mock하되, 호출 기록만 남기고 원본 구현은 그대로 두는" 옵션이다. 모듈 export가 다른 코드에 의해 호출되었는지만 검증하고 싶을 때 가장 가볍게 쓸 수 있다.
        
        ```tsx
        // 자동 mock + 원본 구현 유지
        vi.mock('./api', { spy: true })
        
        import { fetchUser } from './api'
        
        test('fetchUser가 호출되었는지만 확인', async () => {
          await fetchUser(1)
          expect(fetchUser).toHaveBeenCalledWith(1) // ✅ 호출 기록은 남음
        })
        ```
        
2. 보통 어디에 쓰이나
    1. 셋업 파일에서 전역적으로 모킹해 둔 모듈을 특정 테스트에서만 원본으로 돌려야 할 때 `vi.unmock`을 쓴다.
    2. "이 모듈의 export가 한 번이라도 호출되었는지"가 핵심인 검증에서는, 팩토리를 따로 짜는 대신 `{ spy: true }` 옵션을 쓰면 코드가 훨씬 짧아진다.
3. 특징/주의사항
    1. `vi.unmock`은 호이스팅되므로 파일 어디에 적어도 최상단에서 실행된다. 동적 변경이 필요하면 `vi.doUnmock`을 사용한다.
    2. `{ spy: true }`는 자동 mock과 원본 구현을 동시에 살리는 절충이라 편리하지만, "원본을 실행한다"는 점은 의식해야 한다. 외부 API 실제 호출처럼 부작용이 있는 모듈에는 부적합하다.

## 11. 타이머 모킹 — fake timers

1. 디바운스·스로틀, 자동 로그아웃, 폴링, 애니메이션 등 시간 의존 코드를 진짜 `setTimeout`/`setInterval`로 검증하면, 테스트가 느려지고 결과가 흔들리기 쉽다.
2. Vitest는 내부적으로 `@sinonjs/fake-timers`를 사용해 `setTimeout`·`setInterval`·`Date`·`performance.now` 등 시간 관련 전역을 가짜 구현으로 교체할 수 있게 해 준다.
3. 가짜 타이머로 바꾼 뒤에는 "몇 ms 만큼 진행했다고 가정"하는 식으로 시간을 코드로 제어할 수 있어, 결정적이고 빠른 검증이 가능해진다.
4. 이번 묶음에서는 가짜/실제 타이머 전환, 시간 진행 메서드들, 시스템 시간 고정, 그리고 어떤 전역을 가짜로 만들지 지정하는 설정을 다룬다.

### vi.useFakeTimers / vi.useRealTimers

1. 무엇인가
    1. `vi.useFakeTimers()`는 현재 환경의 `setTimeout`·`clearTimeout`·`setInterval`·`Date` 등 시간 관련 전역을 가짜 구현으로 교체하는 함수이다.
    2. `vi.useRealTimers()`는 그 반대로, 가짜 구현을 모두 제거하고 원래의 실제 타이머로 되돌린다.
    3. 보통 `beforeEach`/`afterEach`에 짝지어 두어, 매 테스트마다 깨끗한 가짜 타이머 환경에서 시작하고 끝낸다.
        
        ```tsx
        import { beforeEach, afterEach, test, expect, vi } from 'vitest'
        
        beforeEach(() => {
          vi.useFakeTimers() // ✅ 매 테스트 직전 가짜 타이머로 전환
        })
        
        afterEach(() => {
          vi.useRealTimers() // ✅ 매 테스트 직후 실제 타이머로 복원
        })
        
        test('1초 뒤에 콜백이 호출된다', () => {
          const cb = vi.fn()
          setTimeout(cb, 1000)
        
          expect(cb).not.toHaveBeenCalled() // ✅ 아직 시간이 흐르지 않았다
        })
        ```
        
2. 보통 어디에 쓰이나
    1. 디바운스·스로틀, 자동 저장, 자동 로그아웃처럼 시간이 지나야 동작이 일어나는 코드를 결정적으로 검증할 때 사용한다.
    2. `Date.now()`나 `new Date()`에 의존하는 로직을 "시간이 흐르지 않은 상태"에서 검증하고 싶을 때도 자주 사용된다.
3. 특징/주의사항
    1. `vi.useFakeTimers()`를 호출하지 않은 채 `vi.advanceTimersByTime` 같은 메서드를 부르면 의미 있는 효과가 나지 않으니, 반드시 셋업 단계에서 먼저 전환해야 한다.
    2. `vi.useRealTimers()`를 빼먹으면 가짜 타이머 상태가 다른 테스트로 새어 들어가 디버깅하기 까다로운 실패가 일어날 수 있다.

### `vi.advanceTimersByTime` / `vi.advanceTimersByTimeAsync`

1. 무엇인가
    1. `vi.advanceTimersByTime(ms)`는 가짜 시계의 시간을 `ms` 만큼 앞으로 흘려, 그 사이에 등록되어 있던 타이머 콜백을 동기적으로 실행하는 함수이다.
    2. `vi.advanceTimersByTimeAsync(ms)`는 동일한 동작의 비동기 버전으로, `await` 하면 진행 중에 깨어난 `Promise`도 함께 흘러간다.
        
        ```tsx
        test('debounce: 200ms 안에 다시 호출되면 1번만 실행된다', () => {
          const cb = vi.fn()
          const debounced = debounce(cb, 200)
        
          debounced()
          vi.advanceTimersByTime(100)
          debounced()                  // 타이머 리셋
          vi.advanceTimersByTime(199)
          expect(cb).not.toHaveBeenCalled() // ✅ 아직 200ms를 못 채움
        
          vi.advanceTimersByTime(1)
          expect(cb).toHaveBeenCalledOnce() // ✅ 정확히 200ms 후 발화
        })
        
        test('비동기 polling 검증', async () => {
          const fetch = vi.fn().mockResolvedValue('ok')
          startPolling(fetch, 1000)
        
          await vi.advanceTimersByTimeAsync(3000) // ✅ 3초 진행, Promise도 풀림
          expect(fetch).toHaveBeenCalledTimes(3)
        })
        ```
        
2. 보통 어디에 쓰이나
    1. 디바운스·스로틀 동작이 "정확한 임계 시간에" 발화하는지 검증할 때 가장 표준적인 도구이다.
    2. `setInterval`로 동작하는 폴링·체크 로직에서 시간 흐름에 따른 호출 횟수를 검증할 때 사용한다.
3. 특징/주의사항
    1. 콜백 안에서 다시 `Promise`를 만들거나 `await` 하는 비동기 흐름이 있다면, 동기 버전(`advanceTimersByTime`)만으로는 그 마이크로태스크가 흘러가지 않으므로 `advanceTimersByTimeAsync`를 써야 한다.

### `vi.runAllTimers` / `vi.runOnlyPendingTimers` / `vi.advanceTimersToNextTimer`

1. 무엇인가
    1. 시간을 일일이 지정하지 않고, "타이머를 비울 때까지 한 번에 흘려보내는" 형태의 메서드들이다.
    2. `vi.runAllTimers()`는 현재 큐에 있는 모든 타이머 콜백을 발화시키며, 그 콜백이 새 타이머를 만들면 그것까지 이어서 발화시킨다.
    3. `vi.runOnlyPendingTimers()`는 "지금 시점에 이미 등록된 타이머"만 발화시키고, 발화 중 새로 등록된 타이머는 다음 호출 시까지 미룬다.
    4. `vi.advanceTimersToNextTimer()`는 다음으로 예정된 타이머 시점까지만 시간을 흘려 그 하나만 발화시킨다.
        
        ```tsx
        function executeEveryMinute(fn: () => void) {
          setInterval(fn, 1000 * 60)
        }
        
        test('타이머 한 번씩 진행', () => {
          const cb = vi.fn()
          executeEveryMinute(cb)
        
          vi.advanceTimersToNextTimer()
          expect(cb).toHaveBeenCalledTimes(1) // ✅ 첫 분
        
          vi.advanceTimersToNextTimer()
          expect(cb).toHaveBeenCalledTimes(2) // ✅ 두 번째 분
        })
        
        test('runAllTimers vs runOnlyPendingTimers', () => {
          const log: string[] = []
          setTimeout(() => {
            log.push('a')
            setTimeout(() => log.push('b'), 100) // 콜백이 새 타이머 등록
          }, 100)
        
          vi.runOnlyPendingTimers()
          expect(log).toEqual(['a']) // ✅ 처음 등록된 타이머만 발화
        
          vi.runAllTimers()
          expect(log).toEqual(['a', 'b']) // ✅ 그 사이 새로 생긴 타이머까지 모두 발화
        })
        ```
        
2. 보통 어디에 쓰이나
    1. "어쨌든 끝까지 흘려보내면 결과가 X여야 한다"는 식의 검증에 `runAllTimers`가 자연스럽다.
    2. `setInterval`처럼 한 번 발화하면 다음 타이머가 끝없이 생성되는 케이스에서는, 그대로 `runAllTimers`를 쓰면 무한 루프가 되므로 `runOnlyPendingTimers`로 한 번씩만 비우는 패턴을 쓴다.
3. 특징/주의사항
    1. `fakeTimers` 설정에 `loopLimit`(기본 10,000) 옵션이 있어, `runAllTimers`가 무한 큐에서 멈추지 않도록 안전장치를 두고 있다.

### `vi.setSystemTime` / `vi.getMockedSystemTime`

1. 무엇인가
    1. `vi.setSystemTime(date)`는 모킹된 시계의 "현재 시각"을 특정 `Date`로 고정시키는 함수이다.
    2. `vi.getMockedSystemTime()`은 현재 모킹된 시간을 반환하며, 모킹되어 있지 않으면 `null`을 돌려준다.
    3. 단독으로 호출해도 `Date`만 가짜로 바뀌지만, 일반적으로는 `vi.useFakeTimers()`와 짝지어 다른 타이머와 시간 흐름을 통합해서 다룬다.
        
        ```tsx
        test('setSystemTime으로 시간 고정', () => {
          vi.useFakeTimers()
          vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))
        
          expect(new Date().toISOString()).toBe('2024-01-01T00:00:00.000Z') // ✅
          expect(Date.now()).toBe(new Date('2024-01-01T00:00:00Z').valueOf()) // ✅
        
          vi.useRealTimers() // ✅ 복원
        })
        ```
        
2. 보통 어디에 쓰이나
    1. "오늘이 며칠인가"에 따라 결과가 달라지는 로직(연말정산, 만료일 계산, 캐시 키 생성 등)을 결정적으로 검증할 때 사용한다.
    2. 스냅샷·로그·이벤트 트래킹에 자동으로 들어가는 타임스탬프를 고정 값으로 만들 때도 자주 쓰인다.
3. 특징/주의사항
    1. 설정된 시간은 테스트가 끝나도 자동으로 풀리지 않으므로, `afterEach`에 `vi.useRealTimers()`(또는 다시 `setSystemTime`으로 원복)를 두어야 한다.

### `fakeTimers` 설정 (어떤 전역을 가짜로 만들지)

1. 무엇인가
    1. `vitest.config.ts`의 `test.fakeTimers.toFake` 배열로, `vi.useFakeTimers()`가 어떤 전역을 가짜로 만들지 골라낼 수 있다.
    2. 기본값은 `nextTick`과 `queueMicrotask`를 제외한 모든 시간 관련 전역(`setTimeout`, `setInterval`, `Date`, `performance` 등)이다.
        
        ```tsx
        // vitest.config.ts
        export default defineConfig({
          test: {
            fakeTimers: {
              toFake: ['setTimeout', 'clearTimeout', 'Date'], // ✅ 필요한 것만 모킹
              loopLimit: 5000,
            },
          },
        })
        ```
        
2. 보통 어디에 쓰이나
    1. 외부 라이브러리가 `requestAnimationFrame`이나 `performance`에 의존해 동작이 이상해질 때, 그 항목만 빼서 부작용을 줄이는 용도로 사용한다.
    2. Node 환경에서 `nextTick`을 가짜로 만들었다가 다른 라이브러리와 충돌이 날 때, 명시적으로 제외해 두면 안전하다.
3. 특징/주의사항
    1. 환경에 따라 일부 항목은 가짜로 만들 수 없거나(예: `--pool=forks`에서 `nextTick`) 부작용이 큰 항목이 있으므로, 기본값을 그대로 두는 편이 무난하고 필요할 때만 좁혀 사용한다.

## 12. 테스트 필터링·반복 수정자

1. 테스트 파일이 늘어나면 "이 테스트는 잠시 건너뛰고", "이 한 케이스만 디버깅하고", "여러 입력값으로 같은 검증을 반복하고" 같은 운영 요구가 따라온다.
2. Vitest는 `test`/`it`/`describe`에 점(`.`)으로 붙는 수정자들과 옵션 객체를 통해, 테스트 본문을 그대로 두고도 이런 운영을 표현할 수 있게 해 준다.
3. 크게 나누면 실행 제어(`.skip`, `.only`, `.todo`, `.fails`), 조건부 실행(`.skipIf`, `.runIf`), 병렬 실행(`.concurrent`), 그리고 데이터 기반 반복(`.each`, `.for`)으로 묶을 수 있다.
4. 이번 묶음에서 그 도구들을 차례로 정리한다.

### `.skip` / `.only` / `.todo`

1. 무엇인가
    1. `.skip`은 해당 테스트(또는 `describe` 블록)를 실행하지 않고 건너뛴다.
    2. `.only`는 정반대로, 해당 테스트만 실행하고 같은 파일의 다른 테스트를 모두 건너뛴다.
    3. `.todo`는 "아직 안 짠 테스트"를 자리만 비워 두는 용도로, 본문 없이 이름만 등록하면 리포트에 todo 항목으로 잡힌다.
        
        ```tsx
        import { test, describe } from 'vitest'
        
        test.skip('아직 깨진 케이스라 잠시 빼둔다', () => { /* ... */ })
        
        test.only('지금 디버깅 중인 테스트만 돌린다', () => { /* ✅ 이것만 실행 */ })
        
        test.todo('네거티브 케이스도 추가하기')
        
        describe.skip('전체 묶음 통째로 비활성화', () => {
          test('a', () => { /* 실행 안 됨 */ })
        })
        ```
        
        ```tsx
        // 옵션 객체 형태로도 동일하게 표현 가능
        test('skipped via options', { skip: true }, () => { /* ... */ })
        
        // 동적으로 skip하기
        test('runtime skip', (ctx) => {
          if (process.env.CI) ctx.skip()
          // ...
        })
        ```
        
2. 보통 어디에 쓰이나
    1. 회귀가 발생했지만 다른 작업 때문에 즉시 고치기 어려운 테스트를 `test.skip`으로 잠시 묶어 두고, 이슈 번호와 함께 남기는 패턴이 흔하다.
    2. 디버깅 단계에서는 `test.only`로 한 케이스만 빠르게 돌리고, 작업이 끝나면 반드시 다시 떼어야 한다.
    3. 기획·요구사항이 먼저 들어왔는데 구현은 나중에 할 때, `test.todo`로 이름만 등록해 두면 빠진 검증을 놓치지 않는다.
3. 특징/주의사항
    1. `test.only`를 PR에 그대로 남기면 다른 테스트가 통째로 실행되지 않으므로, 린트 규칙(예: `vitest/no-focused-tests`)으로 막아 두는 편이 안전하다.
    2. 동적 skip을 쓰면 "왜 이 환경에서 건너뛰는가"의 의도가 코드에 남으므로, 일관된 환경 조건이라면 다음에 나오는 `skipIf`/`runIf`가 더 명시적이다.

### `.skipIf` / `.runIf`

1. 무엇인가
    1. `.skipIf(condition)`은 조건이 truthy일 때 해당 테스트를 건너뛰는 수정자이다.
    2. `.runIf(condition)`은 그 반대로, 조건이 truthy일 때만 테스트를 실행한다.
        
        ```tsx
        const isCI = !!process.env.CI
        const isDev = process.env.NODE_ENV === 'development'
        
        test.skipIf(isCI)('로컬에서만 의미 있는 인터랙티브 테스트', () => {
          // ✅ CI에서는 자동 skip
        })
        
        test.runIf(isDev)('개발 환경에서만 동작하는 디버그 훅 검증', () => {
          // ✅ 그 외 환경에서는 자동 skip
        })
        ```
        
2. 보통 어디에 쓰이나
    1. CI 환경에서만 외부 의존이 막혀서 돌릴 수 없는 테스트(또는 그 반대로 CI에서만 의미 있는 테스트)를 분기할 때 사용한다.
    2. OS별 동작이 다른 코드, 특정 Node 버전에서만 동작하는 API 검증 등을 조건부로 켜고 끄는 용도로도 자연스럽다.
3. 특징/주의사항
    1. 조건은 모듈 로드 시점에 평가되므로, 런타임에 바뀌는 상태(테스트 내부 변수 등)에는 적합하지 않다. 그런 경우에는 동적 `ctx.skip()`이 맞다.

### `.fails`

1. 무엇인가
    1. `.fails`는 "이 테스트는 의도적으로 실패해야 통과로 본다"는 의미의 수정자이다.
    2. 즉 본문이 실제로 실패(어설션 실패 또는 throw)해야 테스트가 통과로 기록되고, 통과해 버리면 오히려 실패로 보고된다.
        
        ```tsx
        test.fails('잘못된 입력으로 호출하면 실패해야 한다', () => {
          expect(divide(1, 0)).toBe(Infinity) // ❌ divide가 throw 하면 어설션 실패 → .fails로는 ✅
        })
        ```
        
2. 보통 어디에 쓰이나
    1. 회귀로 인해 통과하면 안 되는 동작을 잠시 표시하거나, 아직 미구현인 동작을 "현재 실패 상태"로 명시적으로 잡아 둘 때 사용한다.
    2. 사용 빈도가 매우 높지는 않고, 보통 `test.todo`나 `expect(...).toThrow(...)` 같은 표현이 더 직관적이라 그쪽을 우선 시도하는 편이 좋다.
3. 특징/주의사항
    1. 본문이 우연히 통과하면 테스트가 실패로 뒤집히므로, 단순히 "지금 깨진 테스트를 가리고 싶다"는 용도로는 적합하지 않다. 그 용도는 `test.skip` + 이슈 번호 주석이 더 안전하다.

### `.concurrent`

1. 무엇인가
    1. `.concurrent`는 같은 파일 안의 테스트들을 병렬로 실행하게 만드는 수정자이다.
    2. `describe.concurrent`를 쓰면 그 묶음 안의 모든 테스트가 병렬로 실행되고, 개별 `test.concurrent`만 표시하면 해당 테스트만 다른 동시 테스트와 병렬로 돈다.
        
        ```tsx
        describe('병렬 실행 묶음', () => {
          test('serial', async () => { /* 다른 serial과 순차 실행 */ })
        
          test.concurrent('A', async ({ expect }) => {
            // ✅ 병렬 테스트에서는 컨텍스트의 expect를 사용해야 안전하다
            expect(await fetchA()).toBe('a')
          })
        
          test.concurrent('B', async ({ expect }) => {
            expect(await fetchB()).toBe('b')
          })
        })
        ```
        
2. 보통 어디에 쓰이나
    1. 외부 네트워크처럼 I/O 대기 시간이 큰 테스트들을 병렬로 돌려, 한 파일의 총 실행 시간을 줄일 때 사용한다.
    2. 검증 대상 사이에 공유 상태가 없는 경우에 안전하게 들어맞는다.
3. 특징/주의사항
    1. 병렬 테스트가 같은 mock·전역 상태를 공유하면 서로 간섭이 일어나므로, `vi.fn`·`vi.spyOn`·`vi.setSystemTime` 등을 쓰는 테스트에는 신중하게 적용해야 한다.
    2. 공식 가이드는 병렬 테스트에서는 글로벌 `expect` 대신 콜백 인자의 `expect`(테스트 컨텍스트)를 쓸 것을 권장한다.

### `.each`

1. 무엇인가
    1. `.each`는 데이터 테이블을 받아, 각 행마다 같은 테스트 본문을 반복 실행해 주는 수정자이다.
    2. 가장 흔한 형태는 배열-of-배열을 넘기는 방식이며, 본문은 각 행의 원소들을 인자로 받는다.
    3. 테스트 이름의 `%s`, `%d`, `%i`, `%o` 같은 placeholder는 각 행의 값으로 치환된다.
        
        ```tsx
        test.each([
          [1, 1, 2],
          [2, 3, 5],
          [10, 20, 30],
        ])('add(%i, %i) === %i', (a, b, expected) => {
          expect(add(a, b)).toBe(expected) // ✅ 세 케이스 모두 검증
        })
        
        // 객체 테이블도 가능
        test.each([
          { input: '', expected: false },
          { input: 'a', expected: true },
          { input: 'abc', expected: true },
        ])('isNonEmpty("$input") === $expected', ({ input, expected }) => {
          expect(isNonEmpty(input)).toBe(expected) // ✅
        })
        
        // describe.each로 묶음 전체를 반복
        describe.each([
          { role: 'admin', canDelete: true },
          { role: 'user', canDelete: false },
        ])('권한: $role', ({ role, canDelete }) => {
          test('삭제 권한', () => {
            expect(can(role, 'delete')).toBe(canDelete) // ✅
          })
        })
        ```
        
2. 보통 어디에 쓰이나
    1. 같은 함수에 대해 여러 입력-출력 쌍을 검증할 때(테이블 드리븐 테스트), 같은 코드를 여러 번 복붙하는 대신 한 테이블로 묶어 표현한다.
    2. 권한·역할·국가 코드처럼 분기가 많은 케이스를 한 곳에서 가독성 좋게 정리하는 데 잘 어울린다.
3. 특징/주의사항
    1. 테이블 데이터가 길어지면 테스트 이름에 어떤 값이 들어가는지가 가독성에 결정적이므로, `%i`·`$key` placeholder를 적극적으로 활용하는 편이 좋다.
    2. 비대칭 매처나 동적 데이터(예: `Date.now()`)를 테이블 안에 직접 넣으면 모든 행이 같은 값을 공유하게 되니, 동적 값은 본문 안에서 만들어야 한다.

### `.for`

1. 무엇인가
    1. `.for`는 `.each`와 같은 데이터 기반 반복 수정자이지만, 두 번째 인자로 테스트 컨텍스트(`{ expect, ... }`)를 함께 받는 새로운 형태이다.
    2. 즉 행 데이터와 컨텍스트가 분리되어 들어오므로, 병렬 테스트나 픽스처를 쓰는 환경에서 더 안전하게 사용할 수 있다.
        
        ```tsx
        test.for([
          [1, 1, 2],
          [2, 3, 5],
        ])('add(%i, %i) === %i', ([a, b, expected], { expect }) => {
          expect(add(a, b)).toBe(expected) // ✅ 컨텍스트의 expect로 검증
        })
        ```
        
2. 보통 어디에 쓰이나
    1. `test.concurrent.for`처럼 병렬·반복을 동시에 적용하는 경우에 자연스럽다.
    2. `test.extend`로 정의한 픽스처와 테이블 반복을 함께 써야 하는 시나리오에서, 컨텍스트를 명시적으로 받아 쓸 수 있어 안전하다.
3. 특징/주의사항
    1. 단순한 테이블 반복만 필요하다면 기존 `.each`로 충분하며, `.for`는 컨텍스트를 같이 쓰는 케이스에서 가치를 가진다.

## 13. 스냅샷 — `toMatchSnapshot` 계열

1. 지금까지의 매처는 "정확히 어떤 값이어야 한다"를 코드로 명시했지만, UI 출력·복잡한 객체·렌더 결과처럼 형태가 크고 자주 바뀌는 결과를 매번 손으로 적기는 부담스럽다.
2. 스냅샷 테스트는 처음 실행 시 결과를 그대로 저장해 두고, 다음 실행부터는 저장된 결과와 비교해 차이가 있으면 실패로 보고하는 방식이다.
3. 저장 위치에 따라 별도 파일에 두는 `toMatchSnapshot`, 테스트 파일 안에 박아 두는 `toMatchInlineSnapshot`, 임의 확장자의 외부 파일에 두는 `toMatchFileSnapshot`으로 나뉜다.
4. 예외 메시지·에러 객체 같은 throw 결과를 같은 방식으로 검증하기 위한 `toThrowErrorMatchingSnapshot` / `toThrowErrorMatchingInlineSnapshot`도 함께 제공된다.
5. 직렬화는 `@vitest/pretty-format`이 처리하며, 변경된 스냅샷은 `vitest -u`(또는 watch 모드에서 `u` 키)로 갱신한다.

### toMatchSnapshot

1. 무엇인가
    1. `toMatchSnapshot`은 검증 대상 값을 직렬화해 별도의 `.snap` 파일에 저장하고, 다음 실행부터 그 파일과 비교하는 매처이다.
    2. 처음 실행되면 `__snapshots__/<파일명>.snap`에 결과가 기록되고, 이후 실행은 저장된 내용과 일치해야 통과한다.
    3. 저장된 스냅샷은 코드와 함께 커밋해 코드 리뷰의 일부로 검토하는 것이 표준이다.
        
        ```tsx
        import { test, expect } from 'vitest'
        
        test('객체 스냅샷', () => {
          const data = { foo: { x: 1, y: 2 } }
          expect(data).toMatchSnapshot() // ✅ 첫 실행 시 .snap 파일 생성, 이후 비교
        })
        
        // __snapshots__/foo.test.ts.snap
        // exports[`객체 스냅샷 1`] = `
        // {
        //   "foo": {
        //     "x": 1,
        //     "y": 2,
        //   },
        // }
        // `
        ```
        
2. 보통 어디에 쓰이나
    1. 변경이 잦지 않은 객체·DOM 구조·렌더링 결과처럼, "한 번 정해 두고 의도치 않은 변경이 일어났는지" 감시해야 하는 대상에 적합하다.
    2. API 응답 포맷이나 직렬화 결과의 회귀를 막는 안전망으로도 자주 쓰인다.
3. 특징/주의사항
    1. 스냅샷이 깨졌을 때는 두 가지 가능성이 있다. 실제 회귀라면 코드를 고치고, 의도된 변경이라면 `vitest -u`(또는 watch 모드의 `u` 키)로 스냅샷을 갱신한다.
    2. 너무 큰 객체나 가변 필드(타임스탬프·랜덤 ID)를 그대로 스냅샷하면 의미 없는 diff가 자주 발생하므로, 가변 부분은 비대칭 매처 또는 직렬화 옵션으로 정리해야 한다.

### toMatchInlineSnapshot

1. 무엇인가
    1. `toMatchInlineSnapshot`은 별도 파일 대신 테스트 파일 자체에 스냅샷을 박아 두는 매처이다.
    2. 처음 실행되면 Vitest가 테스트 파일을 직접 수정해 매처 호출 자리에 직렬화 결과 문자열을 삽입한다.
    3. 결과가 테스트 코드 옆에 그대로 보이므로, "기대 출력"을 따로 파일로 열어보지 않아도 한눈에 확인할 수 있다.
        
        ```tsx
        test('대문자 변환', () => {
          const result = toUpperCase('foobar')
          expect(result).toMatchInlineSnapshot(`"FOOBAR"`) // ✅ 처음 실행 시 자동 삽입
        })
        
        test('객체도 가능', () => {
          expect({ a: 1, b: [2, 3] }).toMatchInlineSnapshot(`
            {
              "a": 1,
              "b": [
                2,
                3,
              ],
            }
          `)
        })
        ```
        
2. 보통 어디에 쓰이나
    1. 작은 출력값(짧은 문자열, 간단한 객체)을 검증할 때 가독성이 가장 좋다.
    2. `.snap` 파일을 따로 관리하지 않아도 되므로, 신규 코드에서 빠르게 명세를 잡을 때 자주 쓰인다.
3. 특징/주의사항
    1. 스냅샷 내용이 길어지면 테스트 파일 자체가 비대해지므로, 큰 출력에는 `toMatchSnapshot` 또는 `toMatchFileSnapshot`이 더 적합하다.
    2. Prettier 같은 포매터가 인라인 스냅샷 문자열을 건드리지 않도록 설정해 두어야, 갱신 시 충돌이 생기지 않는다.

### toMatchFileSnapshot

1. 무엇인가
    1. `toMatchFileSnapshot(path)`는 `.snap` 형식 대신 임의 경로·임의 확장자의 외부 파일과 비교하는 매처이다.
    2. HTML·JSON·SVG 같은 결과를 그 형식 그대로의 확장자에 저장할 수 있어, 에디터 문법 강조나 미리보기가 가능해진다.
    3. 파일 시스템 접근이 들어가므로 `Promise`를 반환하며, 반드시 `await`을 붙여야 한다.
        
        ```tsx
        import { it, expect } from 'vitest'
        
        it('HTML 렌더 결과를 별도 .html 파일과 비교', async () => {
          const result = renderHTML(h('div', { class: 'foo' }))
        
          await expect(result).toMatchFileSnapshot('./test/basic.output.html') // ✅
        })
        ```
        
2. 보통 어디에 쓰이나
    1. 렌더링된 HTML 마크업, 빌드 산출물, 변환된 JSON 등 큰 출력물을 도메인 확장자로 따로 두고 검증할 때 적합하다.
    2. 디자이너·기획자가 함께 결과를 확인해야 하는 경우, 문법 강조가 살아 있는 외부 파일이 협업에 유리하다.
3. 특징/주의사항
    1. `await`을 빠뜨리면 Vitest는 `expect.soft`처럼 처리해 뒷줄이 계속 실행되며, 최종적으로 불일치가 발견되면 그제야 테스트가 실패한다. 명시적으로 `await`을 붙이는 편이 의도가 분명하다.

### `toThrowErrorMatchingSnapshot` / `toThrowErrorMatchingInlineSnapshot`

1. 무엇인가
    1. 두 매처는 `toThrow`의 스냅샷 버전으로, 함수가 던진 에러의 메시지·구조를 그대로 스냅샷에 저장한다.
    2. `toThrowErrorMatchingSnapshot`은 별도 파일에, `toThrowErrorMatchingInlineSnapshot`은 테스트 코드 안에 결과를 박아 둔다.
        
        ```tsx
        function loadConfig() {
          throw new Error('config file not found: /etc/app.yml')
        }
        
        test('에러 메시지를 스냅샷으로 잡는다', () => {
          expect(() => loadConfig()).toThrowErrorMatchingInlineSnapshot(
            `[Error: config file not found: /etc/app.yml]`
          ) // ✅
        })
        ```
        
2. 보통 어디에 쓰이나
    1. 에러 메시지 포맷이 사용자에게 그대로 노출되는 경우(CLI·SDK·라이브러리), 메시지가 의도치 않게 바뀌었는지 감시하는 용도로 쓴다.
    2. 입력 검증 실패처럼 표준화된 에러 메시지가 중요한 도메인의 회귀 방지에 적합하다.
3. 특징/주의사항
    1. 메시지에 가변 값(타임스탬프, 절대 경로 등)이 섞이면 스냅샷이 자주 깨지므로, 메시지 자체를 가공해 던지거나 비대칭 매처 기반의 `toThrow`로 대체하는 편이 안정적인 경우가 많다.

## 14. 부가 스텁 — `vi.stubGlobal` / `vi.stubEnv`

1. 모킹·스파이로도 다루기 애매한 영역이 두 군데 남는데, 하나는 전역 객체(`window.innerWidth`, `IntersectionObserver`, `fetch` 등)이고 다른 하나는 환경 변수(`process.env`, `import.meta.env`)이다.
2. 이 둘을 직접 할당해서 바꿔도 동작은 하지만, 테스트가 끝난 뒤 원래 값으로 자동 복구되지 않아 다른 테스트로 누수되기 쉽다.
3. Vitest는 이런 상태 변경을 안전하게 등록·복구할 수 있도록 `vi.stubGlobal`, `vi.stubEnv`와 그 쌍이 되는 `vi.unstubAllGlobals`, `vi.unstubAllEnvs`를 제공한다.

### `vi.stubGlobal` / `vi.unstubAllGlobals`

1. 무엇인가
    1. `vi.stubGlobal(name, value)`은 `globalThis`(jsdom/happy-dom 환경이면 `window`도 함께)에 지정한 이름의 값을 끼워 넣는 함수이다.
    2. 첫 호출 시 Vitest가 원래 값을 기억해 두고, `vi.unstubAllGlobals()`가 호출되면 그 값으로 한 번에 복구한다.
    3. 자동 복구를 원하면 설정의 `test.unstubGlobals: true`를 켜거나, `beforeEach`/`afterEach`에서 직접 `vi.unstubAllGlobals()`를 호출한다.
        
        ```tsx
        import { vi, test, expect, afterEach } from 'vitest'
        
        afterEach(() => {
          vi.unstubAllGlobals() // ✅ 매 테스트 후 원래 전역으로 복구
        })
        
        test('innerWidth 모킹', () => {
          vi.stubGlobal('innerWidth', 1024)
          expect(window.innerWidth).toBe(1024)     // ✅
          expect(globalThis.innerWidth).toBe(1024) // ✅
        })
        
        test('jsdom에 없는 전역도 채워 넣을 수 있다', () => {
          const Mock = vi.fn()
          vi.stubGlobal('IntersectionObserver', Mock)
          expect(IntersectionObserver).toBe(Mock) // ✅
        })
        ```
        
2. 보통 어디에 쓰이나
    1. jsdom·happy-dom에 기본 제공되지 않는 브라우저 API(`IntersectionObserver`, `ResizeObserver`, `matchMedia` 등)를 mock 함수로 채워 넣을 때 가장 자주 쓰인다.
    2. `window.innerWidth`처럼 반응형 로직이 의존하는 값을 케이스별로 다르게 설정해 검증할 때도 자연스럽다.
3. 특징/주의사항
    1. 직접 `globalThis.x = ...`로 할당해도 값은 바뀌지만, 그렇게 하면 `vi.unstubAllGlobals`로 자동 복구되지 않는다. 복구 의도가 있다면 반드시 `vi.stubGlobal`을 거쳐야 한다.
    2. 비동기 동시 테스트(`test.concurrent`)와 `unstubGlobals: true`를 함께 쓰면, 한 테스트의 종료가 다른 테스트의 전역 상태까지 되돌려 버릴 수 있어 충돌이 생긴다. 둘을 같이 쓸 때는 주의가 필요하다.

### `vi.stubEnv` / `vi.unstubAllEnvs`

1. 무엇인가
    1. `vi.stubEnv(name, value)`는 `process.env`와 `import.meta.env` 양쪽에 같은 값을 끼워 넣는 함수이다.
    2. 첫 호출 시 원래 값을 기억해 두고, `vi.unstubAllEnvs()`가 호출되면 처음 stub 직전의 값으로 한 번에 복구한다.
    3. 자동 복구가 필요하면 설정의 `test.unstubEnvs: true`를 켜거나, `beforeEach`/`afterEach`에서 직접 `vi.unstubAllEnvs()`를 호출한다.
        
        ```tsx
        import { vi, test, expect, afterEach } from 'vitest'
        
        afterEach(() => {
          vi.unstubAllEnvs() // ✅ 매 테스트 후 원래 env 복구
        })
        
        test('NODE_ENV를 production으로 가짜 설정', () => {
          vi.stubEnv('NODE_ENV', 'production')
        
          expect(process.env.NODE_ENV).toBe('production')     // ✅
          expect(import.meta.env.NODE_ENV).toBe('production') // ✅
        })
        
        test('환경별 분기 검증', () => {
          vi.stubEnv('NODE_ENV', 'staging')
          expect(getApiBase()).toBe('https://staging.api.example.com') // ✅
        })
        ```
        
2. 보통 어디에 쓰이나
    1. `NODE_ENV`, `VITE_API_URL`처럼 환경 변수에 따라 분기되는 코드를, 각 환경별로 케이스를 갈라 검증할 때 사용한다.
    2. 기능 토글이나 빌드 시점 플래그(`__VERSION__`, `import.meta.env.FEATURE_X`)의 분기 동작을 한 테스트 안에서 모두 다뤄야 할 때 적합하다.
3. 특징/주의사항
    1. `process.env.NODE_ENV = 'production'`처럼 직접 할당해도 값은 바뀌지만, 그 경우 `vi.unstubAllEnvs`로 자동 복구되지 않으므로 일관성 유지를 위해 `vi.stubEnv`를 쓰는 편이 좋다.
    2. 환경 변수는 모듈이 처음 로드되는 시점의 값을 캐싱해 두는 코드가 많기 때문에, 변경 후 동작을 보려면 모듈을 다시 import 하거나 `vi.resetModules()`로 캐시를 비워야 할 수 있다.