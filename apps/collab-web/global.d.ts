import messages from "./lib/i18n/messages/ko.json";
import type { CollabLocale } from "./lib/i18n/messages";

declare module "next-intl" {
  interface AppConfig {
    Locale: CollabLocale;
    Messages: typeof messages;
  }
}
