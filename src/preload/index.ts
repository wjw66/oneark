import { contextBridge, ipcRenderer } from 'electron'
import { IPC, type OneArkAPI } from '../shared/contracts'

const api: OneArkAPI = {
  getAppInfo: () => ipcRenderer.invoke(IPC.getAppInfo),
  exportMarkdown: (content) => ipcRenderer.invoke(IPC.exportMarkdown, content)
}

// 只暴露明确列出的业务方法，不提供通用 invoke、文件系统或 Node.js 对象。
contextBridge.exposeInMainWorld('oneark', api)
