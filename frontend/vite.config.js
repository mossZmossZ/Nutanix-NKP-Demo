import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const S3_PDF_URL = 'https://nkp-demo-s3.nattavee.com/NKP-Setup-Guide.pdf'

const pdfProxyPlugin = {
  name: 'pdf-s3-proxy',
  configureServer(server) {
    server.middlewares.stack.unshift({
      route: '',
      handle: async (req, res, next) => {
        if (req.url?.split('?')[0] !== '/NKP-Setup-Guide.pdf') return next()

        try {
          const fetchOpts = {}
          if (req.headers.range) {
            fetchOpts.headers = { Range: req.headers.range }
          }

          const upstream = await fetch(S3_PDF_URL, fetchOpts)

          res.statusCode = upstream.status
          res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/pdf')
          res.setHeader('Content-Disposition', 'inline')
          res.setHeader('Accept-Ranges', 'bytes')
          res.setHeader('Access-Control-Allow-Origin', '*')

          const contentLength = upstream.headers.get('content-length')
          if (contentLength) res.setHeader('Content-Length', contentLength)

          const contentRange = upstream.headers.get('content-range')
          if (contentRange) res.setHeader('Content-Range', contentRange)

          const etag = upstream.headers.get('etag')
          if (etag) res.setHeader('ETag', etag)

          if (upstream.body) {
            const reader = upstream.body.getReader()
            const pump = async () => {
              while (true) {
                const { done, value } = await reader.read()
                if (done) {
                  res.end()
                  return
                }
                if (!res.write(value)) {
                  await new Promise(r => res.once('drain', r))
                }
              }
            }
            pump()
          } else {
            res.end()
          }
        } catch (err) {
          console.error('[pdf-proxy] Failed to fetch PDF from S3:', err.message)
          res.statusCode = 502
          res.end('Failed to load PDF')
        }
      },
    })
  },
}

export default defineConfig({
  plugins: [react(), pdfProxyPlugin],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['react-pdf'],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
