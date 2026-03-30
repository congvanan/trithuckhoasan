// Suppress Node.js TLS warning khi dùng self-signed cert ở local dev
// (NODE_TLS_REJECT_UNAUTHORIZED=0 được set trong .env.local cho backend localhost)
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
  const _emit = process.emit.bind(process)
  process.emit = function (event, ...args) {
    if (event === 'warning' && args[0]?.message?.includes('NODE_TLS_REJECT_UNAUTHORIZED')) {
      return false
    }
    return _emit(event, ...args)
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
