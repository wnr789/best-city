import { Component } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// ถ้าเว็บพัง จะแสดงข้อความ error บนหน้าจอแทนหน้าขาว (แคปหน้านี้ส่งมาเพื่อแก้ปัญหาได้เลย)
const box = { padding: 24, margin: 24, background: '#fff3f3', color: '#900', border: '2px solid #c00', borderRadius: 12, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }
const show = (m) => <div style={box}><b>⚠️ เว็บเกิดข้อผิดพลาด</b>{'\n\n'}{m}</div>

class Boundary extends Component {
  state = { err: null }
  static getDerivedStateFromError(err) { return { err } }
  render() { return this.state.err ? show(String(this.state.err.stack || this.state.err).slice(0, 1200)) : this.props.children }
}

const root = createRoot(document.getElementById('root'))
root.render(<Boundary><App /></Boundary>)

// error ที่เกิดนอก React (เช่น โหลดสคริปต์/ข้อมูลไม่ได้)
window.addEventListener('error', (e) => {
  const el = document.getElementById('root')
  if (el && !el.children.length) root.render(show(String(e.message || e.error)))
})
