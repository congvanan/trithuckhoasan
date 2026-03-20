'use client'

import { getDoctorBySlug } from '@/lib/data/doctors'
import { getMediaUrl, getAvatarFallback } from '@/lib/utils/media'
import { ChevronRight, GraduationCap, Award, Briefcase } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function DoctorDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const doctor = getDoctorBySlug(slug)

  if (!doctor) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-2">Không tìm thấy bác sĩ</h2>
        <Link href="/bac-si" className="text-blue-600 hover:underline">
          Quay lại danh sách bác sĩ
        </Link>
      </div>
    )
  }

  const imageSrc = getMediaUrl(doctor.mediaId) ?? getAvatarFallback(doctor.name, 160)

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
            <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">
              Trang chủ
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/bac-si" className="hover:text-blue-600 dark:hover:text-blue-400">
              Danh sách bác sĩ
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-teal-600 dark:text-teal-400 font-medium">Chi tiết bác sĩ</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="flex flex-col md:flex-row gap-0">
            {/* Left: Photo — fixed 200px */}
            <div className="w-full md:w-[200px] shrink-0 flex flex-col items-center justify-start py-6 px-4 bg-white dark:bg-gray-800">
              <div className="w-[160px] h-[200px] overflow-hidden bg-gray-100 mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageSrc}
                  alt={doctor.name}
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = getAvatarFallback(doctor.name, 160)
                  }}
                />
              </div>
              <span className="text-xs border border-gray-400 text-gray-500 rounded px-2 py-0.5 mb-2">
                {doctor.title}
              </span>
              <h2 className="font-bold text-gray-800 dark:text-gray-100 text-center text-sm">
                {doctor.name}
              </h2>
            </div>

            {/* Right: Info — takes remaining space */}
            <div className="flex-1 min-w-0 p-6 md:p-8 border-l border-gray-200 dark:border-gray-700">
              {/* Header */}
              <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">
                  {doctor.title} - {doctor.name}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {doctor.specialty} &nbsp;•&nbsp; {doctor.hospital}
                </p>
              </div>

              {/* Experience section */}
              <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-3">Kinh nghiệm</h3>
              <div className="space-y-2">
                {/* Current position */}
                <div className="flex gap-6 items-start bg-gray-50 dark:bg-gray-900/50 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2 w-36 shrink-0 text-sm text-gray-500 dark:text-gray-400">
                    <Briefcase className="w-4 h-4" />
                    Chức vụ hiện tại
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-200">
                    {doctor.currentPosition}
                  </div>
                </div>

                {/* Education */}
                <div className="flex gap-6 items-start bg-white dark:bg-gray-800 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2 w-36 shrink-0 text-sm text-gray-500 dark:text-gray-400">
                    <GraduationCap className="w-4 h-4" />
                    Học vấn
                  </div>
                  <ul className="text-sm text-gray-700 dark:text-gray-200 space-y-1 list-disc list-inside">
                    {doctor.education.map((edu, i) => (
                      <li key={i}>{edu}</li>
                    ))}
                  </ul>
                </div>

                {/* Degrees */}
                <div className="flex gap-6 items-start bg-gray-50 dark:bg-gray-900/50 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2 w-36 shrink-0 text-sm text-gray-500 dark:text-gray-400">
                    <Award className="w-4 h-4" />
                    Bằng cấp, học vị
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-200">
                    {doctor.degrees.join(', ')}
                  </div>
                </div>
              </div>

              {doctor.bio && (
                <div className="mt-6 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {doctor.bio}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
