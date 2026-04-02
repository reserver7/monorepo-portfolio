export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">Monorepo New App</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">__APP_TITLE__</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          신규 앱이 생성되었습니다. 이 페이지를 기준으로 기능을 확장하세요.
        </p>
        <ul className="mt-6 list-disc space-y-2 pl-5 text-sm text-slate-700">
          <li>
            앱 패키지명: <code>@repo/__APP_NAME__</code>
          </li>
          <li>
            개발 포트: <code>__APP_PORT__</code>
          </li>
          <li>
            실행 명령: <code>pnpm dev:__APP_NAME__</code>
          </li>
        </ul>
      </div>
    </main>
  );
}
