import messages from "./lib/i18n/messages/ko.json";
import type { OpsLocale } from "./lib/i18n/messages";

declare module "next-intl" {
  interface AppConfig {
    Locale: OpsLocale;
    Messages: typeof messages;
  }
}
