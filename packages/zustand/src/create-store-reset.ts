import type { StoreApi, UseBoundStore } from "zustand";

export const createStoreReset = <TState extends object>(
  store: UseBoundStore<StoreApi<TState>>
) => {
  const fallbackInitialState = store.getState();

  return () => {
    const initialState =
      "getInitialState" in store && typeof store.getInitialState === "function"
        ? store.getInitialState()
        : fallbackInitialState;
    store.setState(initialState, true);
  };
};
