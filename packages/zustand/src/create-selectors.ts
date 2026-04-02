import type { StoreApi, UseBoundStore } from "zustand";

type StoreState<TStore> = TStore extends { getState: () => infer TState } ? TState : never;

export type WithSelectors<TStore extends UseBoundStore<StoreApi<object>>> = TStore & {
  use: {
    [Key in keyof StoreState<TStore>]: () => StoreState<TStore>[Key];
  };
};

export function createSelectors<TStore extends UseBoundStore<StoreApi<object>>>(
  store: TStore
): WithSelectors<TStore> {
  const storeWithSelectors = store as WithSelectors<TStore>;
  storeWithSelectors.use = {} as WithSelectors<TStore>["use"];

  const state = store.getState() as Record<string, unknown>;
  Object.keys(state).forEach((key) => {
    (storeWithSelectors.use as Record<string, () => unknown>)[key] = () =>
      store((currentState) => (currentState as Record<string, unknown>)[key]);
  });

  return storeWithSelectors;
}
