import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import svgr from 'vite-plugin-svgr'

// Plugin để đảm bảo các đường dẫn assets trong HTML là tuyệt đối
const absoluteAssetPaths = () => {
  return {
    name: 'absolute-asset-paths',
    transformIndexHtml(html) {
      // Thay thế các đường dẫn tương đối ./assets/ thành /assets/
      return html.replace(/\.\/assets\//g, '/assets/')
    },
  }
}

export default defineConfig({
  // cho phép vite sử dụng process.env.BUILD_MODE (hoặc các biến khác), mặc định thì không
  define: {
    // 'process.env': process.env,
    'process.env.BUILD_MODE': JSON.stringify(process.env.BUILD_MODE),
  },
  plugins: [react(), svgr(), absoluteAssetPaths()],
  base: '/',
  build: {
    rollupOptions: {
      output: {
        // Đảm bảo các đường dẫn assets là tuyệt đối, không phải tương đối
        assetFileNames: 'assets/[name]-[hash][extname]',
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        // Tách vendor (thư viện bên thứ 3) ra file riêng để cache tốt hơn
        manualChunks: (id) => {
          // Tách node_modules ra thành vendor chunk
          if (id.includes('node_modules')) {
            // Tách Material-UI ra chunk riêng vì nó rất lớn
            if (id.includes('@mui')) {
              return 'vendor-mui'
            }
            // Tách các thư viện lớn khác
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react'
            }
            // Các thư viện còn lại
            return 'vendor'
          }
        },
      },
    },
  },
  resolve: {
    alias: [{ find: '~', replacement: '/src' }],
  },
})
