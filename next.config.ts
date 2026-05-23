import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow cross-origin dev requests from common LAN ranges + the
  // current network IP so the dev server accepts requests when you
  // open the site from your phone or another device on the network.
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.0.0/16",
    "192.168.1.1",
    "192.168.56.1",
    "10.0.0.0/8",
    "172.16.0.0/12",
    "*.local",
    "*.localhost",
  ],
};

export default nextConfig;
