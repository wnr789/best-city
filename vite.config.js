import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// base './' ทำให้ใช้ได้กับ GitHub Pages ทุกชื่อ repo
export default defineConfig({
  base: '/best-city/', // เพิ่มบรรทัดนี้เข้าไป
  plugins: [react()],
})
