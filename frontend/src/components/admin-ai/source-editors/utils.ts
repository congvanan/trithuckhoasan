export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'))
    reader.onload = () => {
      const result = String(reader.result ?? '')
      resolve(result.includes(',') ? result.split(',')[1] : result)
    }
    reader.readAsDataURL(file)
  })
}

export type EditorProps = {
  value: string
  onChange: (v: string) => void
}

export function parseConfig(value: string): Record<string, string> {
  try {
    return JSON.parse(value || '{}') as Record<string, string>
  } catch {
    return {}
  }
}
