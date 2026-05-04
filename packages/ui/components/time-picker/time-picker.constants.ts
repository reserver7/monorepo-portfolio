export const TIME_PICKER_DEFAULTS = {
  format: "HH:mm:ss",
  use12Hours: false,
  showSeconds: true,
  hourStep: 1,
  minuteStep: 1,
  secondStep: 1,
  hideDisabledOptions: false,
  needConfirm: true,
  showNow: true,
  changeOnScroll: false,
  placement: "bottomLeft",
  allowClear: true,
  clearable: true,
  placeholder: "Select time"
} as const;
