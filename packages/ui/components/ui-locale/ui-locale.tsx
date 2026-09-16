"use client";

import * as React from "react";

type UiLocale = "ko" | "en" | "ja";

const UI_LABELS = {
  ko: {
    clearInput: "입력값 비우기",
    clearDate: "선택한 날짜 지우기",
    startTime: "시작 시간",
    endTime: "종료 시간",
    time: "시간",
    loading: "불러오는 중…",
    selectAll: "전체 선택",
    clearAll: "전체 해제",
    required: "필수 입력 항목",
    requiredCheck: "필수 체크 항목",
    requiredSetting: "필수 설정 항목",
    retry: "다시 시도",
    reload: "새로고침",
    home: "홈으로",
    errorDetails: "개발용 오류 상세",
    closeSidebar: "사이드바 닫기",
    toggleSidebar: "사이드바 접기/펼치기",
    openSidebar: "사이드바 열기"
  },
  en: {
    clearInput: "Clear input",
    clearDate: "Clear selected date",
    startTime: "Start time",
    endTime: "End time",
    time: "Time",
    loading: "Loading…",
    selectAll: "Select all",
    clearAll: "Clear all",
    required: "Required field",
    requiredCheck: "Required checkbox",
    requiredSetting: "Required setting",
    retry: "Try again",
    reload: "Reload",
    home: "Go home",
    errorDetails: "Developer error details",
    closeSidebar: "Close sidebar",
    toggleSidebar: "Collapse/expand sidebar",
    openSidebar: "Open sidebar"
  },
  ja: {
    clearInput: "入力をクリア",
    clearDate: "選択した日付をクリア",
    startTime: "開始時刻",
    endTime: "終了時刻",
    time: "時刻",
    loading: "読み込み中…",
    selectAll: "すべて選択",
    clearAll: "すべて解除",
    required: "必須項目",
    requiredCheck: "必須チェック項目",
    requiredSetting: "必須設定項目",
    retry: "再試行",
    reload: "再読み込み",
    home: "ホームへ",
    errorDetails: "開発者向けエラー詳細",
    closeSidebar: "サイドバーを閉じる",
    toggleSidebar: "サイドバーを折りたたむ/展開",
    openSidebar: "サイドバーを開く"
  }
} as const;

type UiLabels = (typeof UI_LABELS)[UiLocale];
const UiLocaleContext = React.createContext<UiLabels>(UI_LABELS.en);

export function UiLocaleProvider({ locale, children }: React.PropsWithChildren<{ locale?: string }>) {
  const labels = UI_LABELS[locale as UiLocale] ?? UI_LABELS.en;
  return <UiLocaleContext.Provider value={labels}>{children}</UiLocaleContext.Provider>;
}

export function useUiLocale(): UiLabels {
  return React.useContext(UiLocaleContext);
}

export type { UiLabels, UiLocale };
