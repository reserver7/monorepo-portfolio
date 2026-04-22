export const TYPOGRAPHY_TOKENS = {
  fontFamilyDisplay: "var(--font-family-display)",
  fontFamilyBody: "var(--font-family-body)",
  headingXl: "var(--font-size-heading-xl)",
  headingLg: "var(--font-size-heading-lg)",
  headingMd: "var(--font-size-heading-md)",
  title: "var(--font-size-title)",
  bodyMd: "var(--font-size-body-md)",
  bodySm: "var(--font-size-body-sm)",
  caption: "var(--font-size-caption)",
  micro: "var(--font-size-micro)",
  letterSpacingDisplayHero: "var(--letter-spacing-display-hero)",
  letterSpacingBody: "var(--letter-spacing-body)",
  letterSpacingCaption: "var(--letter-spacing-caption)",
  letterSpacingMicro: "var(--letter-spacing-micro)",
  lineHeightTightest: "var(--line-height-tightest)",
  lineHeightTight: "var(--line-height-tight)",
  lineHeightNormal: "var(--line-height-normal)",
  lineHeightRelaxed: "var(--line-height-relaxed)",
  fontWeightRegular: "var(--font-weight-regular)",
  fontWeightMedium: "var(--font-weight-medium)",
  fontWeightSemibold: "var(--font-weight-semibold)",
  fontWeightBold: "var(--font-weight-bold)"
} as const;

export const SEMANTIC_COLOR_TOKENS = {
  background: "rgb(var(--color-bg-canvas))",
  text: "rgb(var(--color-fg-default))",
  surface: "rgb(var(--color-bg-surface))",
  surfaceElevated: "rgb(var(--color-bg-surface-raised))",
  border: "rgb(var(--color-border-default))",
  muted: "rgb(var(--color-fg-muted))",
  subtle: "rgb(var(--color-fg-subtle))",
  primary: "rgb(var(--color-accent-primary))",
  link: "rgb(var(--color-accent-link))",
  linkDark: "rgb(var(--color-accent-link-dark))",
  primaryText: "rgb(var(--color-fg-on-accent))",
  success: "rgb(var(--color-feedback-success))",
  successText: "rgb(var(--color-fg-on-success))",
  warning: "rgb(var(--color-feedback-warning))",
  warningText: "rgb(var(--color-fg-on-warning))",
  danger: "rgb(var(--color-feedback-danger))",
  dangerText: "rgb(var(--color-fg-on-danger))",
  info: "rgb(var(--color-feedback-info))",
  infoText: "rgb(var(--color-fg-on-info))"
} as const;

export const SPACING_TOKENS = {
  space0: "var(--space-0)",
  space1: "var(--space-1)",
  space1_5: "var(--space-1-5)",
  space2: "var(--space-2)",
  space2_5: "var(--space-2-5)",
  space3: "var(--space-3)",
  space3_5: "var(--space-3-5)",
  space4: "var(--space-4)",
  space5: "var(--space-5)",
  space6: "var(--space-6)",
  space7: "var(--space-7)",
  space8: "var(--space-8)",
  space10: "var(--space-10)",
  space12: "var(--space-12)",
  space16: "var(--space-16)",
  space20: "var(--space-20)",
  space24: "var(--space-24)"
} as const;

export const SIZE_TOKENS = {
  controlSm: "var(--size-control-sm)",
  controlMd: "var(--size-control-md)",
  controlLg: "var(--size-control-lg)",
  controlXl: "var(--size-control-xl)",
  control2xl: "var(--size-control-2xl)",
  chipSm: "var(--size-chip-sm)",
  chipMd: "var(--size-chip-md)",
  chipLg: "var(--size-chip-lg)",
  iconXs: "var(--size-icon-xs)",
  iconSm: "var(--size-icon-sm)",
  iconMd: "var(--size-icon-md)",
  iconLg: "var(--size-icon-lg)",
  touchTargetMin: "var(--size-touch-target-min)",
  sidebarWidth: "var(--size-sidebar-width)",
  sidebarCollapsedWidth: "var(--size-sidebar-collapsed-width)",
  scrollbarSm: "var(--size-scrollbar-sm)",
  scrollbarMd: "var(--size-scrollbar-md)",
  scrollbarLg: "var(--size-scrollbar-lg)",
  borderHairline: "var(--size-border-hairline)",
  borderThin: "var(--size-border-thin)",
  popoverSm: "var(--size-popover-sm)",
  popoverMd: "var(--size-popover-md)",
  popoverLg: "var(--size-popover-lg)",
  modalXs: "var(--size-modal-xs)",
  modalSm: "var(--size-modal-sm)",
  modalMd: "var(--size-modal-md)",
  modalLg: "var(--size-modal-lg)",
  modalXl: "var(--size-modal-xl)",
  sheetSm: "var(--size-sheet-sm)",
  sheetMd: "var(--size-sheet-md)",
  sheetLg: "var(--size-sheet-lg)",
  sheetXl: "var(--size-sheet-xl)",
  selectContentMaxHeight: "var(--size-select-content-max-h)",
  dropdownMinWidth: "var(--size-dropdown-min-w)",
  modalViewportInset: "var(--size-modal-viewport-inset)",
  modalBodyOffset: "var(--size-modal-body-offset)",
  sheetMaxHeightSm: "var(--size-sheet-max-h-sm)",
  sheetMaxHeightMd: "var(--size-sheet-max-h-md)",
  sheetMaxHeightLg: "var(--size-sheet-max-h-lg)",
  sheetMaxHeightXl: "var(--size-sheet-max-h-xl)",
  dataTableMaxHeight: "var(--size-data-table-max-h)",
  dropdownContentSm: "var(--size-dropdown-content-sm)",
  dropdownContentMd: "var(--size-dropdown-content-md)",
  dropdownContentLg: "var(--size-dropdown-content-lg)",
  errorBoundaryMinHeight: "var(--size-error-boundary-min-h)",
  errorBoundaryFullMinHeight: "var(--size-error-boundary-full-min-h)",
  switchSmTrackW: "var(--size-switch-sm-track-w)",
  switchSmTrackH: "var(--size-switch-sm-track-h)",
  switchSmThumb: "var(--size-switch-sm-thumb)",
  switchSmTranslate: "var(--size-switch-sm-translate)",
  switchMdTrackW: "var(--size-switch-md-track-w)",
  switchMdTrackH: "var(--size-switch-md-track-h)",
  switchMdThumb: "var(--size-switch-md-thumb)",
  switchMdTranslate: "var(--size-switch-md-translate)",
  textareaSmMinHeight: "var(--size-textarea-sm-min-h)",
  textareaMdMinHeight: "var(--size-textarea-md-min-h)",
  textareaLgMinHeight: "var(--size-textarea-lg-min-h)",
  toolbarHeight: "var(--toolbar-height)",
  chipHeight: "var(--chip-height)"
} as const;

export const LAYOUT_TOKENS = {
  pageMaxWidth: "var(--layout-page-max-width)",
  contentMaxWidth: "var(--layout-content-max-width)",
  pagePaddingX: "var(--layout-page-padding-x)",
  pagePaddingY: "var(--layout-page-padding-y)",
  sectionGap: "var(--layout-section-gap)",
  containerSm: "var(--container-sm)",
  containerMd: "var(--container-md)",
  containerLg: "var(--container-lg)",
  containerXl: "var(--container-xl)",
  breakpointSm: "var(--breakpoint-sm)",
  breakpointMd: "var(--breakpoint-md)",
  breakpointLg: "var(--breakpoint-lg)",
  breakpointXl: "var(--breakpoint-xl)"
} as const;

export const DENSITY_TOKENS = {
  panelPaddingX: "var(--panel-padding-x)",
  panelPaddingY: "var(--panel-padding-y)",
  panelGap: "var(--panel-gap)",
  formRowGap: "var(--form-row-gap)",
  stackGap: "var(--stack-gap)",
  chipHeight: "var(--chip-height)",
  toolbarHeight: "var(--toolbar-height)"
} as const;

export const ELEVATION_TOKENS = {
  none: "var(--shadow-none)",
  card: "var(--shadow-card)",
  xs: "var(--shadow-xs)",
  sm: "var(--shadow-sm)",
  md: "var(--shadow-md)",
  lg: "var(--shadow-lg)",
  xl: "var(--shadow-xl)",
  level1: "var(--elevation-1)",
  level2: "var(--elevation-2)",
  level3: "var(--elevation-3)",
  level4: "var(--elevation-4)",
  level5: "var(--elevation-5)"
} as const;

export const BORDER_TOKENS = {
  thin: "var(--border-width-thin)",
  strong: "var(--border-width-strong)",
  heavy: "var(--border-width-heavy)"
} as const;

export const FOCUS_TOKENS = {
  ringColor: "var(--focus-ring-color)",
  ringWidth: "var(--focus-ring-width)",
  ringOffset: "var(--focus-ring-offset)",
  ringShadow: "var(--focus-ring-shadow)"
} as const;

export const MOTION_TOKENS = {
  instant: "var(--duration-instant)",
  fast: "var(--duration-fast)",
  normal: "var(--duration-normal)",
  slow: "var(--duration-slow)",
  slower: "var(--duration-slower)",
  easingStandard: "var(--easing-standard)",
  easingEmphasized: "var(--easing-emphasized)",
  easingDecelerate: "var(--easing-decelerate)",
  easingAccelerate: "var(--easing-accelerate)"
} as const;

export const OPACITY_TOKENS = {
  disabled: "var(--opacity-disabled)",
  overlay: "var(--opacity-overlay)",
  muted: "var(--opacity-muted)"
} as const;

export const Z_INDEX_TOKENS = {
  base: "var(--z-base)",
  sticky: "var(--z-sticky)",
  dropdown: "var(--z-dropdown)",
  popover: "var(--z-popover)",
  overlay: "var(--z-overlay)",
  modal: "var(--z-modal)",
  toast: "var(--z-toast)",
  tooltip: "var(--z-tooltip)"
} as const;

export const DATA_VIZ_TOKENS = {
  grid: "var(--chart-grid)",
  axis: "var(--chart-axis)",
  text: "var(--chart-text)",
  series1: "var(--chart-series-1)",
  series2: "var(--chart-series-2)",
  series3: "var(--chart-series-3)",
  series4: "var(--chart-series-4)",
  series5: "var(--chart-series-5)",
  series6: "var(--chart-series-6)",
  positive: "var(--chart-positive)",
  negative: "var(--chart-negative)",
  neutral: "var(--chart-neutral)"
} as const;
