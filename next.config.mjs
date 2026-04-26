/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: { serverActions: { bodySizeLimit: '10mb' } },
  // pdfkit reads font files from disk at runtime — leave external
  serverExternalPackages: ['pdfkit'],
};
export default nextConfig;
