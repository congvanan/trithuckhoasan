'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getMediaUrl } from '@/lib/utils/media'

function getInitials(name: string) {
  const parts = name.replace(/^(BS|BSCKI|BSCKII|ThS|PGS|GS)\.?\s*/i, '').trim().split(' ')
  return parts.slice(-2).map(w => w[0] ?? '').join('').toUpperCase()
}

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
  mediaId: 'e1fcfee7-467d-8f5b-f997-3a201d05d2e7',
  profileUrl: '/bac-si/tran-thi-mai-hoa',
}

export function DoctorSidebar({ doctor = DEFAULT_DOCTOR }: { doctor?: DoctorInfo }) {
  const mediaUrl = getMediaUrl(doctor.mediaId)

  return (
    <aside className="sticky top-24 w-full">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-5 text-center">
        {/* Avatar */}
        <div className="flex justify-center mb-3">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-100 dark:border-blue-900 bg-blue-100">
            {mediaUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl}
                alt={doctor.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-blue-700 font-bold text-2xl select-none">
                {getInitials(doctor.name)}
              </div>
            )}
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
