// CommonJS config for Next.js (preferred when `package.json` has "type": "module")
module.exports = {
  // Allow dev origins that make cross-origin requests to /_next in development
  // Add the ports you use for dev if different
  allowedDevOrigins: [
    'http://127.0.0.1:3000',
    'http://localhost:3000',
    'http://127.0.0.1',
    'http://localhost'
  ]
};
