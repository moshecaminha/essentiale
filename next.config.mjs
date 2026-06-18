/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "acdn-us.mitiendanube.com" },
      { protocol: "https", hostname: "kxjposjzblsjnnxvxnqp.supabase.co" },
    ],
  },
};

export default nextConfig;
