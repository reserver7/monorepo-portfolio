import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl items-center px-6 py-16">
      <Card className="w-full">
        <CardHeader>
          <CardDescription>Monorepo New App</CardDescription>
          <CardTitle>__APP_TITLE__</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted text-sm">
            신규 앱이 생성되었습니다. 공통 컴포넌트/테마/쿼리 유틸을 바로 사용할 수 있도록 기본 설정이
            연결되어 있습니다.
          </p>

          <ul className="text-muted list-disc space-y-2 pl-5 text-sm">
            <li>
              앱 패키지명: <code>@repo/__APP_NAME__</code>
            </li>
            <li>
              개발 포트: <code>__APP_PORT__</code>
            </li>
            <li>
              실행 명령: <code>pnpm dev:__APP_NAME__</code>
            </li>
            <li>
              환경변수 파일: <code>apps/__APP_NAME__/.env.local</code>
            </li>
          </ul>

          <div className="flex flex-wrap gap-2">
            <Button>기능 개발 시작</Button>
            <Button variant="outline">컨벤션 확인</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
