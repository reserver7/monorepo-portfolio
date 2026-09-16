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
            A new app has been created with the shared components, theme, and query utilities connected.
          </p>

          <ul className="text-muted list-disc space-y-2 pl-5 text-sm">
            <li>
              Package: <code>@repo/__APP_NAME__</code>
            </li>
            <li>
              Development port: <code>__APP_PORT__</code>
            </li>
            <li>
              Start command: <code>pnpm dev:__APP_NAME__</code>
            </li>
            <li>
              Environment file: <code>apps/__APP_NAME__/.env.local</code>
            </li>
          </ul>

          <div className="flex flex-wrap gap-2">
            <Button>Start building</Button>
            <Button variant="outline">Review conventions</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
