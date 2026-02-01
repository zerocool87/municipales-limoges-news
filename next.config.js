/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow dev origins that make cross-origin requests to /_next in development
  // Adjust the ports if you use a different dev server port
  allowedDevOrigins: [
    // Common dev hosts and ports we might run on locally
    'http://127.0.0.1:3000',
    'http://localhost:3000',
    'http://127.0.0.1:3001',
    'http://localhost:3001',
    'http://127.0.0.1:3002',
    'http://localhost:3002',
    'http://127.0.0.1',
    'http://localhost'
  ]
};

export default nextConfig;
