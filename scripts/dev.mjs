import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const rootDir = path.resolve(import.meta.dirname, "..");
const isWindows = process.platform === "win32";
const npmCommand = isWindows ? "npm.cmd" : "npm";
const pythonCommand = resolvePythonCommand();
const children = [];
let shuttingDown = false;

process.on("SIGINT", () => void shutdown(0));
process.on("SIGTERM", () => void shutdown(0));
process.on("uncaughtException", (error) => {
  console.error(error);
  void shutdown(1);
});

async function main() {
  spawnManaged("backend", pythonCommand, [
    "-m",
    "uvicorn",
    "openframe_backend.main:app",
    "--reload",
    "--host",
    "127.0.0.1",
    "--port",
    "4777"
  ]);

  spawnManaged("frontend", npmCommand, [
    "--workspace",
    "@openframe/frontend",
    "run",
    "dev",
    "--",
    "--host",
    "127.0.0.1"
  ]);

  await waitForHttp("http://127.0.0.1:4777/health", "backend");
  await waitForHttp("http://127.0.0.1:5173", "frontend");

  spawnManaged(
    "electron",
    npmCommand,
    ["--workspace", "@openframe/electron", "run", "dev"],
    {
      OPENFRAME_BACKEND_MANAGED: "0",
      VITE_DEV_SERVER_URL: "http://127.0.0.1:5173"
    }
  );
}

function resolvePythonCommand() {
  const venvPython = isWindows
    ? path.join(rootDir, ".venv", "Scripts", "python.exe")
    : path.join(rootDir, ".venv", "bin", "python");

  return fs.existsSync(venvPython) ? venvPython : "python";
}

function spawnManaged(name, command, args, env = {}) {
  const child = spawn(command, args, {
    cwd: rootDir,
    env: { ...process.env, ...env },
    shell: isWindows && command === npmCommand,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true
  });

  children.push({ name, child });
  prefixOutput(name, child.stdout);
  prefixOutput(name, child.stderr);

  child.on("exit", (code, signal) => {
    const reason = signal ? `signal ${signal}` : `code ${code}`;
    console.log(`[${name}] exited with ${reason}`);

    if (!shuttingDown) {
      const exitCode = name === "electron" ? 0 : code || 1;
      void shutdown(exitCode);
    }
  });

  child.on("error", (error) => {
    console.error(`[${name}] ${error.message}`);
    if (!shuttingDown) {
      void shutdown(1);
    }
  });

  return child;
}

function prefixOutput(name, stream) {
  let buffer = "";
  stream.on("data", (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.trim()) {
        console.log(`[${name}] ${line}`);
      }
    }
  });
}

async function waitForHttp(url, name) {
  const deadline = Date.now() + 60_000;

  while (Date.now() < deadline) {
    if (await canReach(url)) {
      console.log(`[dev] ${name} ready`);
      return;
    }
    await delay(300);
  }

  throw new Error(`${name} did not become ready at ${url}`);
}

function canReach(url) {
  return new Promise((resolve) => {
    const request = http.get(url, (response) => {
      response.resume();
      resolve(response.statusCode !== undefined && response.statusCode < 500);
    });
    request.on("error", () => resolve(false));
    request.setTimeout(1000, () => {
      request.destroy();
      resolve(false);
    });
  });
}

async function shutdown(exitCode) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.log("[dev] shutting down OpenFrame processes");
  await Promise.all(children.map(({ child }) => killProcessTree(child)));
  process.exit(exitCode);
}

function killProcessTree(child) {
  if (!child.pid || child.exitCode !== null || child.killed) {
    return Promise.resolve();
  }

  if (isWindows) {
    return new Promise((resolve) => {
      const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        stdio: "ignore",
        windowsHide: true
      });
      killer.on("exit", () => resolve());
      killer.on("error", () => resolve());
    });
  }

  child.kill("SIGTERM");
  return delay(1500).then(() => {
    if (child.exitCode === null) {
      child.kill("SIGKILL");
    }
  });
}

main().catch((error) => {
  console.error(error);
  void shutdown(1);
});
