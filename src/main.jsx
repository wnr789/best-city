import { Component } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// ถ้าโค้ดพังระหว่างแสดงผล จะขึ้นข้อความแทนจอขาว พร้อมปุ่มล้างข้อมูลแบบร่างในเครื่องนี้
class Boundary extends Component {
  state = { err: null }
  static getDerivedStateFromError(err) { return { err } }
  reset = () => {
    try { ['bestcity_draft_v6', 'bestcity_bgcache', 'bestcity_session', 'bestcity_bgoff'].forEach((k) => localStorage.removeItem(k)) } catch { /* ignore */ }
    location.reload()
  }
  render() {
    if (!this.state.err) return this.props.children
    return (
      <div style={{ maxWidth: 560, margin: '12vh auto', padding: 24, fontFamily: 'sans-serif', color: '#ddd', background: '#1a1230', borderRadius: 16 }}>
        <h2 style={{ marginTop: 0 }}>⚠️ หน้าเว็บทำงานผิดพลาด</h2>
        <p>ลองกดรีเฟรช (Ctrl+Shift+R) ถ้ายังไม่หาย กดปุ่มล้างข้อมูลแบบร่างในเครื่องนี้ (กฎที่เผยแพร่แล้วไม่หาย)</p>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, background: '#0006', padding: 10, borderRadius: 8 }}>{String(this.state.err?.message || this.state.err)}</pre>
        <button onClick={() => location.reload()} style={{ marginRight: 8, padding: '8px 16px' }}>รีเฟรช</button>
        <button onClick={this.reset} style={{ padding: '8px 16px' }}>ล้างข้อมูลแบบร่างแล้วโหลดใหม่</button>
      </div>
    )
  }
}

createRoot(document.getElementById('root')).render(<Boundary><App /></Boundary>)
