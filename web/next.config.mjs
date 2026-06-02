/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // pino มี dynamic require (thread-stream) → ห้าม bundle, ให้เป็น external (กัน prerender error)
  serverExternalPackages: ["pino"],
};
export default nextConfig;
