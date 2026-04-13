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
  bio?: string[]          // Hoạt động chuyên ngành (danh sách)
  languages?: string[]    // Ngôn ngữ
  phone?: string          // Số điện thoại liên hệ
}

export const DOCTORS: Doctor[] = [
  {
    slug: 'tran-thi-mai-hoa',
    name: 'Trần Thị Mai Hoa',
    title: 'BSCKI',
    specialty: 'Khoa Sản - Phụ khoa',
    hospital: 'Bệnh viện Đa khoa Hồng Ngọc - Yên Ninh',
    mediaId: '3a205a29-8811-4160-0d68-e615bdf128a3',
    currentPosition: 'Phó Trưởng khoa - Cơ sở Yên Ninh',
    education: [
      '2014: Tốt nghiệp ĐH Y Hà Nội',
      '2019: Tốt nghiệp loại Giỏi khóa đào tạo BS chuyên khoa cấp 1 – trường Đại học Y Hà Nội',
      'Chứng chỉ siêu âm sản phụ khoa tại BV Phụ Sản Trung Ương',
      'Chứng chỉ PT nội soi tại BV Phụ Sản Trung Ương',
      'Chứng chỉ phẫu thuật ung thư phụ khoa tại Bệnh Viện K Tân Triều',
      'Chứng chỉ kỹ thuật soi đốt cổ tử cung – Bệnh viện Phụ Sản Trung Ương',
      'Chứng chỉ tư vấn kế hoạch hóa gia đình, chứng chỉ về nội tiết mãn kinh - tiền mãn kinh',
    ],
    degrees: ['Bác sĩ Chuyên khoa I'],
    bio: [
      '2014 - Nay: Công tác tại Bệnh viện Đa khoa Hồng Ngọc',
      'Quản lý thai nghén các trường hợp khó, mẹ có bệnh nền: đái tháo đường, tăng huyết áp...',
      'Thực hiện nhiều ca mổ đẻ phức tạp: mổ đẻ cũ, rau tiền đạo, rau bong non, tiền sản giật...',
      'Khám, sàng lọc, điều trị các tổn thương lành tính/ ác tính ở tử cung, cổ tử cung: polyp cổ tử cung, polyp thân tử cung, tổn thương bất thường cổ tử cung, u xơ tử cung, lạc nội mạc tử cung.',
      'Thực hiện phẫu thuật phụ khoa: soi buồng tử cung cắt polyp, khoét chóp cổ tử cung, cắt LEEP cổ tử cung, bóc u xơ tử cung, lạc nội mạc tử cung - buồng trứng, bệnh tuyến Bartholine',
    ],
    languages: ['Anh'],
    phone: '0396 066 556',
  },
]

export function getDoctorBySlug(slug: string): Doctor | undefined {
  return DOCTORS.find((d) => d.slug === slug)
}
