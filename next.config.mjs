/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  reactStrictMode: true,
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      oneOf: [
        {
          resourceQuery: /url/, // import logo from './logo.svg?url' → ได้ .src
          type: 'asset/resource',
        },
        {
          use: ['@svgr/webpack'], // import Logo from './logo.svg' → ได้ Component
        },
      ],
    });
    return config;
  },
};

export default nextConfig;