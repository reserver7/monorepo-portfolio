import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import {
  SelectCheckIcon,
  SelectChevronDownIcon,
  SelectChevronUpIcon,
  useSelectContentClassName,
  useSelectItemClassName,
  useSelectLabelClassName,
  useSelectScrollButtonClassName,
  useSelectSeparatorClassName,
  useSelectTriggerClassName,
  useSelectViewportClassName
} from "../hooks/use-select";

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => {
  const resolvedClassName = useSelectTriggerClassName(className);

  return (
    <SelectPrimitive.Trigger ref={ref} className={resolvedClassName} {...props}>
      {children}
      <SelectPrimitive.Icon asChild>
        <span className="text-slate-500 dark:text-slate-400">
          <SelectChevronDownIcon />
        </span>
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => {
  const resolvedClassName = useSelectScrollButtonClassName(className);

  return (
    <SelectPrimitive.ScrollUpButton ref={ref} className={resolvedClassName} {...props}>
      <SelectChevronUpIcon />
    </SelectPrimitive.ScrollUpButton>
  );
});
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => {
  const resolvedClassName = useSelectScrollButtonClassName(className);

  return (
    <SelectPrimitive.ScrollDownButton ref={ref} className={resolvedClassName} {...props}>
      <SelectChevronDownIcon />
    </SelectPrimitive.ScrollDownButton>
  );
});
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => {
  const resolvedContentClassName = useSelectContentClassName(className, position);
  const resolvedViewportClassName = useSelectViewportClassName(position);

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content ref={ref} className={resolvedContentClassName} position={position} {...props}>
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport className={resolvedViewportClassName}>{children}</SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => {
  const resolvedClassName = useSelectLabelClassName(className);

  return <SelectPrimitive.Label ref={ref} className={resolvedClassName} {...props} />;
});
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => {
  const resolvedClassName = useSelectItemClassName(className);

  return (
    <SelectPrimitive.Item ref={ref} className={resolvedClassName} {...props}>
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <SelectCheckIcon />
        </SelectPrimitive.ItemIndicator>
      </span>

      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
});
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => {
  const resolvedClassName = useSelectSeparatorClassName(className);

  return <SelectPrimitive.Separator ref={ref} className={resolvedClassName} {...props} />;
});
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue
};
