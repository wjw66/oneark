export const IPC = {
  getAppInfo: 'oneark:app-info',
  exportMarkdown: 'oneark:export-markdown'
} as const

export interface NativeInfo {
  version: string
  platform: string
  architecture: string
}

export interface AppInfo {
  version: string
  electron: string
  chromium: string
  node: string
  native: NativeInfo
}

export interface OneArkAPI {
  getAppInfo(): Promise<AppInfo>
  exportMarkdown(content: string): Promise<boolean>
}
