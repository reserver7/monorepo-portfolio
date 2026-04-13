# @repo/zustand

실무형 Zustand 공통 유틸 패키지입니다.

## 제공 기능

- `createAppStore`: devtools/persist 옵션 통합 스토어 생성
- `createStoreSlices`: 슬라이스 조합으로 큰 스토어 분리
- `createStoreReset`: 스토어 초기 상태 리셋 헬퍼
- `createSelectors`: `store.use.xxx()` 형태 선택자 생성
- `createScopedStoreProvider`: 스코프 스토어 Provider 생성

## 예시

```ts
import { createAppStore, createStoreReset, createStoreSlices } from "@repo/zustand";

type CounterState = {
  count: number;
  inc: () => void;
};

const counterSlice = createStoreSlices<CounterState>((set) => ({
  count: 0,
  inc: () => set((state) => ({ count: state.count + 1 }))
}));

const useCounterStore = createAppStore(counterSlice, { name: "counter" });
export const resetCounterStore = createStoreReset(useCounterStore);
```
