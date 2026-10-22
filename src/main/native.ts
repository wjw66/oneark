import { app } from 'electron'
import { join } from 'node:path'
import type { NativeInfo } from '../shared/contracts'

interface NativeModule {
  getNativeInfo(): NativeInfo
}

export function getNativeInfo(): NativeInfo {
  const nativePath = app.isPackaged
    ? join(process.resourcesPath, 'native', 'oneark-native.node')
    : join(app.getAppPath(), 'native', 'oneark-native.node')

  // 原生模块只由主进程加载，渲染页面不能任意加载本机模块。
  const native = require(nativePath) as NativeModule
  return native.getNativeInfo()
}
