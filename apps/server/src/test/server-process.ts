import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = async (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const findFreePort = async (): Promise<number> => {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();

    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close(() => {
          reject(new Error("빈 포트를 찾지 못했습니다."));
        });
        return;
      }

      const { port } = address;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(port);
      });
    });
  });
};

const waitForHealth = async (baseUrl: string, timeoutMs: number): Promise<void> => {
  const startedAt = Date.now();
  let lastError: unknown = null;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) {
        return;
      }
      lastError = new Error(`health check failed: ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await sleep(120);
  }

  throw new Error(`서버 기동 대기 시간이 초과되었습니다. baseUrl=${baseUrl}, error=${String(lastError)}`);
};

export interface TestServerProcess {
  readonly baseUrl: string;
  readonly stateFilePath: string;
  readonly logs: string[];
  stop: () => Promise<void>;
}

export interface StartServerProcessOptions {
  env?: Record<string, string>;
  startupTimeoutMs?: number;
}

export const startTestServerProcess = async (
  options: StartServerProcessOptions = {}
): Promise<TestServerProcess> => {
  const serverRoot = path.resolve(__dirname, "..", "..");
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "server-integration-test-"));
  const port = await findFreePort();
  const stateFilePath = path.join(tempDir, "state.json");
  const baseUrl = `http://127.0.0.1:${port}`;

  const tsxBin = path.join(
    serverRoot,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "tsx.cmd" : "tsx"
  );

  const logs: string[] = [];
  const child = spawn(tsxBin, ["src/index.ts"], {
    cwd: serverRoot,
    env: {
      ...process.env,
      NODE_ENV: "test",
      PORT: String(port),
      STATE_FILE_PATH: stateFilePath,
      CORS_ORIGINS: "http://localhost:3000,http://localhost:3001",
      COLLAB_SESSION_SECRET: "integration-session-secret",
      EDITOR_ACCESS_KEY: "integration-editor-key",
      SOCKET_RATE_LIMIT_WINDOW_MS: "10000",
      SOCKET_WRITE_EVENTS_PER_WINDOW: "2",
      SOCKET_CURSOR_EVENTS_PER_WINDOW: "4",
      MAX_YJS_UPDATE_BASE64_CHARS: "64",
      MAX_SOCKET_JSON_CHARS: "120",
      ...options.env
    },
    stdio: "pipe"
  });

  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk: string) => {
    logs.push(chunk);
  });
  child.stderr.on("data", (chunk: string) => {
    logs.push(chunk);
  });

  try {
    await waitForHealth(baseUrl, options.startupTimeoutMs ?? 20_000);
  } catch (error) {
    await stopChild(child, tempDir);
    throw new Error(`${String(error)}\n${logs.join("")}`);
  }

  return {
    baseUrl,
    stateFilePath,
    logs,
    stop: async () => {
      await stopChild(child, tempDir);
    }
  };
};

const stopChild = async (child: ChildProcessWithoutNullStreams, tempDir: string): Promise<void> => {
  const waitForExitWithTimeout = async (timeoutMs: number): Promise<boolean> => {
    return new Promise((resolve) => {
      if (child.exitCode !== null) {
        resolve(true);
        return;
      }

      const onExit = () => {
        clearTimeout(timer);
        resolve(true);
      };

      const timer = setTimeout(() => {
        child.off("exit", onExit);
        resolve(false);
      }, timeoutMs);

      child.once("exit", onExit);
    });
  };

  if (child.exitCode === null && !child.killed) {
    child.kill("SIGTERM");
    const exitedByTerm = await waitForExitWithTimeout(3000);
    if (!exitedByTerm && child.exitCode === null && !child.killed) {
      child.kill("SIGKILL");
      await waitForExitWithTimeout(2000);
    }
  }

  await rm(tempDir, { recursive: true, force: true });
};
