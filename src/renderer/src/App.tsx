import { useEffect, useState } from 'react'
import { MarkdownEditor } from './MarkdownEditor'
import type { AppInfo } from '../../shared/contracts'

const sample = `# 从一份记录开始

把刚刚发生的事、还没成形的想法，留在这里。

## 让记录自然发生

直接点击文字就能编辑。选中内容，可以用上方工具栏调整格式，也可以使用 **⌘ / Ctrl + B** 加粗、**⌘ / Ctrl + I** 设置斜体。

- 记下一次会议中的关键决定
- 收集值得反复阅读的材料
- 把零散的灵感整理成自己的笔记

> 材料留在本地，价值由你掌握。

## 给下一步留一点空间

- [ ] 写下今天最想保留的一件事
- [ ] 为这个想法补充一个例子

| 材料 | 记录方式 |
| --- | --- |
| 想法与笔记 | 直接编辑文字 |
| 会议与讨论 | 留下关键结论 |
`

export default function App(): React.JSX.Element {
  const [edited, setEdited] = useState(false)
  const [info, setInfo] = useState<AppInfo | null>(null)
  const [error, setError] = useState('')

  async function checkRuntime(): Promise<void> {
    setError('')
    try {
      setInfo(await window.oneark.getAppInfo())
    } catch (cause) {
      setInfo(null)
      setError(cause instanceof Error ? cause.message : '应用信息读取失败')
    }
  }

  useEffect(() => {
    let active = true
    window.oneark.getAppInfo().then(
      (value) => {
        if (active) setInfo(value)
      },
      (cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : '应用信息读取失败')
      }
    )
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <svg width="28" height="28" viewBox="0 0 32 32" role="img" aria-label="OneArk 标记">
            <path d="M5 21h22l-5 7H10z" fill="currentColor" />
            <path d="M15 4v14H6zM18 8l8 10h-8z" fill="currentColor" opacity=".65" />
          </svg>
          <strong>OneArk</strong>
        </div>
        <span className="header-caption">个人资产工作台</span>
      </header>
      <main>
        <div className="document-heading">
          <div className="breadcrumb">
            <span>笔记</span>
            <span aria-hidden="true">/</span>
            <h1>开始记录.md</h1>
          </div>
          <span className="document-state" aria-live="polite">
            {edited ? '已编辑 · 尚未保存' : '临时文档'}
          </span>
        </div>
        <section className="workspace" aria-label="笔记编辑区">
          <MarkdownEditor initialValue={sample} onChange={() => setEdited(true)} />
        </section>
        <p className="document-hint">
          点击文字即可编辑，导出为 Markdown 留存。当前示例不会自动保存。
        </p>
      </main>
      <footer>
        <span>本地优先，记录归你。</span>
        <div className="runtime" aria-live="polite">
          <span data-testid="native-status" className={error ? 'status error' : 'status'}>
            {error ? '本机连接失败' : info ? '本机连接正常' : '正在连接…'}
          </span>
          {error && <span role="alert">{error}</span>}
          <button className="runtime-button" onClick={() => void checkRuntime()}>
            检查连接
          </button>
        </div>
      </footer>
    </div>
  )
}
