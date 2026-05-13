import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

const PDF_DIR_DEV = path.resolve(__dirname, 'public')
const PDF_DIR_PROD = path.resolve(__dirname, 'dist')

function servePdfInline(fileRoot) {
  return (req, res, next) => {
    const url = req.url?.split('?')[0]
    if (!url?.endsWith('.pdf')) return next()

    const filePath = path.join(fileRoot, url.replace(/^\//, ''))
    if (!fs.existsSync(filePath)) return next()

    const stat = fs.statSync(filePath)
    const fileSize = stat.size
    const range = req.headers.range

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'inline')
    res.setHeader('Accept-Ranges', 'bytes')

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
      const chunkSize = end - start + 1

      res.statusCode = 206
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`)
      res.setHeader('Content-Length', chunkSize)
      fs.createReadStream(filePath, { start, end }).pipe(res)
    } else {
      res.setHeader('Content-Length', fileSize)
      fs.createReadStream(filePath).pipe(res)
    }
  }
}

const pdfInlinePlugin = {
  name: 'pdf-inline-headers',
  configureServer(server) {
    server.middlewares.stack.unshift({
      route: '',
      handle: servePdfInline(PDF_DIR_DEV),
    })
  },
  configurePreviewServer(server) {
    server.middlewares.stack.unshift({
      route: '',
      handle: servePdfInline(PDF_DIR_PROD),
    })
  },
}

export default defineConfig({
  plugins: [react(), pdfInlinePlugin],
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
