export const styleFn = (name: string, value: number | string | undefined) => {
  if (typeof value === "undefined") return {}; // 값이 없는 경우 빈 객체 반환

  if (typeof value === "number") {
    return { [name]: `${value}px` }; // 숫자인 경우 px 단위로 변환하여 객체로 반환
  }

  return { [name]: value }; // 문자열인 경우 해당 값으로 객체를 반환
};
