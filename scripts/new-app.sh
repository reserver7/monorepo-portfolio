#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APPS_DIR="${ROOT_DIR}/apps"
TEMPLATE_DIR="${ROOT_DIR}/templates/next-app"
ROOT_PACKAGE_JSON="${ROOT_DIR}/package.json"

print_error() {
  echo "[오류] $1" >&2
}

abort() {
  print_error "$1"
  exit 1
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    abort "'$1' 명령어가 필요합니다. 설치 후 다시 실행해 주세요."
  fi
}

is_valid_app_name() {
  [[ "$1" =~ ^[a-z][a-z0-9-]*$ ]]
}

is_valid_script_name() {
  [[ -z "$1" || "$1" =~ ^[a-zA-Z][a-zA-Z0-9:_-]*$ ]]
}

port_used_in_workspace() {
  local port="$1"
  local pattern="\\-p[[:space:]]*${port}([^0-9]|$)"

  if command -v rg >/dev/null 2>&1; then
    rg -n --glob 'apps/*/package.json' --pcre2 "${pattern}" "$ROOT_DIR" >/dev/null 2>&1
  else
    grep -R -E --include='package.json' "${pattern}" "$ROOT_DIR/apps" >/dev/null 2>&1
  fi
}

port_used_in_system() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -iTCP:"${port}" -sTCP:LISTEN >/dev/null 2>&1
  else
    return 1
  fi
}

find_available_port() {
  local port=3002
  while true; do
    if ! port_used_in_workspace "$port" && ! port_used_in_system "$port"; then
      echo "$port"
      return 0
    fi
    port=$((port + 1))
  done
}

assert_script_name_available() {
  local app_name="$1"
  local dev_alias="$2"

  node - "$ROOT_PACKAGE_JSON" "$app_name" "$dev_alias" <<'NODE'
const fs = require("node:fs");

const [, , packagePath, appName, devAlias] = process.argv;
const raw = fs.readFileSync(packagePath, "utf8");
const pkg = JSON.parse(raw);
const scripts = pkg.scripts ?? {};
const devScriptName = `dev:${appName}`;
const devCommand = `pnpm --filter @repo/${appName} dev`;

if (scripts[devScriptName] && scripts[devScriptName] !== devCommand) {
  console.error(`root package.json의 '${devScriptName}' 스크립트가 이미 다른 명령으로 존재합니다.`);
  process.exit(1);
}

if (devAlias && scripts[devAlias] && scripts[devAlias] !== devCommand) {
  console.error(`root package.json의 '${devAlias}' 스크립트가 이미 다른 명령으로 존재합니다.`);
  process.exit(1);
}
NODE
}

echo
echo "=============================================="
echo "모노레포 신규 앱 생성기"
echo "=============================================="
echo
echo "입력 예시"
echo "- 앱 이름: ai-ops-dashboard"
echo "- 앱 표시 이름: AI 운영 대시보드"
echo "- 개발 포트: 3002"
echo "- 루트 dev 축약 스크립트(선택): aidashdev"
echo

require_command node
require_command pnpm

if [[ ! -d "$TEMPLATE_DIR" ]]; then
  abort "템플릿 디렉터리를 찾을 수 없습니다: $TEMPLATE_DIR"
fi

if [[ ! -d "$APPS_DIR" ]]; then
  abort "apps 디렉터리를 찾을 수 없습니다: $APPS_DIR"
fi

read -r -p "앱 이름을 입력하세요 (예: ai-ops-dashboard): " APP_NAME
APP_NAME="${APP_NAME// /}"

if ! is_valid_app_name "$APP_NAME"; then
  abort "앱 이름은 소문자, 숫자, 하이픈(-)만 사용할 수 있으며 영문자로 시작해야 합니다."
fi

APP_DIR="${APPS_DIR}/${APP_NAME}"
if [[ -e "$APP_DIR" ]]; then
  abort "이미 존재하는 앱입니다: $APP_DIR"
fi

DEFAULT_TITLE="$(echo "$APP_NAME" | tr '-' ' ')"
read -r -p "앱 표시 이름을 입력하세요 [${DEFAULT_TITLE}]: " APP_TITLE
APP_TITLE="${APP_TITLE:-$DEFAULT_TITLE}"

DEFAULT_PORT="$(find_available_port)"
while true; do
  read -r -p "개발 포트를 입력하세요 [${DEFAULT_PORT}]: " APP_PORT
  APP_PORT="${APP_PORT:-$DEFAULT_PORT}"

  if ! [[ "$APP_PORT" =~ ^[0-9]+$ ]]; then
    print_error "포트는 숫자만 입력할 수 있습니다."
    continue
  fi

  if (( APP_PORT < 1000 || APP_PORT > 65535 )); then
    print_error "포트는 1000~65535 범위에서 입력해 주세요."
    continue
  fi

  if port_used_in_workspace "$APP_PORT"; then
    print_error "이미 모노레포 앱에서 사용 중인 포트입니다: $APP_PORT"
    continue
  fi

  if port_used_in_system "$APP_PORT"; then
    print_error "현재 시스템에서 사용 중인 포트입니다: $APP_PORT"
    continue
  fi

  break
done

read -r -p "루트 dev 축약 스크립트를 추가할까요? (예: aidashdev, 비우면 생략): " DEV_ALIAS
if ! is_valid_script_name "$DEV_ALIAS"; then
  abort "축약 스크립트 이름 형식이 올바르지 않습니다. (영문자로 시작, 영문/숫자/:/_/- 허용)"
fi

assert_script_name_available "$APP_NAME" "$DEV_ALIAS"

echo
echo "생성 정보"
echo "- 앱 이름: $APP_NAME"
echo "- 앱 표시 이름: $APP_TITLE"
echo "- 개발 포트: $APP_PORT"
if [[ -n "$DEV_ALIAS" ]]; then
  echo "- 축약 스크립트: $DEV_ALIAS"
else
  echo "- 축약 스크립트: (추가 안 함)"
fi
echo

mkdir -p "$APP_DIR"
cp -R "$TEMPLATE_DIR"/. "$APP_DIR"/

node - "$APP_DIR" "$APP_NAME" "$APP_TITLE" "$APP_PORT" <<'NODE'
const fs = require("node:fs");
const path = require("node:path");

const [, , appDir, appName, appTitle, appPort] = process.argv;

const replacements = new Map([
  ["__APP_NAME__", appName],
  ["__APP_TITLE__", appTitle],
  ["__APP_PORT__", appPort]
]);

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    let raw;
    try {
      raw = fs.readFileSync(fullPath, "utf8");
    } catch {
      continue;
    }

    let next = raw;
    for (const [target, value] of replacements.entries()) {
      next = next.split(target).join(value);
    }

    if (next !== raw) {
      fs.writeFileSync(fullPath, next, "utf8");
    }
  }
};

walk(appDir);
NODE

node - "$ROOT_PACKAGE_JSON" "$APP_NAME" "$DEV_ALIAS" <<'NODE'
const fs = require("node:fs");

const [, , packagePath, appName, devAlias] = process.argv;
const raw = fs.readFileSync(packagePath, "utf8");
const pkg = JSON.parse(raw);
const scripts = pkg.scripts ?? {};

const devCommand = `pnpm --filter @repo/${appName} dev`;
const additions = {
  [`dev:${appName}`]: devCommand,
  [`build:${appName}`]: `pnpm --filter @repo/${appName} build`,
  [`lint:${appName}`]: `pnpm --filter @repo/${appName} lint`,
  [`typecheck:${appName}`]: `pnpm --filter @repo/${appName} typecheck`
};

for (const [key, value] of Object.entries(additions)) {
  if (!scripts[key]) {
    scripts[key] = value;
  }
}

if (devAlias && !scripts[devAlias]) {
  scripts[devAlias] = devCommand;
}

const sortedScripts = Object.fromEntries(
  Object.entries(scripts).sort(([left], [right]) => left.localeCompare(right))
);

pkg.scripts = sortedScripts;
fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
NODE

echo "앱 생성이 완료되었습니다: apps/${APP_NAME}"
echo "루트 스크립트가 추가되었습니다: dev:${APP_NAME}, build:${APP_NAME}, lint:${APP_NAME}, typecheck:${APP_NAME}"
if [[ -n "$DEV_ALIAS" ]]; then
  echo "축약 스크립트가 추가되었습니다: $DEV_ALIAS"
fi

read -r -p "지금 pnpm install을 실행할까요? [Y/n]: " INSTALL_NOW
if [[ -z "${INSTALL_NOW}" || "${INSTALL_NOW}" =~ ^[Yy]$ ]]; then
  echo
  echo "pnpm install 실행 중..."
  pnpm install
fi

echo
echo "다음 실행 명령"
echo "- pnpm dev:${APP_NAME}"
if [[ -n "$DEV_ALIAS" ]]; then
  echo "- pnpm run ${DEV_ALIAS}"
fi
echo
