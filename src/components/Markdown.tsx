import { memo, useMemo } from 'react'
import styles from './Markdown.module.css'

interface MarkdownProps {
  content: string
}

// Enkel markdown-parser uten eksterne avhengigheter
// Støtter: headers, bold, italic, links, lists, paragraphs, escaped chars
function parseMarkdown(markdown: string): string {
  if (!markdown) return ''

  // Placeholder for escaped characters (må gjøres før alt annet)
  const ESCAPED_ASTERISK = '\u0000ASTERISK\u0000'
  const ESCAPED_BACKSLASH = '\u0000BACKSLASH\u0000'

  let html = markdown
    // Håndter escaped backslash først
    .replace(/\\\\/g, ESCAPED_BACKSLASH)
    // Håndter escaped asterisk
    .replace(/\\\*/g, ESCAPED_ASTERISK)
    // Escape HTML for sikkerhet
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Headers (må komme før andre regler)
  html = html.replace(/^### (.+)$/gm, '<h4>$1</h4>')
  html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^# (.+)$/gm, '<h2>$1</h2>')

  // Bold og italic (må håndtere ** før *)
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Gjenopprett escaped characters
  html = html.replace(new RegExp(ESCAPED_ASTERISK, 'g'), '*')
  html = html.replace(new RegExp(ESCAPED_BACKSLASH, 'g'), '\\')

  // Links: [text](url)
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  )

  // Inline code: `code`
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Numbered lists (må komme før unordered)
  html = html.replace(/^(\d+)\. (.+)$/gm, '<li data-num="$1">$2</li>')

  // Unordered lists
  html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>')

  // Wrap consecutive <li> in <ul> eller <ol>
  // Numbered list items
  html = html.replace(
    /(<li data-num="\d+">.+<\/li>\n?)+/g,
    match => `<ol>${match.replace(/ data-num="\d+"/g, '')}</ol>`
  )

  // Unordered list items
  html = html.replace(
    /(<li>.+<\/li>\n?)+/g,
    match => {
      // Ikke wrap hvis allerede i <ol>
      if (match.includes('<ol>')) return match
      return `<ul>${match}</ul>`
    }
  )

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr />')

  // Paragraphs: Wrap linjer som ikke er HTML-elementer
  const lines = html.split('\n')
  const result: string[] = []
  let inParagraph = false

  for (const line of lines) {
    const trimmed = line.trim()

    // Sjekk om linjen starter med et HTML-element
    const isElement = /^<(h[2-4]|ul|ol|li|hr|p)/.test(trimmed)
    const isEmpty = trimmed === ''

    if (isEmpty) {
      if (inParagraph) {
        result.push('</p>')
        inParagraph = false
      }
      continue
    }

    if (isElement) {
      if (inParagraph) {
        result.push('</p>')
        inParagraph = false
      }
      result.push(line)
    } else {
      if (!inParagraph) {
        result.push('<p>')
        inParagraph = true
      }
      result.push(line)
    }
  }

  if (inParagraph) {
    result.push('</p>')
  }

  return result.join('\n')
}

export const Markdown = memo(function Markdown({ content }: MarkdownProps) {
  const html = useMemo(() => parseMarkdown(content), [content])

  return (
    <div
      className={styles.markdown}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
})
