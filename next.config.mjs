/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'ucarecdn.com'
            }
        ]
    },
    experimental: {
        serverComponentsExternalPackages: ['@prisma/client']
    }
};

export default nextConfig;
