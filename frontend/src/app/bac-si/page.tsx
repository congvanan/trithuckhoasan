import { DOCTORS } from '@/lib/data/doctors'
import { getMediaUrl } from '@/lib/utils/media'
import { ChevronRight, Briefcase } from 'lucide-react'
import Link from 'next/link'

function getInitials(name: string) {
  const parts = name.replace(/^(BS|BSCKI|BSCKII|ThS|PGS|GS)\.?\s*/i, '').trim().split(' ')
  return parts.slice(-2).map((w: string) => w[0] ?? '').join('').toUpperCase()
}

export default function DoctorListPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container max-w-5xl mx-auto px-4 py-2.5 flex items-center gap-1.5 text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600">Trang chủ</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-blue-600 font-medium">Danh sách bác sĩ</span>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-blue-700 border-b-2 border-blue-600 pb-2 mb-6 uppercase">
          Đội ngũ bác sĩ
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {DOCTORS.map((doctor) => {
            const mediaUrl = getMediaUrl(doctor.mediaId)
            return (
              <Link
                key={doctor.slug}
                href={`/bac-si/${doctor.slug}`}
                className="bg-white rounded-xl border hover:shadow-md transition-shadow group"
              >
                <div className="flex flex-col items-center p-6 text-center">
                  {/* Avatar */}
                  <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-blue-100 bg-blue-100 mb-4 flex items-center justify-center">
                    {mediaUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mediaUrl}
                        alt={doctor.name}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <span className="text-blue-700 font-bold text-3xl select-none">
                        {getInitials(doctor.name)}
                      </span>
                    )}
                  </div>

                  {/* Title badge */}
                  <span className="text-xs border border-gray-300 text-gray-500 rounded px-2 py-0.5 mb-2">
                    {doctor.title}
                  </span>

                  {/* Name */}
                  <h2 className="font-bold text-gray-800 text-base group-hover:text-blue-600 transition-colors mb-1">
                    {doctor.name}
                  </h2>

                  {/* Specialty */}
                  <p className="text-sm text-gray-500 mb-1">{doctor.specialty}</p>

                  {/* Hospital */}
                  <p className="text-xs text-gray-400 mb-3">{doctor.hospital}</p>

                  {/* Position */}
                  <div className="flex items-center gap-1 text-xs text-teal-600">
                    <Briefcase className="w-3 h-3" />
                    {doctor.currentPosition}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
