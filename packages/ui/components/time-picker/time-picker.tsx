"use client";

import * as React from "react";
import { Controller } from "react-hook-form";
import { Check, Clock3 } from "lucide-react";
import { cn } from "../cn";
import { Box } from "../box";
import { Button } from "../button";
import { Input } from "../input";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { ScrollArea } from "../scroll-area";
import { INPUT_DEFAULTS } from "../input/input.constants";
import type {
  DisabledTimeConfig,
  TimeFormat,
  TimePickerProps,
  TimeRangePickerProps,
  TimeRangeValue
} from "./time-picker.types";
import { TIME_PICKER_DEFAULTS } from "./time-picker.constants";

type ParsedTime = { hour: number; minute: number; second: number };

type InputVariantCompat = "default" | "outline" | "filled" | "ghost";
type InputStatusCompat = "default" | "error" | "success";

const placementMap = {
  bottomLeft: { side: "bottom", align: "start" },
  bottomRight: { side: "bottom", align: "end" },
  topLeft: { side: "top", align: "start" },
  topRight: { side: "top", align: "end" }
} as const;

const variantMap = {
  outlined: "default",
  filled: "filled",
  borderless: "ghost",
  underlined: "default",
  default: "default",
  outline: "outline",
  ghost: "ghost"
} as const;

const statusMap = {
  error: "error",
  warning: "default",
  success: "success",
  validating: "default",
  default: "default"
} as const;

const rangeHeightMap = {
  sm: "h-[var(--size-control-md)]",
  md: "h-[var(--size-control-xl)]",
  lg: "h-[var(--size-control-2xl)]"
} as const;

const pad2 = (value: number) => String(value).padStart(2, "0");

const toChangeEvent = (nextValue: string, id?: string, name?: string) =>
  ({
    target: { value: nextValue, id, name },
    currentTarget: { value: nextValue, id, name }
  }) as React.ChangeEvent<HTMLInputElement>;

const buildValues = (max: number, step: number) => {
  const result: number[] = [];
  const safeStep = Math.max(1, step);
  for (let index = 0; index <= max; index += safeStep) result.push(index);
  return result;
};

const parseTime = (value: string | undefined, use12Hours: boolean): ParsedTime | null => {
  if (!value || value.trim().length === 0) return null;
  const text = value.trim();

  if (use12Hours) {
    const twelve = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s?(AM|PM)$/i);
    if (!twelve) return null;
    const rawHour = Number(twelve[1] ?? 0);
    const minute = Number(twelve[2] ?? 0);
    const second = Number(twelve[3] ?? 0);
    const meridiem = (twelve[4] ?? "AM").toUpperCase();
    if (!Number.isInteger(rawHour) || rawHour < 1 || rawHour > 12) return null;
    if (!Number.isInteger(minute) || minute < 0 || minute > 59) return null;
    if (!Number.isInteger(second) || second < 0 || second > 59) return null;
    let hour = rawHour % 12;
    if (meridiem === "PM") hour += 12;
    return { hour, minute, second };
  }

  const twentyFour = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!twentyFour) return null;
  const hour = Number(twentyFour[1] ?? 0);
  const minute = Number(twentyFour[2] ?? 0);
  const second = Number(twentyFour[3] ?? 0);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return null;
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) return null;
  if (!Number.isInteger(second) || second < 0 || second > 59) return null;
  return { hour, minute, second };
};

const formatTime = (value: ParsedTime, format: TimeFormat, use12Hours: boolean) => {
  const hour = Math.max(0, Math.min(23, value.hour));
  const minute = Math.max(0, Math.min(59, value.minute));
  const second = Math.max(0, Math.min(59, value.second));
  const withSeconds = format.includes("ss");

  if (use12Hours || format.includes("h:mm")) {
    const meridiem = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return withSeconds ? `${hour12}:${pad2(minute)}:${pad2(second)} ${meridiem}` : `${hour12}:${pad2(minute)} ${meridiem}`;
  }

  return withSeconds ? `${pad2(hour)}:${pad2(minute)}:${pad2(second)}` : `${pad2(hour)}:${pad2(minute)}`;
};

const toTotalSeconds = (text?: string, use12Hours?: boolean) => {
  const parsed = parseTime(text, Boolean(use12Hours));
  if (!parsed) return null;
  return parsed.hour * 3600 + parsed.minute * 60 + parsed.second;
};

const stepByWheel = (current: number, values: number[], blocked: Set<number>, deltaY: number) => {
  const direction = deltaY < 0 ? -1 : 1;
  const from = Math.max(0, values.indexOf(current));
  for (let cursor = from + direction; cursor >= 0 && cursor < values.length; cursor += direction) {
    const candidate = values[cursor];
    if (candidate === undefined) continue;
    if (!blocked.has(candidate)) return candidate;
  }
  return current;
};

const TimePickerBase = React.forwardRef<HTMLInputElement, TimePickerProps>(
  (
    {
      value,
      defaultValue,
      onValueChange,
      onChange,
      onBlur,
      placeholder = TIME_PICKER_DEFAULTS.placeholder,
      size = INPUT_DEFAULTS.size,
      variant = "outlined",
      status,
      disabled,
      readOnly,
      className,
      name,
      id,
      format = TIME_PICKER_DEFAULTS.format,
      use12Hours = TIME_PICKER_DEFAULTS.use12Hours,
      showSeconds,
      hourStep = TIME_PICKER_DEFAULTS.hourStep,
      minuteStep = TIME_PICKER_DEFAULTS.minuteStep,
      secondStep = TIME_PICKER_DEFAULTS.secondStep,
      disabledHours,
      disabledMinutes,
      disabledSeconds,
      hideDisabledOptions = TIME_PICKER_DEFAULTS.hideDisabledOptions,
      needConfirm = TIME_PICKER_DEFAULTS.needConfirm,
      showNow = TIME_PICKER_DEFAULTS.showNow,
      changeOnScroll = TIME_PICKER_DEFAULTS.changeOnScroll,
      inputReadOnly = true,
      prefix,
      suffixIcon,
      placement = TIME_PICKER_DEFAULTS.placement,
      renderExtraFooter,
      allowClear = TIME_PICKER_DEFAULTS.allowClear,
      clearable = TIME_PICKER_DEFAULTS.clearable,
      open,
      defaultOpen,
      onOpenChange,
      ...rest
    },
    ref
  ) => {
    const isControlled = value !== undefined;
    const resolvedShowSeconds = showSeconds ?? format.includes("ss");

    const [innerValue, setInnerValue] = React.useState<string>(defaultValue ?? "");
    const currentValue = isControlled ? value ?? "" : innerValue;

    const [innerOpen, setInnerOpen] = React.useState(defaultOpen ?? false);
    const isOpen = open ?? innerOpen;

    const setOpen = (next: boolean) => {
      if (open === undefined) setInnerOpen(next);
      onOpenChange?.(next);
    };

    const parsed = React.useMemo(
      () => parseTime(currentValue, Boolean(use12Hours || format.includes("h:mm"))) ?? { hour: 0, minute: 0, second: 0 },
      [currentValue, format, use12Hours]
    );

    const [draft, setDraft] = React.useState<ParsedTime>(parsed);
    React.useEffect(() => {
      if (!isOpen) setDraft(parsed);
    }, [isOpen, parsed]);

    const disabledHourSet = React.useMemo(() => new Set((disabledHours?.() ?? []).filter((v) => v >= 0 && v <= 23)), [disabledHours]);
    const disabledMinuteSet = React.useMemo(
      () => new Set((disabledMinutes?.(draft.hour) ?? []).filter((v) => v >= 0 && v <= 59)),
      [disabledMinutes, draft.hour]
    );
    const disabledSecondSet = React.useMemo(
      () => new Set((disabledSeconds?.(draft.hour, draft.minute) ?? []).filter((v) => v >= 0 && v <= 59)),
      [disabledSeconds, draft.hour, draft.minute]
    );

    const hourValues = use12Hours ? buildValues(11, hourStep).map((v) => v + 1) : buildValues(23, hourStep);
    const minuteValues = buildValues(59, minuteStep);
    const secondValues = buildValues(59, secondStep);

    const emit = React.useCallback(
      (next: ParsedTime) => {
        const nextText = formatTime(next, format, use12Hours);
        if (!isControlled) setInnerValue(nextText);
        onValueChange?.(nextText);
        onChange?.(toChangeEvent(nextText, id, name));
      },
      [format, id, isControlled, name, onChange, onValueChange, use12Hours]
    );

    const updateDraft = (patch: Partial<ParsedTime>) => {
      const next = { ...draft, ...patch };
      setDraft(next);
      if (!needConfirm) emit(next);
    };

    const commit = () => {
      emit(draft);
      setOpen(false);
    };

    const clearEnabled = typeof allowClear === "boolean" ? allowClear : Boolean(allowClear);
    const inputVariant = variantMap[variant] as InputVariantCompat;
    const inputStatus = statusMap[status ?? "default"] as InputStatusCompat;
    const place = placementMap[placement];
    const withSeconds = Boolean(resolvedShowSeconds);

    const underlinedClassName =
      variant === "underlined" ? "rounded-none border-0 border-b border-default px-0 focus:border-primary" : "";

    const renderCell = (key: string, text: string, active: boolean, blocked: boolean, onClick: () => void) => (
      <Button
        key={key}
        variant="ghost"
        size="sm"
        fullWidth
        disabled={blocked}
        className={cn(
          "h-7 rounded-none border-0 bg-transparent px-[var(--space-2)] text-body-sm",
          active ? "bg-primary text-primary-foreground" : "text-foreground/85 hover:bg-surface-elevated"
        )}
        onClick={onClick}
      >
        {text}
      </Button>
    );

    return (
      <Popover open={isOpen} onOpenChange={(next) => (!disabled && !readOnly ? setOpen(next) : undefined)}>
        <PopoverTrigger asChild>
          <Input
            ref={ref}
            value={currentValue}
            readOnly={inputReadOnly}
            disabled={disabled}
            onBlur={onBlur}
            placeholder={placeholder}
            size={size}
            variant={inputVariant}
            status={inputStatus}
            name={name}
            id={id}
            clearable={Boolean((clearEnabled || clearable) && currentValue)}
            onClear={() => {
              if (!isControlled) setInnerValue("");
              onValueChange?.("");
              onChange?.(toChangeEvent("", id, name));
            }}
            className={cn("h-8 rounded-[var(--radius-sm)] pr-8 text-body-sm", underlinedClassName, className)}
            prefix={prefix}
            suffix={suffixIcon !== undefined ? suffixIcon : <Clock3 className="h-[var(--size-icon-md)] w-[var(--size-icon-md)] text-muted" />}
            {...rest}
          />
        </PopoverTrigger>

        <PopoverContent
          align={place.align}
          side={place.side}
          sideOffset={6}
          className={cn("bg-white p-[var(--space-2)] dark:bg-surface", withSeconds ? "w-[216px]" : "w-[160px]")}
        >
          <Box className={cn("grid overflow-hidden rounded-[var(--radius-sm)] border border-default", withSeconds ? "grid-cols-3" : "grid-cols-2")}>
            <ScrollArea
              className="h-[224px] border-r border-default last:border-r-0"
              onWheel={(event) => {
                if (!changeOnScroll) return;
                event.preventDefault();
                const current = use12Hours ? ((draft.hour % 12) || 12) : draft.hour;
                const next = stepByWheel(current, hourValues, disabledHourSet, event.deltaY);
                if (use12Hours) {
                  const hour24 = draft.hour >= 12 ? (next % 12) + 12 : next % 12;
                  updateDraft({ hour: hour24 });
                  return;
                }
                updateDraft({ hour: next });
              }}
            >
              <Box className="p-0">
                {hourValues
                  .filter((hour) => {
                    if (!hideDisabledOptions) return true;
                    const hour24 = use12Hours ? (draft.hour >= 12 ? (hour % 12) + 12 : hour % 12) : hour;
                    return !disabledHourSet.has(hour24);
                  })
                  .map((hour) => {
                    const hour24 = use12Hours ? (draft.hour >= 12 ? (hour % 12) + 12 : hour % 12) : hour;
                    const active = use12Hours ? ((draft.hour % 12) || 12) === hour : draft.hour === hour;
                    return renderCell(
                      `hour-${hour}`,
                      use12Hours ? String(hour) : pad2(hour),
                      active,
                      disabledHourSet.has(hour24),
                      () => updateDraft({ hour: hour24 })
                    );
                  })}
              </Box>
            </ScrollArea>

            <ScrollArea
              className="h-[224px] border-r border-default last:border-r-0"
              onWheel={(event) => {
                if (!changeOnScroll) return;
                event.preventDefault();
                const next = stepByWheel(draft.minute, minuteValues, disabledMinuteSet, event.deltaY);
                updateDraft({ minute: next });
              }}
            >
              <Box className="p-0">
                {minuteValues
                  .filter((minute) => (hideDisabledOptions ? !disabledMinuteSet.has(minute) : true))
                  .map((minute) =>
                    renderCell(`minute-${minute}`, pad2(minute), draft.minute === minute, disabledMinuteSet.has(minute), () =>
                      updateDraft({ minute })
                    )
                  )}
              </Box>
            </ScrollArea>

            {withSeconds ? (
              <ScrollArea
                className="h-[224px]"
                onWheel={(event) => {
                  if (!changeOnScroll) return;
                  event.preventDefault();
                  const next = stepByWheel(draft.second, secondValues, disabledSecondSet, event.deltaY);
                  updateDraft({ second: next });
                }}
              >
                <Box className="p-0">
                  {secondValues
                    .filter((second) => (hideDisabledOptions ? !disabledSecondSet.has(second) : true))
                    .map((second) =>
                      renderCell(`second-${second}`, pad2(second), draft.second === second, disabledSecondSet.has(second), () =>
                        updateDraft({ second })
                      )
                    )}
                </Box>
              </ScrollArea>
            ) : null}
          </Box>

          {use12Hours ? (
            <Box className="mt-[var(--space-2)] grid grid-cols-2 gap-[var(--space-2)]">
              <Button variant={draft.hour < 12 ? "primary" : "secondary"} size="sm" onClick={() => updateDraft({ hour: draft.hour % 12 })}>AM</Button>
              <Button variant={draft.hour >= 12 ? "primary" : "secondary"} size="sm" onClick={() => updateDraft({ hour: (draft.hour % 12) + 12 })}>PM</Button>
            </Box>
          ) : null}

          <Box className="border-default mt-[var(--space-2)] flex items-center justify-between border-t pt-[var(--space-2)]">
            <Box className="flex items-center gap-[var(--space-2)]">
              {showNow ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => updateDraft({ hour: new Date().getHours(), minute: new Date().getMinutes(), second: new Date().getSeconds() })}
                >
                  Now
                </Button>
              ) : null}
              {renderExtraFooter?.()}
            </Box>
            {needConfirm ? (
              <Button variant="primary" size="sm" onClick={commit} leftIcon={<Check className="h-4 w-4" />}>
                OK
              </Button>
            ) : null}
          </Box>
        </PopoverContent>
      </Popover>
    );
  }
);
TimePickerBase.displayName = "TimePickerBase";

const TimePickerComponent = React.forwardRef<HTMLInputElement, TimePickerProps>((props, ref) => {
  const { control, rules, name, onValueChange, onBlur, onChange, ...rest } = props;

  if (control && typeof name === "string" && name.length > 0) {
    return (
      <Controller
        control={control as any}
        name={name as any}
        rules={rules}
        render={({ field }) => (
          <TimePickerBase
            {...rest}
            ref={ref}
            name={field.name}
            value={field.value == null ? "" : String(field.value)}
            onValueChange={(nextValue) => {
              field.onChange(nextValue);
              onValueChange?.(nextValue);
            }}
            onBlur={(event) => {
              field.onBlur();
              onBlur?.(event);
            }}
            onChange={onChange}
          />
        )}
      />
    );
  }

  return <TimePickerBase {...rest} ref={ref} name={name} onValueChange={onValueChange} onBlur={onBlur} onChange={onChange} />;
});
TimePickerComponent.displayName = "TimePicker";

export const TimePicker = React.memo(TimePickerComponent);
TimePicker.displayName = "TimePicker";

const TimeRangePickerComponent = React.forwardRef<HTMLDivElement, TimeRangePickerProps>(
  (
    {
      value,
      defaultValue,
      onValueChange,
      disabledTime,
      order = true,
      invalidOrderMessage = "종료 시간은 시작 시간보다 빠를 수 없습니다.",
      startPlaceholder = "Start time",
      endPlaceholder = "End time",
      separator = "→",
      size = INPUT_DEFAULTS.size,
      variant = "outlined",
      status,
      ...rest
    },
    ref
  ) => {
    const isControlled = value !== undefined;
    const [innerValue, setInnerValue] = React.useState<TimeRangeValue>(defaultValue ?? {});
    const current = isControlled ? value ?? {} : innerValue;
    const currentStartSeconds = toTotalSeconds(current.start, rest.use12Hours);
    const currentEndSeconds = toTotalSeconds(current.end, rest.use12Hours);
    const isInvalidOrder = Boolean(
      order === false &&
        currentStartSeconds != null &&
        currentEndSeconds != null &&
        currentEndSeconds < currentStartSeconds
    );

    const emit = (next: TimeRangeValue) => {
      const startSeconds = toTotalSeconds(next.start, rest.use12Hours);
      const endSeconds = toTotalSeconds(next.end, rest.use12Hours);
      const normalized =
        order && startSeconds != null && endSeconds != null && endSeconds < startSeconds
          ? { start: next.end, end: next.start }
          : next;
      if (!isControlled) setInnerValue(normalized);
      onValueChange?.(normalized);
    };

    const startDisabled = disabledTime?.(current, "start") ?? ({} as DisabledTimeConfig);
    const endDisabled = disabledTime?.(current, "end") ?? ({} as DisabledTimeConfig);

    const mappedStatus = (isInvalidOrder ? "error" : statusMap[status ?? "default"]) as InputStatusCompat;

    return (
      <Box className="grid gap-[var(--space-1)]" ref={ref as never}>
        <Box
          className={cn(
            "flex min-w-0 flex-1 items-center rounded-[var(--radius-sm)] border border-default bg-white px-[var(--space-2)] dark:bg-surface",
            rangeHeightMap[size],
            variant === "filled" ? "bg-surface-elevated" : "",
            variant === "borderless" ? "border-transparent bg-transparent" : "",
            variant === "underlined" ? "rounded-none border-0 border-b border-default px-0" : "",
            mappedStatus === "error" ? "border-danger/40" : "",
            mappedStatus === "success" ? "border-success/40" : ""
          )}
        >
          <TimePicker
            {...rest}
            value={current.start ?? ""}
            onValueChange={(next) => emit({ ...current, start: next || undefined })}
            disabledHours={startDisabled.disabledHours}
            disabledMinutes={startDisabled.disabledMinutes}
            disabledSeconds={startDisabled.disabledSeconds}
            placeholder={startPlaceholder}
            size={size}
            variant="ghost"
            status={mappedStatus}
            allowClear={false}
            suffixIcon={null}
            className="h-full min-w-0 border-0 bg-transparent px-0 pr-[var(--space-1)] text-foreground font-medium shadow-none focus:ring-0"
          />
          <Box as="p" className="px-[var(--space-2)] text-muted text-body-sm">{separator}</Box>
          <TimePicker
            {...rest}
            value={current.end ?? ""}
            onValueChange={(next) => emit({ ...current, end: next || undefined })}
            disabledHours={endDisabled.disabledHours}
            disabledMinutes={endDisabled.disabledMinutes}
            disabledSeconds={endDisabled.disabledSeconds}
            placeholder={endPlaceholder}
            size={size}
            variant="ghost"
            status={mappedStatus}
            allowClear={false}
            suffixIcon={null}
            className="h-full min-w-0 border-0 bg-transparent px-0 pr-[var(--space-1)] text-foreground font-medium shadow-none focus:ring-0"
          />
          <Clock3 className="ml-[var(--space-1)] h-[var(--size-icon-sm)] w-[var(--size-icon-sm)] shrink-0 text-muted" />
        </Box>
        {isInvalidOrder ? (
          <Box as="p" className="text-danger text-caption">
            {invalidOrderMessage}
          </Box>
        ) : null}
      </Box>
    );
  }
);
TimeRangePickerComponent.displayName = "TimeRangePicker";

export const TimeRangePicker = React.memo(TimeRangePickerComponent);
TimeRangePicker.displayName = "TimeRangePicker";

export const TimePickerWithRange = TimePicker as typeof TimePicker & { RangePicker: typeof TimeRangePicker };
TimePickerWithRange.RangePicker = TimeRangePicker;
