import { create, type StateCreator, type StoreApi, type UseBoundStore } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

export interface PersistStoreOptions<TState extends object> {
  key: string;
  version?: number;
  partialize?: (state: TState) => Partial<TState>;
}

export interface CreateAppStoreOptions<TState extends object> {
  name?: string;
  devtools?: boolean;
  persist?: PersistStoreOptions<TState>;
}

export function createAppStore<TState extends object>(
  initializer: StateCreator<TState, [], []>,
  options: CreateAppStoreOptions<TState> = {}
): UseBoundStore<StoreApi<TState>> {
  let wrapped = initializer as StateCreator<TState, [], []>;

  if (options.persist) {
    wrapped = persist(wrapped, {
      name: options.persist.key,
      version: options.persist.version ?? 1,
      partialize: options.persist.partialize,
      storage: createJSONStorage(() => localStorage)
    }) as unknown as StateCreator<TState, [], []>;
  }

  if (options.devtools !== false) {
    wrapped = devtools(wrapped, { name: options.name }) as unknown as StateCreator<TState, [], []>;
  }

  return create<TState>()(wrapped);
}

