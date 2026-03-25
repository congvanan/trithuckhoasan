'use client'

import { TextBlockProps } from './TextBlockProps'

export const TextBlock = ({
  text,
  maxWidth = 'full',
  lineHeight = 'normal',
  padding = '16px',
}: TextBlockProps) => {
  const safeText = typeof text === 'string' ? text : 'Enter your text content here...'

  const isHtml = safeText.trim().startsWith('<')

  const maxWidthMap: Record<string, string> = {
    sm: '24rem', md: '28rem', lg: '32rem', xl: '36rem', full: '100%',
  }
  const lineHeightMap: Record<string, string> = {
    tight: '1.25', normal: '1.5', relaxed: '1.75',
  }

  const wrapperStyle: React.CSSProperties = {
    padding,
    maxWidth: maxWidthMap[maxWidth] ?? '100%',
    margin: '0 auto',
    lineHeight: lineHeightMap[lineHeight] ?? '1.5',
  }

  if (isHtml) {
    return (
      <div
        style={wrapperStyle}
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: safeText }}
      />
    )
  }

  return (
    <div style={wrapperStyle}>
      <p>{safeText}</p>
    </div>
  )
}
