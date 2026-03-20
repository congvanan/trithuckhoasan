'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getMediaUrl, getAvatarFallback } from '@/lib/utils/media'

export type DoctorInfo = {
  name: string
  specialty: string
  hospital: string
  mediaId?: string
  profileUrl?: string
}

const DEFAULT_DOCTOR: DoctorInfo = {
  name: 'BSCKI Trần Thị Mai Hoa',
  specialty: 'Khoa Sản - Phụ khoa · Phó Trưởng khoa · Cơ sở Yên Ninh',
  hospital: 'Bệnh viện Đa khoa Hồng Ngọc - Yên Ninh',
  mediaId: undefined, // TODO: paste mediaId sau khi upload lên ABP Admin
  profileUrl: '/bac-si/tran-thi-mai-hoa',
}

export function DoctorSidebar({ doctor = DEFAULT_DOCTOR }: { doctor?: DoctorInfo }) {
  const imageSrc = getMediaUrl(doctor.mediaId) ?? getAvatarFallback(doctor.name, 96)

  return (
    <aside className="sticky top-24 w-full">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-5 text-center">
        {/* Avatar */}
        <div className="flex justify-center mb-3">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-100 dark:border-blue-900 bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt={doctor.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = getAvatarFallback(doctor.name, 96)
              }}
            />
          </div>
        </div>

        {/* Specialty */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 leading-snug">
          {doctor.specialty}
        </p>

        {/* Name */}
        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-base mb-1">
          {doctor.name}
        </h3>

        {/* Hospital */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-snug">
          {doctor.hospital}
        </p>

        {/* Link */}
        <Link
          href={doctor.profileUrl ?? '#'}
          className="inline-flex items-center gap-1 text-sm text-teal-600 dark:text-teal-400 font-medium hover:underline"
        >
          Xem thông tin Bác sĩ
          <ChevronRight className="w-4 h-4" />
          <ChevronRight className="w-4 h-4 -ml-3" />
        </Link>
      </div>
    </aside>
  )
}
