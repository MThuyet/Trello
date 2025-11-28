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
      },
    },
  },
  resolve: {
    alias: [{ find: '~', replacement: '/src' }],
  },
})
