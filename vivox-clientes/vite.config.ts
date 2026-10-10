import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    {
      name: 'kanban-static-index',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === '/kanban/' || req.url?.startsWith('/kanban/?')) {
            req.url = req.url.replace('/kanban/', '/kanban/index.html')
          }
          next()
        })
      },
    },
    react(),
    tailwindcss(),
  ],
})
