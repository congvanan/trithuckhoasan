/**
 * Doctor data — images are stored in ABP CmsKit Media (blob storage).
 * Upload ảnh qua Admin → CMS → Media, copy mediaId paste vào đây.
 * URL ảnh sẽ được build tự động bởi getMediaUrl(mediaId).
 */
export type Doctor = {
  slug: string
  name: string
  title: string
  specialty: string
  hospital: string
  mediaId?: string        // ID từ ABP Media (upload qua Admin CMS)
  currentPosition: string
  education: string[]
  degrees: string[]
  bio?: string
}

export const DOCTORS: Doctor[] = [
  {
    slug: 'tran-thi-mai-hoa',
    name: 'Trần Thị Mai Hoa',
    title: 'BSCKI',
    specialty: 'Khoa Sản - Phụ khoa',
    hospital: 'Bệnh viện Đa khoa Hồng Ngọc - Yên Ninh',
    mediaId: '3a205a29-8811-4160-0d68-e615bdf128a3', // TODO: upload ảnh lên Admin → CMS → Media, paste mediaId vào đây
    currentPosition: 'Phó Trưởng khoa - Cơ sở Yên Ninh',
    education: ['Tốt nghiệp ĐH Y Hà Nội', 'Bác sĩ Chuyên khoa I'],
    degrees: ['Bác sĩ Chuyên khoa I'],
  },
]

export function getDoctorBySlug(slug: string): Doctor | undefined {
  return DOCTORS.find((d) => d.slug === slug)
}
