const CHOSUNG = [
  "ㄱ",
  "ㄲ",
  "ㄴ",
  "ㄷ",
  "ㄸ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅃ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅉ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ"
];
const UNICODE_INITIAL = 44032; // '가'의 유니코드 값
const CHOSUNG_UNICODE = 588; // 초성 한글 유니코드 값 차이

/**
 * 주어진 한글 문자열의 각 글자를 초성으로 변환합니다.
 * @param {string} text - 초성으로 변환할 한글 문자열
 * @returns {string} 각 문자의 초성으로 변환된 문자열
 */
export const convertToChosung = (text: string) =>
  text
    .split("") // 문자열을 한 글자씩 분리하여 배열로 변환
    .map((char) => {
      const unicode = char.charCodeAt(0); // 글자의 유니코드 값을 가져옴
      if (unicode >= 44032 && unicode <= 55199) {
        // 해당 글자가 한글 범위 내에 있는지 확인
        const cho = CHOSUNG[Math.floor((unicode - UNICODE_INITIAL) / CHOSUNG_UNICODE)]; // 초성을 구함
        return cho; // 해당 글자의 초성 반환
      }
      return char; // 한글이 아니면 그대로 반환
    })
    .join(""); // 초성으로 변환된 배열을 문자열로 합쳐 반환
