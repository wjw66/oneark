import { app, BrowserWindow, dialog, ipcMain, Menu, type IpcMainInvokeEvent } from 'electron'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { IPC, type AppInfo } from '../shared/contracts'
import { getNativeInfo } from './native'

let mainWindow: BrowserWindow | null = null

function requireMainWindow(event: IpcMainInvokeEvent): BrowserWindow {
  // 只允许应用主页面调用；子框架和其他窗口不能借用本机接口。
  if (
    !mainWindow ||
    event.sender !== mainWindow.webContents ||
    event.senderFrame !== mainWindow.webContents.mainFrame
  ) {
    throw new Error('此页面无权调用本机接口')
  }
  return mainWindow
}

function createWindow(): void {
  const window = new BrowserWindow({
    title: 'OneArk',
    width: 1120,
    height: 780,
    minWidth: 760,
    minHeight: 560,
    show: false,
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  })
  mainWindow = window
  window.once('ready-to-show', () => window.show())
  window.once('closed', () => {
    if (mainWindow === window) mainWindow = null
  })

  // 外部内容预览将在独立容器中实现，主窗口不接受页面导航和弹窗。
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  window.webContents.on('will-navigate', (event) => event.preventDefault())
  window.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => {
    callback(false)
  })
  window.webContents.session.setPermissionCheckHandler(() => false)
  window.webContents.on('render-process-gone', (_event, details) => {
    console.error('界面进程退出：', details)
  })

  const devURL = process.env.ELECTRON_RENDERER_URL
  const loading =
    !app.isPackaged && devURL
      ? window.loadURL(devURL)
      : window.loadFile(join(__dirname, '../renderer/index.html'))
  loading.catch((error: unknown) => {
    console.error('界面加载失败：', error)
    app.exit(1)
  })
}

app
  .whenReady()
  .then(() => {
    app.setAppUserModelId('app.oneark.desktop')
    Menu.setApplicationMenu(
      Menu.buildFromTemplate([
        ...(process.platform === 'darwin'
          ? [{ label: 'OneArk', submenu: [{ role: 'about' as const }, { role: 'quit' as const }] }]
          : []),
        {
          label: '编辑',
          submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            { role: 'selectAll' }
          ]
        },
        {
          label: '视图',
          submenu: [
            { role: 'reload' },
            { role: 'toggleDevTools' },
            { role: 'resetZoom' },
            { role: 'zoomIn' },
            { role: 'zoomOut' }
          ]
        }
      ])
    )
    ipcMain.handle(IPC.getAppInfo, (event): AppInfo => {
      requireMainWindow(event)
      return {
        version: app.getVersion(),
        electron: process.versions.electron,
        chromium: process.versions.chrome,
        node: process.versions.node,
        native: getNativeInfo()
      }
    })
    ipcMain.handle(IPC.exportMarkdown, async (event, content: unknown): Promise<boolean> => {
      const window = requireMainWindow(event)
      if (typeof content !== 'string') throw new Error('Markdown 内容必须是文本')
      // 保存位置由系统对话框选择，不接受页面传入任意文件路径。
      const result = await dialog.showSaveDialog(window, {
        title: '导出 Markdown',
        defaultPath: '开始记录.md',
        filters: [{ name: 'Markdown 文档', extensions: ['md'] }],
        properties: ['showOverwriteConfirmation']
      })
      if (result.canceled || !result.filePath) return false
      await writeFile(result.filePath, content, 'utf8')
      return true
    })
    createWindow()
    app.on('activate', () => {
      if (!mainWindow) createWindow()
    })
  })
  .catch((error: unknown) => {
    console.error('应用启动失败：', error)
    app.exit(1)
  })

// 脚手架没有后台任务，遵循平台默认关闭行为；托盘在录音任务接入时实现。
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
