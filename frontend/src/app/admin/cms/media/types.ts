export type UploadedMedia = {
  id: string
  name: string
  url: string
  uploadedAt: string
  doctorSlug?: string
  title?: string
}

export type BannerPost = {
  id: string
  title: string
  slug: string
  imageUrl: string
  caption: string
  status: number           // 0=Draft/Ẩn, 1=Published/Hiển thị
  order: number            // thứ tự hiển thị (lấy từ prefix shortDescription)
  concurrencyStamp?: string | null
  rawShortDescription: string
}

export type UploadStatus = {
  name: string
  status: 'uploading' | 'success' | 'error'
  message?: string
}

export type Tab = 'doctor' | 'banner' | 'gallery'

export type SlideForm = {
  mediaItem: UploadedMedia
  title: string
  caption: string
  saving: boolean
}
