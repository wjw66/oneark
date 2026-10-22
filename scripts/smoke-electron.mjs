import assert from 'node:assert/strict'
import { mkdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { _electron as electron } from 'playwright'

const packaged = process.argv.includes('--packaged')
const executablePath =
  process.env.ONEARK_EXECUTABLE ||
  (process.platform === 'darwin'
    ? join(process.cwd(), 'dist/mac-arm64/OneArk.app/Contents/MacOS/OneArk')
    : join(process.cwd(), 'dist/win-unpacked/OneArk.exe'))
const application = await electron.launch({
  ...(packaged ? { executablePath } : { args: ['.'] }),
  timeout: 30_000,
  env: { ...process.env, ELECTRON_RUN_AS_NODE: undefined }
})

try {
  const page = await application.firstWindow()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.getByTestId('native-status').filter({ hasText: '本机连接正常' }).waitFor()
  const info = await page.evaluate(() => window.oneark.getAppInfo())
  assert.equal(info.version, '0.1.0')
  assert.equal(typeof info.native.architecture, 'string')
  const globals = await page.evaluate(() => ({
    require: typeof window.require,
    process: typeof window.process,
    methods: Object.keys(window.oneark)
  }))
  assert.deepEqual(globals, {
    require: 'undefined',
    process: 'undefined',
    methods: ['getAppInfo', 'exportMarkdown']
  })
  const preferences = await application.evaluate(({ BrowserWindow }) => {
    const window = BrowserWindow.getAllWindows()[0]
    return window.webContents.getLastWebPreferences()
  })
  assert.equal(preferences.sandbox, true)
  assert.equal(preferences.contextIsolation, true)
  assert.equal(preferences.nodeIntegration, false)
  await mkdir('test-results', { recursive: true })
  await page.screenshot({ path: `test-results/${packaged ? 'packaged' : 'development'}.png` })
  const editor = page.getByRole('textbox', { name: '文档内容' })
  assert.equal(await page.getByRole('textbox').count(), 1)
  assert.equal(
    await page.locator('.cm-editor, .panes, [data-testid="markdown-preview"]').count(),
    0
  )
  assert.equal(await editor.getByRole('heading', { name: '从一份记录开始' }).count(), 1)
  assert.equal(await editor.getByRole('table').count(), 1)
  const task = editor.getByRole('checkbox').first()
  await task.check()

  async function exportDocument(name) {
    const path = join(process.cwd(), 'test-results', name)
    // 仅替换路径选择对话框；序列化、IPC 和磁盘写入仍走真实实现。
    await application.evaluate(({ dialog }, path) => {
      dialog.showSaveDialog = async () => ({ canceled: false, filePath: path })
    }, path)
    await page.getByRole('button', { name: '导出 Markdown', exact: true }).click()
    await page
      .getByRole('button', { name: '导出 Markdown', exact: true })
      .waitFor({ state: 'visible' })
    await page.waitForFunction(() => !document.querySelector('.export-button').disabled)
    assert.equal(await page.getByRole('alert').count(), 0)
    return readFile(path, 'utf8')
  }

  const original = await exportDocument('initial.md')
  assert.match(original, /^# 从一份记录开始/m)
  assert.match(original, /\|\s*材料\s*\|\s*记录方式\s*\|/)
  assert.match(original, /- \[x\] 写下今天最想保留的一件事/)

  await editor.fill('验证编辑链路')
  await editor.press('ControlOrMeta+a')
  await page.getByRole('button', { name: '加粗', exact: true }).click()
  await editor.locator('strong').filter({ hasText: '验证编辑链路' }).waitFor()
  await page.getByRole('button', { name: '撤销', exact: true }).click()
  assert.equal(await editor.locator('strong').count(), 0)
  await page.getByRole('button', { name: '重做', exact: true }).click()
  await editor.locator('strong').filter({ hasText: '验证编辑链路' }).waitFor()
  const markdown = await exportDocument('edited.md')
  assert.match(markdown, /\*\*验证编辑链路\*\*/)
  await page.setViewportSize({ width: 760, height: 600 })
  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  )
  assert.equal(horizontalOverflow, false)
  assert.equal(await page.locator('svg[aria-label="OneArk 标记"]').count(), 1)
  assert.deepEqual(errors, [])
  console.log(
    JSON.stringify(
      {
        packaged,
        ...info,
        checks: '原生调用、IPC、隔离配置、单栏编辑、格式操作、撤销重做、Markdown 导出与 SVG 均通过'
      },
      null,
      2
    )
  )
} finally {
  await application.close()
}
