/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  reactStrictMode: true,
  
  // SVG as React component ใช้ได้เมื่อรันด้วย webpack เท่านั้น (npm run dev หรือ next dev --webpack)
  // Turbopack ยังโหลด @svgr/webpack ไม่ได้ จึงไม่ตั้ง rules สำหรับ SVG ใน turbopack
  turbopack: {
    root: process.cwd(),
  },

  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      oneOf: [
        {
          resourceQuery: /url/,
          type: 'asset/resource',
        },
        {
          use: ['@svgr/webpack'],
        },
      ],
    });
    return config;
  },
};

export default nextConfig;