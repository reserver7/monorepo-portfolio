import type { StateCreator, StoreApi } from "zustand";

type SetState<TState extends object> = StoreApi<TState>["setState"];
type GetState<TState extends object> = StoreApi<TState>["getState"];

export type StoreSliceCreator<TState extends object, TSlice extends object = Partial<TState>> = (
  set: SetState<TState>,
  get: GetState<TState>,
  api: StoreApi<TState>
) => TSlice;

export const createStoreSlices = <TState extends object>(
  ...slices: Array<StoreSliceCreator<TState>>
): StateCreator<TState, [], []> => {
  return (set, get, api) => {
    const merged = slices.reduce(
      (acc, createSlice) => Object.assign(acc, createSlice(set, get, api)),
      {} as Record<string, unknown>
    );
    return merged as TState;
  };
};
