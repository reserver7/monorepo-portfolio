import localFont from "next/font/local";

export const appFont = localFont({
  src: [
    {
      path: "./fonts/PretendardVariable.woff2",
      weight: "100 900",
      style: "normal"
    }
  ],
  display: "swap",
  fallback: ["Noto Sans KR", "Segoe UI", "Malgun Gothic", "sans-serif"]
});
