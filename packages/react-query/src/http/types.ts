export type BaseResponseDef = {
  state: boolean;
  code: string;
  message: string;
  response?: boolean;
};

export type ResultResponseDef<T> = {
  result: T;
};

export type BaseResponseProps<T> = BaseResponseDef & ResultResponseDef<T>;
