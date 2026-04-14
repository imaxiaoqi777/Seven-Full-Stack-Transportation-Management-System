/* eslint-disable @typescript-eslint/no-require-imports */
const { app, BrowserWindow } = require("electron")
const path = require("path")
const { spawn } = require("child_process")
const http = require("http")

const isDev =
  process.env.ELECTRON_FORCE_PRODUCTION === "1"
    ? false
    : process.env.ELECTRON_FORCE_DEV === "1"
      ? true
      : !app.isPackaged
const NEXT_PORT = process.env.PORT || 3000

/** @type {import("child_process").ChildProcess | null} */
let nextProcess = null
/** @type {import("http").Server | null} */
let nextServer = null

async function startNextServer() {
  const appDir = app.getAppPath()

  if (!isDev) {
    // Production: run the built Next.js server in-process inside the packaged app.
    const next = require("next")
    const nextApp = next({
      dev: false,
      dir: appDir,
      hostname: "127.0.0.1",
      port: Number(NEXT_PORT),
    })
    const handle = nextApp.getRequestHandler()

    await nextApp.prepare()
    await new Promise((resolve, reject) => {
      nextServer = http.createServer((req, res) => handle(req, res))
      nextServer.on("error", reject)
      nextServer.listen(Number(NEXT_PORT), "127.0.0.1", resolve)
    })

    return
  }

  const cwd = path.join(__dirname)
  nextProcess = spawn(
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["run", "dev", "--", "-p", String(NEXT_PORT)],
    {
      cwd,
      env: {
        ...process.env,
        BROWSER: "none",
      },
      stdio: "inherit",
    }
  )

  nextProcess.on("exit", (code) => {
    nextProcess = null
    if (!isDev && code !== 0) {
      app.quit()
    }
  })
}

async function createMainWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 720,
    title: "集装箱运输管理系统",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const url = `http://localhost:${NEXT_PORT}/login`
  await win.loadURL(url)

  if (isDev) {
    win.webContents.openDevTools({ mode: "detach" })
  }
}

app.whenReady().then(async () => {
  await startNextServer()
  await createMainWindow()

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("before-quit", () => {
  if (nextProcess) {
    nextProcess.kill()
  }
  if (nextServer) {
    nextServer.close()
    nextServer = null
  }
})
