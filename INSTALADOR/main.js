const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const { Client } = require("pg");
const { execFileSync } = require("child_process");

const createWindow = () => {
  const win = new BrowserWindow({
    width: 980,
    height: 720,
    resizable: true,
    backgroundColor: "#0f0f10",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, "index.html"));
};

const buildEnvContent = ({ url, anonKey, serviceKey }) => {
  return [
    "# Next.js public Supabase config",
    `NEXT_PUBLIC_SUPABASE_URL=${url}`,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}`,
    "",
    "# Supabase edge function envs",
    `SB_URL=${url}`,
    `SB_ANON_KEY=${anonKey}`,
    `SB_SERVICE_ROLE_KEY=${serviceKey}`,
    "",
  ].join("\n");
};

const runGit = (args, options = {}) => {
  try {
    const stdout = execFileSync("git", args, {
      cwd: options.cwd,
      env: { ...process.env, ...(options.env || {}) },
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { ok: true, stdout, stderr: "" };
  } catch (err) {
    const stdout = err?.stdout ? String(err.stdout) : "";
    const stderr = err?.stderr ? String(err.stderr) : err?.message || "";
    return { ok: false, stdout, stderr };
  }
};

const ensureGitIgnore = (rootPath) => {
  const ignorePath = path.join(rootPath, ".gitignore");
  const entries = [
    "node_modules/",
    "INSTALADOR/node_modules/",
    ".next/",
    "out/",
    "dist/",
    ".env",
    ".env.local",
  ];

  let content = "";
  if (fs.existsSync(ignorePath)) {
    content = fs.readFileSync(ignorePath, { encoding: "utf8" });
  }

  const existing = new Set(
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
  );

  const missing = entries.filter((entry) => !existing.has(entry));
  if (missing.length === 0) return;

  const updated = [content.trimEnd(), ...missing].filter(Boolean).join("\n") + "\n";
  fs.writeFileSync(ignorePath, updated, { encoding: "utf8" });
};

const sanitizeOutput = (text, token) => {
  if (!text) return "";
  const safeToken = String(token || "");
  if (!safeToken) return text;
  return text.split(safeToken).join("***");
};

ipcMain.handle("write-env", async (_event, data) => {
  const url = String(data?.url || "").trim();
  const anonKey = String(data?.anonKey || "").trim();
  const serviceKey = String(data?.serviceKey || "").trim();

  if (!url || !anonKey || !serviceKey) {
    return { ok: false, error: "Faltan claves. Revisa los campos." };
  }

  const targetPath = path.resolve(app.getAppPath(), "..", ".env.local");
  const content = buildEnvContent({ url, anonKey, serviceKey });

  try {
    fs.writeFileSync(targetPath, content, { encoding: "utf8" });
    return { ok: true, path: targetPath };
  } catch (err) {
    return { ok: false, error: err?.message || "Error guardando .env.local" };
  }
});

ipcMain.handle("git-push", async (_event, data) => {
  const owner = String(data?.owner || "").trim();
  const repo = String(data?.repo || "").trim();
  const token = String(data?.token || "").trim();

  if (!owner || !repo || !token) {
    return { ok: false, error: "Faltan datos de GitHub." };
  }

  if (!/^[\w.-]+$/i.test(owner) || !/^[\w.-]+$/i.test(repo)) {
    return { ok: false, error: "Usuario o repo invalido." };
  }

  const projectRoot = path.resolve(app.getAppPath(), "..");
  const gitVersion = runGit(["--version"], { cwd: projectRoot });
  if (!gitVersion.ok) {
    return { ok: false, error: "Git no esta instalado o no esta en PATH." };
  }

  try {
    ensureGitIgnore(projectRoot);
  } catch (err) {
    return { ok: false, error: err?.message || "No se pudo actualizar .gitignore" };
  }

  const gitDir = path.join(projectRoot, ".git");
  if (!fs.existsSync(gitDir)) {
    const init = runGit(["init"], { cwd: projectRoot });
    if (!init.ok) {
      return { ok: false, error: sanitizeOutput(init.stderr || init.stdout, token) || "Error inicializando git" };
    }
  }

  runGit(["rm", "-r", "--cached", "--ignore-unmatch", "node_modules"], { cwd: projectRoot });
  runGit(["rm", "-r", "--cached", "--ignore-unmatch", "INSTALADOR/node_modules"], { cwd: projectRoot });
  runGit(["rm", "-r", "--cached", "--ignore-unmatch", ".next"], { cwd: projectRoot });
  runGit(["rm", "-r", "--cached", "--ignore-unmatch", "dist"], { cwd: projectRoot });
  runGit(["rm", "-r", "--cached", "--ignore-unmatch", "out"], { cwd: projectRoot });

  const add = runGit(["add", "."], { cwd: projectRoot });
  if (!add.ok) {
    return { ok: false, error: sanitizeOutput(add.stderr || add.stdout, token) || "Error en git add" };
  }

  const status = runGit(["status", "--porcelain"], { cwd: projectRoot });
  if (!status.ok) {
    return { ok: false, error: sanitizeOutput(status.stderr || status.stdout, token) || "Error leyendo status" };
  }

  if (status.stdout.trim()) {
    const commit = runGit(["commit", "-m", "primer commit"], { cwd: projectRoot });
    if (!commit.ok) {
      return { ok: false, error: sanitizeOutput(commit.stderr || commit.stdout, token) || "Error en git commit" };
    }
  }

  runGit(["branch", "-M", "main"], { cwd: projectRoot });

  const remoteUrl = `https://github.com/${owner}/${repo}.git`;
  const pushUrl = `https://${token}@github.com/${owner}/${repo}.git`;

  const getRemote = runGit(["remote", "get-url", "origin"], { cwd: projectRoot });
  if (getRemote.ok) {
    const setUrl = runGit(["remote", "set-url", "origin", remoteUrl], { cwd: projectRoot });
    if (!setUrl.ok) {
      return { ok: false, error: sanitizeOutput(setUrl.stderr || setUrl.stdout, token) || "Error configurando remote" };
    }
  } else {
    const addRemote = runGit(["remote", "add", "origin", remoteUrl], { cwd: projectRoot });
    if (!addRemote.ok) {
      return { ok: false, error: sanitizeOutput(addRemote.stderr || addRemote.stdout, token) || "Error agregando remote" };
    }
  }

  const push = runGit(["push", pushUrl, "main"], {
    cwd: projectRoot,
    env: { GIT_TERMINAL_PROMPT: "0" },
  });

  if (!push.ok) {
    const rawError = sanitizeOutput(push.stderr || push.stdout, token);
    if (rawError.includes("GH001") || rawError.includes("Large files")) {
      return {
        ok: false,
        error:
          "Hay archivos grandes en el historial. Usa 'Limpiar Git y reintentar' y luego vuelve a subir.",
      };
    }
    return { ok: false, error: rawError || "Error en git push" };
  }

  runGit(["branch", "--set-upstream-to=origin/main", "main"], { cwd: projectRoot });
  return { ok: true };
});

ipcMain.handle("git-clean", async () => {
  const projectRoot = path.resolve(app.getAppPath(), "..");
  const gitDir = path.join(projectRoot, ".git");
  try {
    if (fs.existsSync(gitDir)) {
      fs.rmSync(gitDir, { recursive: true, force: true });
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err?.message || "No se pudo limpiar Git" };
  }
});

ipcMain.handle("run-schema", async (_event, data) => {
  const connectionString = String(data?.connectionString || "").trim();
  const schemaSql = String(data?.schemaSql || "").trim();

  if (!connectionString || !schemaSql) {
    return { ok: false, error: "Falta la cadena de conexion o el schema SQL." };
  }

  if (
    connectionString.includes("[YOUR-PASSWORD]") ||
    connectionString.includes("<YOUR-PASSWORD>") ||
    connectionString.includes("YOUR-PASSWORD")
  ) {
    return { ok: false, error: "Reemplaza [YOUR-PASSWORD] por la contrasena real." };
  }

  try {
    const url = new URL(connectionString);
    if (url.hostname.endsWith(".pooler.supabase.com") && (!url.port || url.port === "5432")) {
      url.port = "6543";
      connectionString = url.toString();
    }
  } catch (err) {
    return { ok: false, error: "Connection string invalido." };
  }

  const needsSsl = /\.supabase\.co(?::\d+)?/i.test(connectionString);

  const client = new Client({
    connectionString,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await client.connect();
    await client.query("begin");
    await client.query(schemaSql);
    await client.query("commit");
    return { ok: true };
  } catch (err) {
    try {
      await client.query("rollback");
    } catch (rollbackErr) {
      console.error("Rollback error:", rollbackErr);
    }
    return { ok: false, error: err?.message || "Error ejecutando schema" };
  } finally {
    try {
      await client.end();
    } catch (endErr) {
      console.error("Client end error:", endErr);
    }
  }
});

ipcMain.handle("show-info", async (_event, message) => {
  await dialog.showMessageBox({
    type: "info",
    message: String(message || ""),
  });
});

ipcMain.handle("open-url", async (_event, url) => {
  const target = String(url || "").trim();
  if (!target) return { ok: false, error: "URL vacia" };
  await shell.openExternal(target);
  return { ok: true };
});

ipcMain.handle("pick-schema", async () => {
  const result = await dialog.showOpenDialog({
    title: "Selecciona schema_public.sql",
    filters: [{ name: "SQL", extensions: ["sql"] }],
    properties: ["openFile"],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { ok: false, error: "No se selecciono archivo" };
  }

  const filePath = result.filePaths[0];
  try {
    const content = fs.readFileSync(filePath, { encoding: "utf8" });
    return { ok: true, content };
  } catch (err) {
    return { ok: false, error: err?.message || "Error leyendo archivo" };
  }
});

ipcMain.handle("read-sql", async (_event, fileName) => {
  const safeName = String(fileName || "").trim();
  if (!safeName || !/^[\w.-]+\.sql$/i.test(safeName)) {
    return { ok: false, error: "Nombre de archivo invalido." };
  }

  const basePath = path.resolve(app.getAppPath(), "..");
  const filePath = path.join(basePath, safeName);
  try {
    const content = fs.readFileSync(filePath, { encoding: "utf8" });
    return { ok: true, content };
  } catch (err) {
    return { ok: false, error: err?.message || "No se pudo leer el archivo." };
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
