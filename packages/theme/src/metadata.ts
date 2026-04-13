import type { Metadata } from "next";

const HTTP_PROTOCOL_PATTERN = /^https?:\/\//i;
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);
const metadataBaseCache = new Map<string, URL | undefined>();
const absoluteUrlCache = new Map<string, string | undefined>();

const withProtocol = (value: string): string => {
  if (HTTP_PROTOCOL_PATTERN.test(value)) return value;
  return `https://${value}`;
};

const isLocalHostname = (hostname: string): boolean => {
  return LOCAL_HOSTNAMES.has(hostname);
};

const toMetadataBase = (appUrl?: string): URL | undefined => {
  const trimmed = appUrl?.trim();
  if (!trimmed) return undefined;
  if (metadataBaseCache.has(trimmed)) {
    return metadataBaseCache.get(trimmed);
  }

  let result: URL | undefined;
  try {
    const normalized = new URL(withProtocol(trimmed));
    if (!isLocalHostname(normalized.hostname) && normalized.protocol !== "https:") {
      normalized.protocol = "https:";
    }
    normalized.pathname = "/";
    normalized.search = "";
    normalized.hash = "";
    result = normalized;
  } catch {
    result = undefined;
  }

  metadataBaseCache.set(trimmed, result);
  return result;
};

const toAbsoluteUrlString = (base: URL | undefined, path: string): string | undefined => {
  if (!base) return undefined;
  const cacheKey = `${base.origin}|${path}`;
  if (absoluteUrlCache.has(cacheKey)) {
    return absoluteUrlCache.get(cacheKey);
  }

  let result: string | undefined;
  try {
    result = new URL(path, base).toString();
  } catch {
    result = undefined;
  }

  absoluteUrlCache.set(cacheKey, result);
  return result;
};

export interface CreateAppMetadataOptions {
  appName: string;
  description: string;
  appUrl?: string;
  locale?: string;
  keywords?: string[];
  manifestPath?: string;
  iconPath?: string;
  touchIconPath?: string;
}

export interface CreateEntityMetadataOptions {
  appName: string;
  entityLabel: string;
  entityId: string;
  appUrl?: string;
  pathname?: string;
  description?: string;
  noIndex?: boolean;
}

export const createAppMetadata = ({
  appName,
  description,
  appUrl,
  locale = "ko_KR",
  keywords,
  manifestPath = "/manifest.webmanifest",
  iconPath = "/icons/icon.svg",
  touchIconPath = "/icons/icon.svg"
}: CreateAppMetadataOptions): Metadata => {
  const metadataBase = toMetadataBase(appUrl);

  return {
    metadataBase,
    title: {
      default: appName,
      template: `%s | ${appName}`
    },
    description,
    applicationName: appName,
    keywords,
    alternates: {
      canonical: "/"
    },
    manifest: manifestPath,
    icons: {
      icon: [{ url: iconPath, type: "image/svg+xml" }],
      shortcut: [{ url: iconPath, type: "image/svg+xml" }],
      apple: [{ url: touchIconPath }]
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: appName
    },
    openGraph: {
      type: "website",
      locale,
      siteName: appName,
      title: appName,
      description,
      url: toAbsoluteUrlString(metadataBase, "/")
    },
    twitter: {
      card: "summary_large_image",
      title: appName,
      description
    },
    robots: {
      index: true,
      follow: true
    }
  };
};

export const createEntityMetadata = ({
  appName,
  entityLabel,
  entityId,
  appUrl,
  pathname,
  description,
  noIndex = true
}: CreateEntityMetadataOptions): Metadata => {
  const metadataBase = toMetadataBase(appUrl);
  const resolvedDescription = description ?? `${entityLabel} 상세 페이지`;
  const title = `${entityLabel} ${entityId}`;
  const resolvedPathname = pathname ?? "/";
  const absoluteUrl = toAbsoluteUrlString(metadataBase, resolvedPathname);

  return {
    title,
    alternates: {
      canonical: resolvedPathname
    },
    description: resolvedDescription,
    openGraph: {
      title: `${title} | ${appName}`,
      description: resolvedDescription,
      url: absoluteUrl
    },
    twitter: {
      card: "summary",
      title: `${title} | ${appName}`,
      description: resolvedDescription
    },
    robots: noIndex
      ? {
          index: false,
          follow: false
        }
      : {
          index: true,
          follow: true
        }
  };
};
