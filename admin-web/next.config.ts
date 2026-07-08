import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-src 'self' https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com; img-src 'self' data: https://i.ytimg.com; frame-ancestors 'self';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
