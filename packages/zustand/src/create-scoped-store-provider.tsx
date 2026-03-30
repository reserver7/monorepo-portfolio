"use client";

import { createContext, type PropsWithChildren, useContext, useRef } from "react";
import { type StoreApi, type UseBoundStore, useStore } from "zustand";

export type ScopedStoreProviderProps = PropsWithChildren;

export function createScopedStoreProvider<TState extends object>(
  createStore: () => UseBoundStore<StoreApi<TState>>,
  options?: { displayName?: string }
) {
  const StoreContext = createContext<UseBoundStore<StoreApi<TState>> | null>(null);
  StoreContext.displayName = options?.displayName ?? "ScopedStoreContext";

  function Provider({ children }: ScopedStoreProviderProps) {
    const storeRef = useRef<UseBoundStore<StoreApi<TState>> | null>(null);

    if (!storeRef.current) {
      storeRef.current = createStore();
    }

    return <StoreContext.Provider value={storeRef.current}>{children}</StoreContext.Provider>;
  }

  function useScopedStore<Selected>(selector: (state: TState) => Selected): Selected {
    const store = useContext(StoreContext);

    if (!store) {
      throw new Error(`${StoreContext.displayName}: Provider가 필요합니다.`);
    }

    return useStore(store, selector);
  }

  function useScopedStoreApi(): UseBoundStore<StoreApi<TState>> {
    const store = useContext(StoreContext);

    if (!store) {
      throw new Error(`${StoreContext.displayName}: Provider가 필요합니다.`);
    }

    return store;
  }

  return {
    Provider,
    useScopedStore,
    useScopedStoreApi
  };
}
