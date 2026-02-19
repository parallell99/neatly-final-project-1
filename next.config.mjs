/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  reactStrictMode: true,
  
  turbopack: {
    // เพิ่มบรรทัดนี้เพื่อระบุ root directory
    root: process.cwd(),
    
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
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