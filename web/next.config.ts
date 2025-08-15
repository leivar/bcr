const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: (process.env.SERVER_ORIGIN || "http://localhost:4000") + "/api/:path*"
      }
    ];
  }
};
module.exports = nextConfig;
