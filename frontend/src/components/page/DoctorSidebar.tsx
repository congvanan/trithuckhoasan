'use client'

import Link from 'next/link'
import { ChevronRight, Stethoscope, MapPin, Phone } from 'lucide-react'
import { getMediaUrl } from '@/lib/utils/media'
import { DOCTORS } from '@/lib/data/doctors'

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
  phone?: string
}

const firstDoctor = DOCTORS[0]
const DEFAULT_DOCTOR: DoctorInfo = {
  name: `${firstDoctor.title} ${firstDoctor.name}`,
  specialty: `${firstDoctor.specialty} · ${firstDoctor.currentPosition}`,
  hospital: firstDoctor.hospital,
  mediaId: firstDoctor.mediaId,
  profileUrl: `/bac-si/${firstDoctor.slug}`,
  phone: firstDoctor.phone,
}

export function DoctorSidebar({ doctor = DEFAULT_DOCTOR }: { doctor?: DoctorInfo }) {
  const mediaUrl = getMediaUrl(doctor.mediaId)

  return (
    <aside className="sticky top-24 w-full">
      <div className="rounded-2xl overflow-hidden shadow-lg border border-teal-100">
        {/* Header gradient */}
        <div className="relative bg-gradient-to-br from-[#0f766e] via-[#0d9488] to-[#14b8a6] px-5 pt-6 pb-20">
          <div className="flex items-center gap-1.5 text-teal-100 text-xs font-semibold uppercase tracking-wider mb-1">
            <Stethoscope className="w-3.5 h-3.5" />
            Bác sĩ tư vấn
          </div>
          <p className="text-white/80 text-xs leading-snug">{doctor.specialty}</p>
        </div>

        {/* Avatar — overlap header */}
        <div className="relative bg-white dark:bg-gray-800 px-5 pt-0 pb-5">
          <div className="flex justify-center -mt-16 mb-3">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-teal-50">
              {mediaUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaUrl} alt={doctor.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-teal-700 font-bold text-3xl">
                  {getInitials(doctor.name)}
                </div>
              )}
            </div>
          </div>

          {/* Name */}
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg text-center leading-snug mb-1">
            {doctor.name}
          </h3>

          {/* Hospital */}
          <div className="flex items-start justify-center gap-1 text-xs text-gray-500 dark:text-gray-400 text-center mb-4">
            <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-teal-500" />
            <span className="leading-snug">{doctor.hospital}</span>
          </div>

          {/* Phone CTA */}
          {doctor.phone && (
            <a
              href={`tel:${doctor.phone.replace(/\s/g, '')}`}
              className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl mb-3
                bg-gradient-to-r from-orange-500 to-amber-400 text-white
                shadow-md shadow-orange-400/30 hover:shadow-lg hover:shadow-orange-400/40
                hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20">
                <Phone className="w-4 h-4" />
              </span>
              <div className="text-left">
                <div className="text-[10px] font-medium opacity-90 uppercase tracking-wide">Đặt lịch tư vấn</div>
                <div className="text-base font-bold tracking-wide">{doctor.phone}</div>
              </div>
            </a>
          )}

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-teal-200 to-transparent mb-3" />

          {/* Profile link */}
          <Link
            href={doctor.profileUrl ?? '#'}
            className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl
              border-2 border-[#0f766e] text-[#0f766e] text-sm font-semibold
              hover:bg-[#0f766e] hover:text-white
              transition-all duration-200"
          >
            Xem hồ sơ Bác sĩ
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </aside>
  )
}
