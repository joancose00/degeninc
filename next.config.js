/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    return config
  },
  // Add configuration for static export
  output: 'export',
  images: {
    unoptimized: true
  },
}

module.exports = nextConfig