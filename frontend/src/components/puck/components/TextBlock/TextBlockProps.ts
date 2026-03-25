export interface TextBlockProps {
  text: string
  type?: 'paragraph' | 'heading' | 'subheading' | 'quote'
  alignment?: 'left' | 'center' | 'right' | 'justify'
  fontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
  textFormat?: string
  color?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  lineHeight?: 'tight' | 'normal' | 'relaxed'
  padding?: string
}
