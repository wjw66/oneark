import { useState } from 'react'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from '@tiptap/markdown'
import { TableKit } from '@tiptap/extension-table'
import { TaskItem, TaskList } from '@tiptap/extension-list'

interface Props {
  initialValue: string
  onChange(value: string): void
}

export function MarkdownEditor({ initialValue, onChange }: Props): React.JSX.Element {
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false, autolink: false },
        underline: false
      }),
      Markdown.configure({ markedOptions: { gfm: true } }),
      TableKit,
      TaskList,
      TaskItem.configure({
        nested: true,
        a11y: { checkboxLabel: (node) => `任务：${node.textContent || '未命名任务'}` }
      })
    ],
    content: initialValue,
    contentType: 'markdown',
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-label': '文档内容',
        'aria-multiline': 'true',
        spellcheck: 'false'
      },
      // 笔记中的链接仅供编辑，避免点击或粘贴链接时离开应用。
      handleClick: (_view, _position, event) => {
        const target = event.target
        return target instanceof Element && target.closest('a') !== null
      }
    },
    onUpdate: ({ editor }) => onChange(editor.getMarkdown())
  })
  const state = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) return null
      return {
        paragraph: editor.isActive('paragraph'),
        h1: editor.isActive('heading', { level: 1 }),
        h2: editor.isActive('heading', { level: 2 }),
        bold: editor.isActive('bold'),
        italic: editor.isActive('italic'),
        bullet: editor.isActive('bulletList'),
        ordered: editor.isActive('orderedList'),
        quote: editor.isActive('blockquote'),
        code: editor.isActive('codeBlock'),
        canUndo: editor.can().undo(),
        canRedo: editor.can().redo()
      }
    }
  })

  async function exportMarkdown(): Promise<void> {
    if (!editor || exporting) return
    setExporting(true)
    setExportError('')
    try {
      await window.oneark.exportMarkdown(editor.getMarkdown())
    } catch (cause) {
      setExportError(cause instanceof Error ? cause.message : '导出失败，请重试')
    } finally {
      setExporting(false)
    }
  }

  const tools = [
    {
      label: '正文',
      text: '正文',
      active: state?.paragraph,
      run: () => editor?.chain().focus().setParagraph().run()
    },
    {
      label: '一级标题',
      text: 'H1',
      active: state?.h1,
      run: () => editor?.chain().focus().toggleHeading({ level: 1 }).run()
    },
    {
      label: '二级标题',
      text: 'H2',
      active: state?.h2,
      run: () => editor?.chain().focus().toggleHeading({ level: 2 }).run()
    },
    {
      label: '加粗',
      text: 'B',
      active: state?.bold,
      run: () => editor?.chain().focus().toggleBold().run()
    },
    {
      label: '斜体',
      text: 'I',
      active: state?.italic,
      run: () => editor?.chain().focus().toggleItalic().run()
    },
    {
      label: '无序列表',
      text: '• 列表',
      active: state?.bullet,
      run: () => editor?.chain().focus().toggleBulletList().run()
    },
    {
      label: '有序列表',
      text: '1. 列表',
      active: state?.ordered,
      run: () => editor?.chain().focus().toggleOrderedList().run()
    },
    {
      label: '引用',
      text: '引用',
      active: state?.quote,
      run: () => editor?.chain().focus().toggleBlockquote().run()
    },
    {
      label: '代码块',
      text: '</>',
      active: state?.code,
      run: () => editor?.chain().focus().toggleCodeBlock().run()
    }
  ]

  return (
    <div className="document-editor">
      <div className="format-bar" role="toolbar" aria-label="文字格式">
        <div className="format-tools">
          {tools.map((tool) => (
            <button
              key={tool.label}
              type="button"
              aria-label={tool.label}
              aria-pressed={Boolean(tool.active)}
              title={tool.label}
              disabled={!editor}
              onMouseDown={(event) => event.preventDefault()}
              onClick={tool.run}
            >
              {tool.text}
            </button>
          ))}
          <span className="tool-separator" />
          <button
            type="button"
            aria-label="撤销"
            title="撤销"
            disabled={!state?.canUndo}
            onClick={() => editor?.chain().focus().undo().run()}
          >
            ↶
          </button>
          <button
            type="button"
            aria-label="重做"
            title="重做"
            disabled={!state?.canRedo}
            onClick={() => editor?.chain().focus().redo().run()}
          >
            ↷
          </button>
        </div>
        <button
          type="button"
          className="export-button"
          onClick={() => void exportMarkdown()}
          disabled={!editor || exporting}
        >
          导出 Markdown
        </button>
      </div>
      {exportError && (
        <p className="editor-error" role="alert">
          {exportError}
        </p>
      )}
      <EditorContent editor={editor} className="editor-canvas" />
    </div>
  )
}
