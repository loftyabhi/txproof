/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        ADMIN_ADDRESS: process.env.ADMIN_ADDRESS,
    },
};

export default nextConfig;
