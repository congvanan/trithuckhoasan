import React from 'react'
import { RichTextField } from '../../fields/RichTextField'

export const TextBlockFields = {
  text: {
    type: 'custom' as const,
    label: 'Nội dung',
    render: ({ value, onChange }: { value: string; onChange: (v: string) => void }) =>
      React.createElement(RichTextField, { value, onChange }),
  },
  alignment: {
    type: 'select' as const,
    label: 'Alignment',
    options: [
      { label: 'Left', value: 'left' },
      { label: 'Center', value: 'center' },
      { label: 'Right', value: 'right' },
      { label: 'Justify', value: 'justify' },
    ],
  },
  fontSize: {
    type: 'select' as const,
    label: 'Font Size',
    options: [
      { label: 'Small', value: 'sm' },
      { label: 'Base', value: 'base' },
      { label: 'Large', value: 'lg' },
      { label: 'Extra Large', value: 'xl' },
      { label: '2XL', value: '2xl' },
      { label: '3XL', value: '3xl' },
    ],
  },
  maxWidth: {
    type: 'select' as const,
    label: 'Max Width',
    options: [
      { label: 'Small', value: 'sm' },
      { label: 'Medium', value: 'md' },
      { label: 'Large', value: 'lg' },
      { label: 'Extra Large', value: 'xl' },
      { label: 'Full', value: 'full' },
    ],
  },
  lineHeight: {
    type: 'select' as const,
    label: 'Line Height',
    options: [
      { label: 'Tight', value: 'tight' },
      { label: 'Normal', value: 'normal' },
      { label: 'Relaxed', value: 'relaxed' },
    ],
  },
  padding: {
    type: 'text' as const,
    label: 'Padding (CSS value)',
  },
}
