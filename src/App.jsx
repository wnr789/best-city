import { useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_DATA, DEFAULT_SECTIONS } from './defaultData'

// ข้อมูลที่ผู้เล่นเห็น = public/rules.json (แก้ในรีโปแล้ว push) | แบบร่างของแอดมิน = localStorage (เห็นเฉพาะแอดมิน)
const ADMIN_USER = 'bestcity', ADMIN_HASH = 'b10d875e688a688e54196059c5922825bea59cea592de8cddc14debe99347c57' // sha256('ผู้ใช้:รหัสผ่าน')
const DK = 'bestcity_draft_v6', SK = 'bestcity_session', TK = 'bestcity_theme'
const uid = () => Math.random().toString(36).slice(2, 9)
const today = () => new Date().toISOString().slice(0, 10)
const load = (k, f) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f } catch { return f } }
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v))
const sha = async (s) =>
  [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))]
    .map((b) => b.toString(16).padStart(2, '0')).join('')
const norm = (d) => {
  const secs = d.sections?.length ? d.sections : DEFAULT_SECTIONS
  return { ...DEFAULT_DATA, ...d, sections: secs, categories: (d.categories || []).map((c) => ({
    ...c, sec: secs.some((s) => s.id === c.sec) ? c.sec : secs[0].id,
    groups: c.groups || [{ id: uid(), title: 'รายการ', items: c.items || [] }] })) }
}
const DEF = norm(DEFAULT_DATA)
const parseHash = () => { const p = location.hash.replace(/^#\/?/, '').split('/'); return { route: p[0] || 'home', cat: p[1] || '', grp: p[2] || '' } }
const ytId = (u) => { const t = String(u || '').trim(); const m = t.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/); return m ? m[1] : /^[\w-]{11}$/.test(t) ? t : '' }
const asset = (u) => (/^(https?:|data:|blob:)/i.test(u) ? u : import.meta.env.BASE_URL + u.replace(/^\.?\//, ''))
const bgInfo = (u) => {
  const t = String(u || '').trim(); if (!t) return null
  if (/^data:image\//i.test(t) || /\.(jpe?g|png|webp|gif|avif)(\?.*)?$/i.test(t)) return { k: 'img', src: asset(t) }
  if (/\.(mp4|webm|ogv|m4v|mov)(\?.*)?$/i.test(t)) return { k: 'video', src: asset(t) }
  const id = ytId(t); return id ? { k: 'yt', id } : null
}
function Ambient({ bg, dim, off }) {
  if (!bg) return null
  const yt = bg.k === 'yt' ? `https://www.youtube-nocookie.com/embed/${bg.id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${bg.id}&modestbranding=1&playsinline=1&rel=0&disablekb=1&iv_load_policy=3` : ''
  return (
    <div className="ambient" aria-hidden="true">
      {bg.k === 'yt' && <><div className="amb-img" style={{ backgroundImage: `url(https://i.ytimg.com/vi/${bg.id}/hqdefault.jpg)` }} />
        {!off && <iframe src={yt} title="background" allow="autoplay; encrypted-media" tabIndex={-1} />}</>}
      {bg.k === 'img' && <div className="amb-img sharp" style={{ backgroundImage: `url("${bg.src}")` }} />}
      {bg.k === 'video' && <video key={bg.src + off} className="amb-video" src={bg.src + (off ? '#t=0.1' : '')} autoPlay={!off} muted loop playsInline preload={off ? 'metadata' : 'auto'} />}
      <div className="amb-dim" style={{ opacity: dim }} />
    </div>
  )
}
const STRIP = /\*\*|\[\/?(?:b|i|u|c(?:=#[0-9a-fA-F]{3,8})?)\]/g
const TAGS = /(\*\*|\[\/?(?:b|i|u|c(?:=#[0-9a-fA-F]{3,8})?)\])/
const Rich = ({ t }) => {
  const st = { b: false, i: false, u: false, c: '', r: false }
  return String(t || '').split(TAGS).map((p, k) => {
    if (p === '**') { st.r = !st.r; return null }
    let m
    if ((m = p.match(/^\[(\/?)([biu])\]$/))) { st[m[2]] = !m[1]; return null }
    if ((m = p.match(/^\[(\/?)c(?:=(#[0-9a-fA-F]{3,8}))?\]$/))) { st.c = m[1] ? '' : m[2]; return null }
    if (!p) return null
    const style = {}
    if (st.b || st.r) style.fontWeight = 700
    if (st.i) style.fontStyle = 'italic'
    if (st.u) style.textDecoration = 'underline'
    if (st.c) style.color = st.c; else if (st.r) style.color = 'var(--red)'
    return Object.keys(style).length ? <span key={k} style={style}>{p}</span> : p
  })
}
const SWATCH = ['#ff3b4e', '#ff9f1c', '#ffd60a', '#34c759', '#22d3ee', '#3b82f6', '#a78bfa', '#f472b6', '#ffffff', '#9ca3af']
const EMOJIS = ['⚠️', '🚨', '🔴', '🟥', '🟧', '🟨', '🟩', '🟦', '⛔', '🚫', '✅', '❌', '📌', '📢', '📜', '⚖️', '🛡️', '👮', '🚓', '🚑', '🏥', '💊', '💉', '🏛️', '🏙️', '🔒', '🔑', '💰', '💸', '🪙', '⏱️', '🕒', '📅', '🔥', '⭐', '🌟', '🎯', '🎭', '🎬', '🎮', '🧾', '📝', '📋', '🔔', '👤', '👥', '🤝', '💬', '📞', '🆘', '🚗', '🏍️', '🔫', '💣', '📹', '🎙️', '🏴', '📍', '💡', '❗', '❓']

function EmojiField({ value, onChange }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="emf">
      <div className="row"><input value={value} maxLength={8} onChange={(e) => onChange(e.target.value)} placeholder="พิมพ์หรือเลือกอิโมจิ" />
        <button type="button" className="btn ghost sm" onClick={() => setOpen(!open)}>😀 เลือก</button>
        {value && <button type="button" className="btn ghost sm" onClick={() => onChange('')}>ล้าง</button>}</div>
      {open && <div className="pop em">{EMOJIS.map((x) => <button type="button" key={x} onClick={() => { onChange(x); setOpen(false) }}>{x}</button>)}</div>}
    </div>
  )
}
function ColorField({ value, onChange }) {
  return (
    <div className="pop sw inline">
      <button type="button" className={'noc' + (!value ? ' on' : '')} onClick={() => onChange('')}>ไม่ใช้สี</button>
      {SWATCH.map((c) => <button type="button" key={c} className={value === c ? 'on' : ''} style={{ background: c }} onClick={() => onChange(c)} />)}
      <input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#7c5cd6'} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
function RichField({ value, onChange, area }) {
  const ref = useRef()
  const [pop, setPop] = useState('')
  const [cc, setCc] = useState('#ff3b4e')
  const edit = (fn) => {
    const el = ref.current; const a = el.selectionStart ?? value.length, b = el.selectionEnd ?? value.length
    const [nv, p] = fn(value.slice(0, a), value.slice(a, b), value.slice(b)); onChange(nv)
    setTimeout(() => { el.focus(); el.setSelectionRange(p, p) }, 0)
  }
  const wrap = (o, c) => edit((a, m, z) => [a + o + m + c + z, a.length + o.length + m.length])
  const ins = (x) => edit((a, m, z) => [a + x + z, a.length + x.length])
  const T = area ? 'textarea' : 'input'
  return (
    <div className="rich">
      <div className="tb">
        <button type="button" title="ตัวหนา" onClick={() => wrap('[b]', '[/b]')}><b>B</b></button>
        <button type="button" title="ตัวเอียง" onClick={() => wrap('[i]', '[/i]')}><i>I</i></button>
        <button type="button" title="ขีดเส้นใต้" onClick={() => wrap('[u]', '[/u]')}><u>U</u></button>
        <button type="button" title="แดงหนา (ค่าปรับ/โทษ)" onClick={() => wrap('**', '**')}><span style={{ color: 'var(--red)', fontWeight: 700 }}>แดง</span></button>
        <button type="button" title="เปลี่ยนสีตัวอักษร" onClick={() => setPop(pop === 'c' ? '' : 'c')}>🎨 สี</button>
        <button type="button" title="แทรกอิโมจิ" onClick={() => setPop(pop === 'e' ? '' : 'e')}>😀</button>
        <button type="button" title="ล้างรูปแบบ" onClick={() => onChange(String(value).replace(STRIP, ''))}>✖ ล้างรูปแบบ</button>
      </div>
      {pop === 'c' && <div className="pop sw">{SWATCH.map((c) => <button type="button" key={c} style={{ background: c }} onClick={() => { wrap(`[c=${c}]`, '[/c]'); setPop('') }} />)}
        <input type="color" value={cc} onChange={(e) => setCc(e.target.value)} /><button type="button" className="btn sm" onClick={() => { wrap(`[c=${cc}]`, '[/c]'); setPop('') }}>ใช้สีนี้</button></div>}
      {pop === 'e' && <div className="pop em">{EMOJIS.map((x) => <button type="button" key={x} onClick={() => ins(x)}>{x}</button>)}</div>}
      <T ref={ref} rows={area ? 5 : undefined} value={value} onChange={(e) => onChange(e.target.value)} />
      {value && <div className="preview"><small>ตัวอย่าง</small><div className="pv"><Rich t={value} /></div></div>}
    </div>
  )
}
const num = (e) => Number(String(e.target.value).replace(/,/g, '')) || 0
const fmt = (n) => Math.round(n).toLocaleString('en-US')

function Modal({ title, fields, initial, onSave, onClose, error }) {
  const [v, setV] = useState(initial || {})
  const set = (k, val) => setV((p) => ({ ...p, [k]: val }))
  return (
    <div className="overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); onSave(v) }}>
        <h3>{title}</h3>
        {fields.map((f) => { const W = (f.rich || f.emoji || f.color) ? 'div' : 'label'; return (
          <W key={f.k} className="fld">{f.label}
            {f.rich ? <RichField value={v[f.k] || ''} onChange={(x) => set(f.k, x)} area={f.area} />
              : f.emoji ? <EmojiField value={v[f.k] || ''} onChange={(x) => set(f.k, x)} />
              : f.color ? <ColorField value={v[f.k] || ''} onChange={(x) => set(f.k, x)} />
              : f.pick ? <input type="file" accept="image/*,video/*" onChange={(e) => f.pick(e.target.files[0], set)} />
              : f.k === 'bgVideo' && String(v.bgVideo || '').startsWith('data:') ? <div className="filechip">✅ ใช้ภาพจากเครื่อง ({Math.round(v.bgVideo.length * 0.75 / 1024)} KB) <a onClick={() => set('bgVideo', '')}>ล้าง</a></div>
              : f.opts ? <select value={v[f.k] || f.opts[0][0]} onChange={(e) => set(f.k, e.target.value)}>
                {f.opts.map(([val, lb]) => <option key={val} value={val}>{lb}</option>)}</select>
              : f.area ? <textarea rows={3} value={v[f.k] || ''} onChange={(e) => set(f.k, e.target.value)} />
              : <input type={f.type || 'text'} required={f.req} value={v[f.k] || ''} onChange={(e) => set(f.k, e.target.value)} />}
          </W>
        ) })}
        {error && <p className="err">{error}</p>}
        <div className="row end"><button type="button" className="btn ghost" onClick={onClose}>ยกเลิก</button><button className="btn">บันทึก</button></div>
      </form>
    </div>
  )
}

function Row({ it, n, pens = [], path, href, admin, onEdit, onDel }) {
  const lines = (it.detail || '').split('\n')
  const tl = lines.find((l) => l.startsWith('ประเภทคดี:'))
  const detail = lines.filter((l) => l !== tl).join('\n')
  const tag = tl ? tl.replace('ประเภทคดี:', '').trim() : ''
  const penOnly = !it.title && !detail
  return (
    <div className={'item' + (penOnly ? ' pen-only' : '')}>
      {n != null && <span className="no">ข้อที่ {n}</span>}
      {!penOnly && <div className="item-main">
        {path && <small className="path"><a href={href}>{path}</a></small>}
        {(it.title || tag) && <b>{it.title && <Rich t={it.title} />}{tag && <span className={'tag' + (tag.includes('แดง') ? ' red-tag' : '')}>{tag}</span>}</b>}
        {detail && <p><Rich t={detail} /></p>}
      </div>}
      {(it.penalty || pens.length > 0) && <div className="penalty">
        {it.penalty && <div>{it.penalty}</div>}
        {pens.map((p) => <div key={p.it.id}>{p.it.penalty}{admin && <span className="acts mini"><a onClick={p.onEdit}>✏️</a><a onClick={p.onDel}>🗑️</a></span>}</div>)}
      </div>}
      {admin && <div className="acts"><a onClick={onEdit}>✏️</a><a onClick={onDel}>🗑️</a></div>}
    </div>
  )
}

function Calc() {
  const [fine, setFine] = useState(50000), [mult, setMult] = useState(1)
  const [mins, setMins] = useState(30), [red, setRed] = useState(false)
  const [ic, setIc] = useState(100000)
  const th = red ? 30 : 5, pay = Math.max(0, mins - th)
  return (
    <div className="calc">
      <section className="panel"><div className="panel-h"><h3>💸 ค่าปรับ x ตัวคูณ</h3></div>
        <div className="calc-b">
          <label>ค่าปรับต้นทาง (IC)<input value={fine} onChange={(e) => setFine(num(e))} inputMode="numeric" /></label>
          <label>ตัวคูณ<select value={mult} onChange={(e) => setMult(Number(e.target.value))}>{[1, 2, 3, 5].map((m) => <option key={m} value={m}>x{m}</option>)}</select></label>
          <div className="res">ค่าปรับรวม <b className="red">{fmt(fine * mult)} IC</b></div>
        </div></section>
      <section className="panel"><div className="panel-h"><h3>⛓️ ค่าประกันตัว</h3></div>
        <div className="calc-b">
          <label>เวลาจำคุก (นาที)<input value={mins} onChange={(e) => setMins(num(e))} inputMode="numeric" /></label>
          <label>ประเภทคดี<select value={red ? 'r' : 'g'} onChange={(e) => setRed(e.target.value === 'r')}><option value="g">คดีทั่วไป (ประกันได้จนเหลือ 5 นาที)</option><option value="r">คดีแดง (ประกันได้จนเหลือ 30 นาที)</option></select></label>
          <div className="res">ประกันตัวได้ <b>{pay} นาที</b> = <b className="red">{fmt(pay * 500)} IC</b>{pay === 0 && <small className="muted"> (เวลาไม่พอให้ประกัน)</small>}</div>
        </div></section>
      <section className="panel"><div className="panel-h"><h3>🔁 แปลงบิลจำคุก (1 นาที = 500 IC)</h3></div>
        <div className="calc-b">
          <label>จำนวนเงิน (IC)<input value={ic} onChange={(e) => setIc(num(e))} inputMode="numeric" /></label>
          <div className="res">เท่ากับจำคุก <b>{(ic / 500).toLocaleString('en-US', { maximumFractionDigits: 1 })} นาที</b></div>
        </div></section>
    </div>
  )
}

function SearchStats({ sh }) {
  const chips = (arr, cls = '') => arr.map(([t, n]) => <span key={t} className={'chip ' + cls}>{t} <b>{n}</b></span>)
  return (<>
    <h4>🔎 คำค้นหายอดนิยม (10 วัน)</h4>
    {sh.top.length ? <div className="chips">{chips(sh.top)}</div> : <p className="muted"><small>ยังไม่มีข้อมูลการค้นหา (ระบบเก็บเมื่อผู้เล่นพิมพ์ค้นหา)</small></p>}
    <h4>📅 ประวัติการค้นหารายวัน</h4>
    {sh.days.map(([d, arr]) => <div key={d} className="toprow day"><span>{d}</span><span className="chips">{chips(arr.slice(0, 8))}</span></div>)}
    {sh.miss.length > 0 && <><h4>⚠️ ค้นแล้วไม่พบ (ควรเพิ่มกฎหรือคีย์เวิร์ด)</h4><div className="chips">{chips(sh.miss.slice(0, 20), 'miss')}</div></>}
  </>)
}

// ===== สถิติผู้เข้าชม (GoatCounter) =====
const ymd = (d) => d.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
function Stats({ code, onClose, onSettings }) {
  const [token, setToken] = useState(() => localStorage.getItem('gc_token') || '')
  const [rows, setRows] = useState(null), [top, setTop] = useState([]), [err, setErr] = useState(''), [busy, setBusy] = useState(false), [sh, setSh] = useState(null)
  const api = async (path) => {
    const r = await fetch(`https://${code}.goatcounter.com/api/v0${path}`, { headers: { Authorization: 'Bearer ' + token } })
    if (!r.ok) throw new Error('HTTP ' + r.status)
    return r.json()
  }
  const run = async () => {
    setBusy(true); setErr('')
    try {
      localStorage.setItem('gc_token', token)
      const out = []
      for (let i = 9; i >= 0; i--) {
        const d = ymd(new Date(Date.now() - i * 864e5))
        const t = await api(`/stats/total?start=${d}&end=${d}`)
        out.push({ d, v: t.total || 0 }); setRows([...out])
        await new Promise((r) => setTimeout(r, 280))
      }
      const h = await api(`/stats/hits?daily=true&start=${out[0].d}&end=${out[9].d}&limit=100`)
      const hits = h.hits || []
      setTop(hits.filter((x) => !/^\/search/.test(x.path || '')).slice(0, 10).map((x) => ({ p: x.path, c: x.count })))
      const byDay = {}, all = {}, miss = {}
      hits.forEach((x) => {
        const m = String(x.path || '').match(/^\/(search|search-miss)\/(.+)$/); if (!m) return
        let term = m[2]; try { term = decodeURIComponent(term) } catch { /* keep raw */ }
        ;(x.stats || []).forEach((st) => {
          const n = st.daily ?? (st.hourly || []).reduce((a, b) => a + b, 0); if (!n) return
          if (m[1] === 'search') { byDay[st.day] = byDay[st.day] || {}; byDay[st.day][term] = (byDay[st.day][term] || 0) + n; all[term] = (all[term] || 0) + n } else miss[term] = (miss[term] || 0) + n
        })
      })
      const sortE = (o) => Object.entries(o).sort((a, b) => b[1] - a[1])
      setSh({ top: sortE(all).slice(0, 20), miss: sortE(miss), days: Object.entries(byDay).sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([d, o]) => [d, sortE(o)]) })
    } catch (e) { setErr(String(e.message || e)) }
    setBusy(false)
  }
  useEffect(() => { if (token) run() }, [])
  const vals = (rows || []).map((r) => r.v), max = Math.max(1, ...vals), sum = vals.reduce((a, b) => a + b, 0)
  return (
    <div className="stats">
      <h3>📊 สถิติผู้เข้าชม 10 วันล่าสุด</h3>
      <div className="row"><input className="tok" type="password" placeholder="วาง GoatCounter API token (เก็บในเครื่องนี้เท่านั้น)" value={token} onChange={(e) => setToken(e.target.value)} />
        <button className="btn sm" disabled={busy || !token} onClick={run}>{busy ? 'กำลังโหลด...' : '↻ โหลดสถิติ'}</button>
        <a className="btn sm ghost" href={`https://${code}.goatcounter.com`} target="_blank" rel="noreferrer">เปิดแดชบอร์ดเต็ม ↗</a></div>
      {err && <p className="err">โหลดไม่สำเร็จ ({err}) — ตรวจ token/รหัสไซต์ หรือเบราว์เซอร์บล็อกการเชื่อมต่อ ให้ใช้ "เปิดแดชบอร์ดเต็ม" แทน</p>}
      {rows && (<>
        <div className="tiles">
          <div><small>วันนี้</small><b>{vals[vals.length - 1] ?? 0}</b></div>
          <div><small>เมื่อวาน</small><b>{vals[vals.length - 2] ?? 0}</b></div>
          <div><small>รวม {vals.length} วัน</small><b>{sum.toLocaleString()}</b></div>
          <div><small>เฉลี่ย/วัน</small><b>{vals.length ? Math.round(sum / vals.length) : 0}</b></div>
          <div><small>สูงสุด</small><b>{Math.max(0, ...vals)}</b></div>
        </div>
        <div className="bars">{rows.map((r) => (
          <div key={r.d} className="bar-col"><span className="bar-v">{r.v}</span><div className="bar" style={{ height: Math.max(3, (r.v / max) * 150) }} /><small>{r.d.slice(8)}/{r.d.slice(5, 7)}</small></div>))}</div>
        {top.length > 0 && <><h4>หน้ายอดนิยม (10 วัน)</h4>{top.map((t) => <div key={t.p} className="toprow"><span>{t.p}</span><b>{t.c}</b></div>)}</>}
      </>)}
      {sh && <SearchStats sh={sh} />}
      <p className="muted"><small>นับเป็น "ผู้เข้าชม" ต่อวัน ตามเขตเวลาที่ตั้งในบัญชี GoatCounter (แนะนำ Asia/Bangkok) ไม่นับตอนแอดมินล็อกอินอยู่</small></p>
      <div className="row end"><button className="btn ghost" onClick={onSettings}>ตั้งค่ารหัสไซต์</button><button className="btn" onClick={onClose}>ปิด</button></div>
    </div>
  )
}

export default function App() {
  const [pub, setPub] = useState(null)
  const [draft, setDraft] = useState(() => { const d = load(DK, null); return d ? norm(d) : null })
  const [theme, setTheme] = useState(() => localStorage.getItem(TK) || 'dark')
  const [adminUser, setAdmin] = useState(() => (localStorage.getItem(SK) === ADMIN_USER ? ADMIN_USER : null))
  const [hash, setHash] = useState(parseHash)
  const [q, setQ] = useState('')
  const [modal, setModal] = useState(null)
  const [err, setErr] = useState('')
  const [bar, setBar] = useState(false)
  const [nav, setNav] = useState(false)
  const [toast, setToast] = useState('')
  const [top, setTop] = useState(false)
  const [sel, setSel] = useState(() => parseHash().grp)
  const [pall, setPall] = useState(false)
  const [preview, setPreview] = useState(null)
  const [bgOff, setBgOff] = useState(() => !!localStorage.getItem('bestcity_bgoff'))
  const file = useRef()
  const [viewer, setViewer] = useState(false)
  const admin = adminUser && !viewer ? adminUser : null
  const lastQ = useRef('')

  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem(TK, theme) }, [theme])
  useEffect(() => {
    fetch(import.meta.env.BASE_URL + 'rules.json?t=' + Date.now()).then((r) => r.json()).then((d) => setPub(norm(d))).catch(() => setPub(DEF))
    const f = () => { setHash(parseHash()); setSel(parseHash().grp); setQ(''); setNav(false) }
    const s = () => setTop(window.scrollY > 500)
    window.addEventListener('hashchange', f); window.addEventListener('scroll', s)
    return () => { window.removeEventListener('hashchange', f); window.removeEventListener('scroll', s) }
  }, [])
  useEffect(() => {
    if (hash.grp) { const t = setTimeout(() => [...document.querySelectorAll('.gpanel')].find((e) => e.offsetParent)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120); return () => clearTimeout(t) }
    window.scrollTo(0, 0)
  }, [hash, pub])
  const say = (m) => { setToast(m); setTimeout(() => setToast(''), 1800) }

  const data = (admin && draft) || pub || DEF
  const { sections: secs, categories: cats } = data
  const sec = secs.find((s) => s.id === hash.route)
  const secCats = sec ? cats.filter((c) => c.sec === sec.id) : []
  const cat = secCats.find((c) => c.id === hash.cat) || secCats[0]
  const go = (r) => { location.hash = '#/' + r }
  const commit = (d) => { const n = { ...d, updated: today() }; setDraft(n); save(DK, n) }
  const upCat = (cid, fn) => commit({ ...data, categories: cats.map((c) => (c.id === cid ? { ...fn(c), upd: today() } : c)) })
  const upGroup = (cid, gid, fn) => upCat(cid, (c) => ({ ...c, groups: c.groups.map((x) => (x.id === gid ? fn(x) : x)) }))
  const link = (sid, cid, gid) => location.href.split('#')[0] + '#/' + [sid, cid, gid].filter(Boolean).join('/')

  const results = useMemo(() => {
    const s = q.trim().toLowerCase(); if (!s) return null
    return cats.flatMap((c) => c.groups.flatMap((gr) => gr.items
      .filter((it) => [it.title, it.detail, it.penalty, c.title, gr.title].join(' ').replace(STRIP, '').toLowerCase().includes(s))
      .map((it) => ({ it, c, gr }))))
  }, [q, cats])
  const pageHits = useMemo(() => {
    const k = q.trim().toLowerCase(); if (!k) return []
    const hit = (...a) => a.join(' ').replace(STRIP, '').toLowerCase().includes(k)
    return [...secs.filter((x) => hit(x.title, x.desc)).map((x) => ({ k: 's' + x.id, t: `${x.icon} ${x.title}`, h: '#/' + x.id })),
      ...cats.filter((c) => hit(c.title, c.sub)).map((c) => ({ k: c.id, t: `${c.icon} ${c.title}`, h: '#/' + [c.sec, c.id].join('/') })),
      ...(hit('คำนวณ โทษ ค่าประกัน เครื่องคิดเลข ประกันตัว บิลจำคุก') ? [{ k: 'tools', t: '🧮 เครื่องคิดเลขโทษ', h: '#/tools' }] : [])]
  }, [q, secs, cats])
  const dups = () => {
    const m = {}
    cats.forEach((c) => c.groups.forEach((g) => g.items.forEach((it) => {
      const k = [it.title, it.detail, it.penalty].join(' ').replace(STRIP, '').replace(/\s+/g, ' ').trim()
      if (k.length >= 12) (m[k] = m[k] || []).push({ c, g, it })
    })))
    return Object.entries(m).filter(([, a]) => a.length > 1)
  }

  const login = async ({ user, pass }) => {
    if ((user || '').trim() !== ADMIN_USER || (await sha(`${ADMIN_USER}:${pass}`)) !== ADMIN_HASH) return setErr('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
    localStorage.setItem(SK, ADMIN_USER); setAdmin(ADMIN_USER); setErr(''); setModal(null)
  }
  const logout = () => { localStorage.removeItem(SK); setAdmin(null); setViewer(false); setBar(false) }

  const saveItem = ({ cid, gid }, v) => {
    const title = (v.title || '').trim(); if (!title && !v.detail && !v.penalty) return
    const f = { title, detail: v.detail || '', penalty: v.penalty || '' }
    const [tc, tg] = (v.move || `${cid}|${gid}`).split('|')
    if (v.id && (tc !== cid || tg !== gid)) {
      commit({ ...data, categories: cats.map((c) => ({ ...c, upd: c.id === cid || c.id === tc ? today() : c.upd, groups: c.groups.map((g) => {
        if (c.id === cid && g.id === gid) return { ...g, items: g.items.filter((x) => x.id !== v.id) }
        if (c.id === tc && g.id === tg) return { ...g, items: [...g.items, { id: v.id, ...f }] }
        return g }) })) })
      setModal(null); say('ย้ายรายการแล้ว'); location.hash = '#/' + [cats.find((c) => c.id === tc).sec, tc, tg].join('/'); return
    }
    upGroup(cid, gid, (gr) => ({ ...gr, items: v.id ? gr.items.map((x) => (x.id === v.id ? { ...x, ...f } : x)) : [...gr.items, { id: uid(), ...f }] }))
    setModal(null)
  }
  const editItem = (cid, gid, it) => setModal({ t: 'item', cid, gid, v: { ...it, move: `${cid}|${gid}` } })
  const delItem = (cid, gid, id) => confirm('ลบรายการนี้?') && upGroup(cid, gid, (gr) => ({ ...gr, items: gr.items.filter((x) => x.id !== id) }))
  const saveGroup = (cid, v) => {
    if (!(v.title || '').trim()) return
    const f = { title: v.title, note: v.note || '', icon: v.icon || '', color: v.color || '', num: v.num || 'auto' }
    const to = v.id ? (v.move || cid) : cid
    if (v.id && to !== cid) {
      const ng = { ...cats.find((c) => c.id === cid).groups.find((g) => g.id === v.id), ...f }
      commit({ ...data, categories: cats.map((c) => (c.id === cid ? { ...c, groups: c.groups.filter((g) => g.id !== v.id), upd: today() } : c.id === to ? { ...c, groups: [...c.groups, ng], upd: today() } : c)) })
      setModal(null); say('ย้ายหัวข้อย่อยแล้ว'); location.hash = '#/' + [cats.find((c) => c.id === to).sec, to, v.id].join('/'); return
    }
    upCat(cid, (c) => ({ ...c, groups: v.id ? c.groups.map((x) => (x.id === v.id ? { ...x, ...f } : x)) : [...c.groups, { id: uid(), ...f, items: [] }] }))
    setModal(null)
  }
  const delGroup = (cid, gr) => confirm(`ลบหมวดย่อย "${gr.title}" และรายการทั้งหมด?`) && upCat(cid, (c) => ({ ...c, groups: c.groups.filter((x) => x.id !== gr.id) }))
  const saveCat = (v) => {
    if (!(v.title || '').trim()) return
    const f = { title: v.title, sub: v.sub || '', icon: v.icon || '📌', sec: v.sec || secs[0].id }
    if (v.id) upCat(v.id, (c) => ({ ...c, ...f }))
    else { const n = { id: uid(), ...f, groups: [], upd: today() }; commit({ ...data, categories: [...cats, n] }); location.hash = `#/${f.sec}/${n.id}` }
    setModal(null)
  }
  const delCat = (c) => confirm(`ลบหมวด "${c.title}" ทั้งหมด?`) && commit({ ...data, categories: cats.filter((x) => x.id !== c.id) })
  const saveSec = (v) => {
    if (!(v.title || '').trim()) return
    const f = { title: v.title, icon: v.icon || '📌', desc: v.desc || '' }
    if (v.id) commit({ ...data, sections: secs.map((s) => (s.id === v.id ? { ...s, ...f } : s)) })
    else commit({ ...data, sections: [...secs, { id: uid(), ...f }] })
    setModal(null)
  }
  const delSec = (s) => {
    if (secs.length < 2 || !confirm(`ลบเมนู "${s.title}"? (หมวดในเมนูนี้จะย้ายไปเมนูแรก)`)) return
    const rest = secs.filter((x) => x.id !== s.id)
    commit({ ...data, sections: rest, categories: cats.map((c) => (c.sec === s.id ? { ...c, sec: rest[0].id } : c)) }); go('home')
  }
  const exportJSON = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' }))
    a.download = 'rules.json'; a.click(); say('ดาวน์โหลด rules.json แล้ว — นำไปแทน public/rules.json ในรีโป')
  }
  const importJSON = (e) => {
    const f = e.target.files[0]; if (!f) return
    const r = new FileReader()
    r.onload = () => { try { const d = JSON.parse(r.result); if (!Array.isArray(d.categories)) throw 0; commit(norm(d)); say('นำเข้าข้อมูลเป็นแบบร่างแล้ว') } catch { alert('ไฟล์ JSON ไม่ถูกต้อง') } }
    r.readAsText(f); e.target.value = ''
  }
  const copy = (sid, cid, gid) => { navigator.clipboard?.writeText(link(sid, cid, gid)); say('คัดลอกลิงก์แล้ว') }
  const pick = (gid) => { const n = sel === gid ? '' : gid; setSel(n); history.replaceState(null, '', '#/' + [sec.id, cat.id, n].filter(Boolean).join('/')) }
  const printAll = () => { setPall(true); setTimeout(() => { window.print(); setPall(false) }, 200) }

  const catOpts = cats.map((c) => [c.id, `${(secs.find((x) => x.id === c.sec) || {}).title || ''} › ${c.icon} ${c.title}`])
  const groupOpts = cats.flatMap((c) => c.groups.map((g) => [`${c.id}|${g.id}`, `${c.title} › ${g.title}`]))
  const panel = (gr) => {
    const showNum = gr.num === 'on' || (gr.num !== 'off' && !/^ข้อ\s*\d/.test(gr.title))
    const blocks = []; let k = 0
    gr.items.forEach((it) => {
      if (!it.title && !it.detail && blocks.length) blocks[blocks.length - 1].pens.push(it)
      else blocks.push({ it, n: it.title || it.detail ? ++k : null, pens: [] })
    })
    return (
      <section className="panel gpanel">
        <div className="panel-h" style={gr.color ? { borderLeftColor: gr.color } : null}>
          <div><small className="crumbline">{sec.icon} {sec.title} › {cat.icon} {cat.title}</small>
            <h3>{gr.icon && <span>{gr.icon} </span>}{gr.title}</h3>{gr.note && <span className="note">{gr.note}</span>}</div>
          <div className="acts">
            <a title="คัดลอกลิงก์" className="noprint" onClick={() => copy(sec.id, cat.id, gr.id)}>🔗</a>
            {admin && <>
              <a onClick={() => setModal({ t: 'item', cid: cat.id, gid: gr.id })}>➕ รายการ</a>
              <a onClick={() => setModal({ t: 'group', cid: cat.id, v: { ...gr, move: cat.id } })}>✏️</a>
              <a onClick={() => delGroup(cat.id, gr)}>🗑️</a></>}
          </div>
        </div>
        <div className="items">
          {blocks.map((b) => (
            <Row key={b.it.id} it={b.it} n={showNum ? b.n : null} admin={admin}
              pens={b.pens.map((p) => ({ it: p, onEdit: () => editItem(cat.id, gr.id, p), onDel: () => delItem(cat.id, gr.id, p.id) }))}
              onEdit={() => editItem(cat.id, gr.id, b.it)} onDel={() => delItem(cat.id, gr.id, b.it.id)} />))}
        </div>
        {!gr.items.length && <p className="muted pad">ยังไม่มีรายการ</p>}
      </section>
    )
  }
  const itemFields = [{ k: 'title', label: 'หัวข้อ (เว้นว่างได้)', rich: true }, { k: 'detail', label: 'รายละเอียด', rich: true, area: true }, { k: 'penalty', label: 'บทลงโทษ / ค่าปรับ (แสดงสีแดง)' }]
  const total = cat ? cat.groups.reduce((n, x) => n + x.items.length, 0) : 0
  const bgCache = load('bestcity_bgcache', {})
  const bg = preview || bgInfo(pub ? data.bgVideo : bgCache.v)
  const bgDimV = Number(pub ? data.bgDim : bgCache.d) || 0.55
  useEffect(() => { document.documentElement.dataset.amb = bg ? '1' : '0' }, [!!bg])
  const toggleBg = () => { const n = !bgOff; setBgOff(n); localStorage.setItem('bestcity_bgoff', n ? '1' : '') }
  const pickBg = (file, set) => {
    if (!file) return
    if (file.type.startsWith('image/')) {
      if (file.size > 800 * 1024) return alert('ภาพใหญ่เกิน 800 KB — ให้นำไฟล์ไปวางในโฟลเดอร์ public/ ของรีโป แล้วพิมพ์ชื่อไฟล์ในช่องลิงก์ (เช่น bg.jpg)')
      const r = new FileReader(); r.onload = () => set('bgVideo', r.result); r.readAsDataURL(file)
    } else if (file.type.startsWith('video/')) {
      setPreview({ k: 'video', src: URL.createObjectURL(file) }); say('ดูตัวอย่างวิดีโอจากเครื่อง (เห็นเฉพาะเครื่องนี้) — ใช้จริงให้วางไฟล์ใน public/ แล้วพิมพ์ชื่อไฟล์ในช่องลิงก์')
    } else alert('รองรับไฟล์ภาพและวิดีโอเท่านั้น')
  }
  const okBg = (t) => !(t || '').trim() || bgInfo(t)
  const BADBG = 'ลิงก์/ไฟล์ไม่ถูกต้อง — ใช้ได้: ลิงก์ YouTube, ชื่อไฟล์วิดีโอ (.mp4 .webm) หรือภาพ (.jpg .png .webp .gif) ที่วางไว้ใน public/'
  const saveBg = (v) => { if (!okBg(v.bgVideo)) return alert(BADBG); commit({ ...data, bgVideo: (v.bgVideo || '').trim(), bgDim: v.bgDim || '0.55' }); setPreview(null); setModal(null) }
  const bgFields = [{ k: 'bgVideo', label: 'พื้นหลัง: ลิงก์ YouTube หรือชื่อไฟล์ใน public/ เช่น bg.mp4 (เว้นว่าง = ปิด)' },
    { k: '_file', label: 'หรือเลือกไฟล์จากเครื่อง (ภาพ ≤ 800 KB ฝังในเว็บได้ / วิดีโอ ดูตัวอย่างได้)', pick: pickBg },
    { k: 'bgDim', label: 'ความเข้มของพื้นหลัง', opts: [['0.55', 'ปกติ'], ['0.35', 'สว่าง'], ['0.75', 'มืด']] }]
  useEffect(() => { if (pub) localStorage.setItem('bestcity_bgcache', JSON.stringify({ v: pub.bgVideo || '', d: pub.bgDim || '0.55' })) }, [pub])
  useEffect(() => {
    const f = (e) => { if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')) { e.preventDefault(); document.getElementById('gsearch')?.focus() } }
    window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f)
  }, [])
  useEffect(() => {
    const code = (data.gcCode || '').trim(), term = q.trim().toLowerCase().slice(0, 40)
    if (!code || adminUser || localStorage.getItem('gc_ignore') || term.length < 2) return
    const t = setTimeout(() => {
      if (lastQ.current === term) return; lastQ.current = term
      window.goatcounter?.count?.({ path: `/${results && results.length ? 'search' : 'search-miss'}/${encodeURIComponent(term)}`, title: term })
    }, 1500)
    return () => clearTimeout(t)
  }, [q, data.gcCode, adminUser])
  useEffect(() => {
    const code = (data.gcCode || '').trim()
    if (!code || adminUser || localStorage.getItem('gc_ignore')) return
    const send = () => window.goatcounter?.count?.({ path: '/' + [hash.route, hash.cat].filter(Boolean).join('/'), title: document.title })
    if (window.__gc) return send()
    window.__gc = true; window.goatcounter = { no_onload: true }
    const sc = document.createElement('script'); sc.async = true; sc.src = 'https://gc.zgo.at/count.js'
    sc.dataset.goatcounter = `https://${code}.goatcounter.com/count`; sc.onload = send; document.head.appendChild(sc)
  }, [data.gcCode, adminUser, hash.route, hash.cat])
  if (!pub) return <div className="app"><Ambient bg={bg} dim={bgDimV} off={bgOff} /><div className="loading">⚡ กำลังโหลดกฎ...</div></div>

  return (
    <div className="app">
      <Ambient bg={bg} dim={bgDimV} off={bgOff} />
      <header className="top">
        <a className="brand" onClick={() => go('home')}>⚡ <b>{data.siteName}</b></a>
        <nav className={'links' + (nav ? ' open' : '')}>
          <a className={hash.route === 'home' ? 'on' : ''} onClick={() => go('home')}>🏠 หน้าแรก</a>
          {secs.map((s) => <a key={s.id} className={hash.route === s.id ? 'on' : ''} onClick={() => go(s.id)}>{s.icon} {s.title}</a>)}
          <a className={hash.route === 'tools' ? 'on' : ''} onClick={() => go('tools')}>🧮 คำนวณโทษ</a>
          {data.discord && <a href={data.discord} target="_blank" rel="noreferrer">💬 Discord</a>}
        </nav>
        <div className="row">
          {bg && <button className="btn ghost sm" title="เปิด/ปิดวิดีโอพื้นหลัง" onClick={toggleBg}>{bgOff ? '🎬 เปิดวิดีโอ' : '🎬 ปิดวิดีโอ'}</button>}
          <button className="btn ghost sm" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? '☀️' : '🌙'}</button>
          {adminUser ? (<>
            <button className="btn ghost sm" title="ดูหน้าเว็บแบบที่ผู้เล่นเห็นจริง" onClick={() => { setViewer(!viewer); setBar(false) }}>{viewer ? '↩ กลับโหมดแอดมิน' : '👁️ มุมมองผู้ชม'}</button>
            {!viewer && <button className="btn sm" onClick={() => setBar(!bar)}>⚙️ {admin}</button>}</>)
            : <button className="btn sm" onClick={() => { setErr(''); setModal({ t: 'login' }) }}>แอดมิน</button>}
          <button className="btn ghost sm burger" onClick={() => setNav(!nav)}>☰</button>
        </div>
      </header>

      {adminUser && viewer && <div className="draft viewer">👁️ กำลังดูมุมมองผู้ชม — แสดงข้อมูลที่เผยแพร่จริงและไม่มีเครื่องมือแอดมิน <button className="btn sm" onClick={() => setViewer(false)}>↩ กลับโหมดแอดมิน</button></div>}
      {admin && preview && <div className="draft">🎬 กำลังดูตัวอย่างวิดีโอจากเครื่อง (ผู้เล่นไม่เห็น) <button className="btn sm ghost" onClick={() => setPreview(null)}>ปิดตัวอย่าง</button></div>}
      {admin && draft && <div className="draft">● มีแบบร่างที่ยังไม่เผยแพร่ (ผู้เล่นยังไม่เห็น) — กด Export แล้วนำ <b>rules.json</b> ไปแทนไฟล์ <b>public/rules.json</b> ในรีโป
        <button className="btn sm" onClick={exportJSON}>⬇ Export</button>
        <button className="btn sm ghost" onClick={() => confirm('ละทิ้งแบบร่างและกลับไปใช้ข้อมูลที่เผยแพร่?') && (localStorage.removeItem(DK), setDraft(null))}>ละทิ้งแบบร่าง</button></div>}
      {admin && bar && (
        <div className="admin-bar">
          <button className="btn sm" onClick={() => setModal({ t: 'cat', v: { sec: sec?.id } })}>+ หมวดหลัก</button>
          <button className="btn sm" onClick={() => setModal({ t: 'sec' })}>+ เมนู</button>
          <button className="btn sm" onClick={() => setModal({ t: 'stats' })}>📊 สถิติ</button>
          <button className="btn sm" onClick={() => setModal({ t: 'site' })}>ตั้งค่าเว็บ</button>
          <button className="btn sm" onClick={() => setModal({ t: 'bg', v: { bgVideo: data.bgVideo, bgDim: data.bgDim } })}>🎬 วิดีโอพื้นหลัง</button>
          <button className="btn sm" onClick={() => setModal({ t: 'dups' })}>🔍 หาข้อซ้ำ</button>
          <button className="btn sm" onClick={exportJSON}>⬇ Export</button>
          <button className="btn sm" onClick={() => file.current.click()}>⬆ Import</button>
          <button className="btn sm danger" onClick={() => confirm('รีเซ็ตแบบร่างเป็นข้อมูลเริ่มต้น?') && commit(DEF)}>รีเซ็ต</button>
          <button className="btn sm ghost" onClick={logout}>ออกจากระบบ</button>
          <input ref={file} type="file" accept="application/json" hidden onChange={importJSON} />
        </div>
      )}

      <div className="searchbar">
        <input id="gsearch" className="search slim" type="search" autoComplete="off" placeholder="🔍 ค้นหาคีย์เวิร์ดจากทุกหน้า เช่น ขโมยรถ ค่าปรับ ค่ารักษา... (กด / เพื่อค้นหา)" value={q} onChange={(e) => setQ(e.target.value)} />
        {q && <button className="clear" onClick={() => setQ('')}>✕</button>}
      </div>
      {hash.route === 'home' && !results && (<>
        {data.announcement && <div className="banner">📢 {data.announcement}{data.updated && <small> · อัปเดต {data.updated}</small>}</div>}
        <section className="hero">
          <h1>{data.welcome} <span className="grad">{data.siteName}</span></h1>
          {data.heroImage && <img className="logo" src={data.heroImage} alt="" />}
          <p>{data.tagline}</p>
        </section>
        <section className="cards">
          {secs.map((s) => (
            <a key={s.id} className="sec-card" onClick={() => go(s.id)}>
              <span className="ic">{s.icon}</span><h3>{s.title}</h3><p>{s.desc}</p>
              <small>{cats.filter((c) => c.sec === s.id).length} หมวด →</small>
            </a>
          ))}
          <a className="sec-card" onClick={() => go('tools')}><span className="ic">🧮</span><h3>คำนวณโทษ</h3><p>คิดค่าปรับ ค่าประกันตัว และแปลงบิลจำคุก</p><small>เปิดเครื่องมือ →</small></a>
        </section>
        <section className="contact">
          <h2>ช่องทางการติดต่อ</h2>
          <div className="row center">
            {data.discord ? <a className="btn" href={data.discord} target="_blank" rel="noreferrer">💬 Discord: {data.siteName}</a> : <span className="muted">ยังไม่ได้ตั้งลิงก์ Discord (ตั้งค่าเว็บ)</span>}
            {data.facebook && <a className="btn" href={data.facebook} target="_blank" rel="noreferrer">📘 Facebook: {data.siteName}</a>}
          </div>
          {data.updated && <p className="muted"><small>กฎอัปเดตล่าสุด {data.updated}</small></p>}
        </section>
      </>)}

      {(hash.route !== 'home' || results) && (
        <main className="page">
          {results ? (<>
            <h2>ผลการค้นหา <span className="count">{results.length}</span></h2>
            {pageHits.length > 0 && <div className="chips">{pageHits.map((p) => <a key={p.k} className="chip" href={p.h}>{p.t}</a>)}</div>}
            {!results.length && <p className="muted">ไม่พบข้อมูลที่ตรงกับ “{q}”</p>}
            <section className="panel">{results.map(({ it, c, gr }) => (
              <Row key={it.id} it={it} path={`${c.title} › ${gr.title}`} href={'#/' + [c.sec, c.id, gr.id].join('/')} admin={admin}
                onEdit={() => editItem(c.id, gr.id, it)} onDel={() => delItem(c.id, gr.id, it.id)} />))}</section>
          </>) : hash.route === 'tools' ? (<>
            <div className="crumb"><a onClick={() => go('home')}>หน้าแรก</a> › คำนวณโทษ</div>
            <div className="cat-head"><div><h1>🧮 เครื่องคิดเลขโทษ</h1><p className="muted">อัตราบิลจำคุก 1 นาที = 500 IC | คดีทั่วไปประกันได้จนเหลือ 5 นาที | คดีแดงประกันได้จนเหลือ 30 นาที</p></div></div>
            <Calc />
          </>) : !sec ? <p className="muted">ไม่พบหน้านี้ <a className="lnk" onClick={() => go('home')}>กลับหน้าแรก</a></p> : (<>
            <div className="crumb"><a onClick={() => go('home')}>หน้าแรก</a> › {sec.title}</div>
            <div className="cat-head">
              <div><h1>{sec.icon} {sec.title}</h1><p className="muted">{sec.desc}</p></div>
              {admin && <div className="acts"><a onClick={() => setModal({ t: 'sec', v: sec })}>✏️ แก้เมนู</a><a onClick={() => delSec(sec)}>🗑️</a></div>}
            </div>
            <div className="tabs">
              {secCats.map((c) => (
                <span key={c.id} className={'tab' + (cat?.id === c.id ? ' on' : '')}>
                  <button onClick={() => go(`${sec.id}/${c.id}`)}>{c.icon} {c.title}</button>
                  {admin && <><a onClick={() => setModal({ t: 'cat', v: c })}>✏️</a><a onClick={() => delCat(c)}>🗑️</a></>}
                </span>
              ))}
            </div>
            {cat ? (<>
              <div className="cat-head">
                <div><h2>{cat.icon} {cat.title}</h2><p className="muted">{cat.sub}{cat.upd && <small> · อัปเดตล่าสุด {cat.upd}</small>}</p></div>
                <div className="row"><span className="count">{total} รายการ</span>
                  <button className="btn ghost sm noprint" onClick={printAll}>🖨️ พิมพ์/PDF</button></div>
              </div>
              <div className="cat-body">
                <div className="glist">
                  <div className="glist-h">หัวข้อย่อย ({cat.groups.length})</div>
                  {cat.groups.map((gr) => (
                    <div key={gr.id} className={'gitem' + (sel === gr.id ? ' on' : '')}>
                      <button style={gr.color ? { borderLeft: '4px solid ' + gr.color } : null} onClick={() => pick(gr.id)}><span>{gr.icon && <>{gr.icon} </>}{gr.title}</span><small>{gr.items.length}</small></button>
                      {sel === gr.id && <div className="inline-open">{panel(gr)}</div>}
                    </div>
                  ))}
                  {admin && <button className="btn sm" onClick={() => setModal({ t: 'group', cid: cat.id })}>+ เพิ่มหมวดย่อย</button>}
                </div>
                <div className="right-panel">
                  {cat.groups.find((g) => g.id === sel) ? panel(cat.groups.find((g) => g.id === sel))
                    : <div className="placeholder">👈 เลือกหัวข้อย่อยทางซ้ายเพื่อดูรายละเอียด<br /><small>ทั้งหมวดมี {cat.groups.length} หัวข้อ / {total} รายการ</small></div>}
                </div>
              </div>
              {pall && <div className="print-all">{cat.groups.map((gr) => <div key={gr.id}>{panel(gr)}</div>)}</div>}
            </>) : <p className="muted">เมนูนี้ยังไม่มีหมวด {admin && 'กด "+ หมวดหลัก" ในแถบแอดมิน'}</p>}
          </>)}
        </main>
      )}

      <footer>⚡ {data.siteName}<br />© {new Date().getFullYear()} {data.siteName} — FiveM Roleplay Server</footer>
      {top && <button className="totop noprint" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>↑</button>}
      {toast && <div className="toast">{toast}</div>}

      {modal?.t === 'login' && <Modal title="เข้าสู่ระบบแอดมิน" error={err} onClose={() => setModal(null)}
        fields={[{ k: 'user', label: 'ชื่อผู้ใช้', req: true }, { k: 'pass', label: 'รหัสผ่าน', type: 'password', req: true }]} onSave={login} />}
      {modal?.t === 'item' && <Modal title={modal.v ? 'แก้ไขรายการ' : 'เพิ่มรายการ'} fields={modal.v ? [...itemFields, { k: 'move', label: 'ย้ายรายการนี้ไปหัวข้อย่อย', opts: groupOpts }] : itemFields} initial={modal.v} onClose={() => setModal(null)} onSave={(v) => saveItem(modal, v)} />}
      {modal?.t === 'group' && <Modal title={modal.v ? 'แก้ไขหมวดย่อย' : 'เพิ่มหมวดย่อย'} initial={modal.v} onClose={() => setModal(null)} onSave={(v) => saveGroup(modal.cid, v)}
        fields={[{ k: 'title', label: 'ชื่อหมวดย่อย', req: true }, { k: 'icon', label: 'ไอคอนหมวดย่อย (เลือกอิโมจิ)', emoji: true }, { k: 'color', label: 'สีของหมวดย่อย', color: true }, { k: 'num', label: 'ลำดับข้อ 1, 2, 3... ในหัวข้อย่อยนี้', opts: [['auto', 'อัตโนมัติ (ซ่อนถ้าชื่อขึ้นต้นด้วย "ข้อ 1")'], ['on', 'แสดง'], ['off', 'ซ่อน']] }, { k: 'note', label: 'ข้อความโทษที่หัวหมวด (สีแดง เช่น บทลงโทษ : 🟧)' }, ...(modal.v ? [{ k: 'move', label: 'ย้ายหัวข้อย่อยนี้ไปหมวดหมู่', opts: catOpts }] : [])]} />}
      {modal?.t === 'cat' && <Modal title={modal.v?.id ? 'แก้ไขหมวดหลัก' : 'เพิ่มหมวดหลัก'} initial={modal.v} onClose={() => setModal(null)} onSave={saveCat}
        fields={[{ k: 'sec', label: 'อยู่ในเมนู', opts: secs.map((s) => [s.id, `${s.icon} ${s.title}`]) }, { k: 'icon', label: 'ไอคอน (เลือกอิโมจิ)', emoji: true }, { k: 'title', label: 'ชื่อหมวด', req: true }, { k: 'sub', label: 'คำอธิบายสั้น' }]} />}
      {modal?.t === 'sec' && <Modal title={modal.v ? 'แก้ไขเมนู' : 'เพิ่มเมนู'} initial={modal.v} onClose={() => setModal(null)} onSave={saveSec}
        fields={[{ k: 'icon', label: 'ไอคอน (เลือกอิโมจิ)', emoji: true }, { k: 'title', label: 'ชื่อเมนู (เช่น ตำรวจ)', req: true }, { k: 'desc', label: 'คำอธิบายบนการ์ดหน้าแรก', area: true }]} />}
      {modal?.t === 'site' && <Modal title="ตั้งค่าเว็บ" initial={data} onClose={() => setModal(null)}
        fields={[{ k: 'siteName', label: 'ชื่อเมือง' }, { k: 'welcome', label: 'ข้อความต้อนรับ' }, { k: 'tagline', label: 'คำโปรย' }, { k: 'announcement', label: 'ประกาศ/อัปเดตกฎล่าสุด (แสดงแบนเนอร์หน้าแรก เว้นว่าง = ซ่อน)' }, { k: 'heroImage', label: 'URL โลโก้/รูปหน้าแรก' }, { k: 'discord', label: 'ลิงก์ Discord' }, { k: 'facebook', label: 'ลิงก์ Facebook' }, { k: 'gcCode', label: 'GoatCounter site code (สถิติผู้เข้าชม เช่น bestcity เว้นว่าง = ไม่นับ)' }, ...bgFields]}
        onSave={(v) => { if (!okBg(v.bgVideo)) return alert(BADBG); commit({ ...data, ...['siteName', 'welcome', 'tagline', 'announcement', 'heroImage', 'discord', 'facebook', 'bgVideo'].reduce((o, k) => ({ ...o, [k]: (v[k] || '').trim() }), {}), bgDim: v.bgDim || '0.55', gcCode: (v.gcCode || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '') }); setModal(null) }} />}
      {modal?.t === 'bg' && <Modal title="🎬 วิดีโอพื้นหลัง (YouTube)" initial={modal.v} fields={bgFields} onClose={() => setModal(null)} onSave={saveBg} />}
      {modal?.t === 'stats' && (
        <div className="overlay" onClick={() => setModal(null)}>
          <div className="modal wide" onClick={(e) => e.stopPropagation()}>
            {data.gcCode ? <Stats code={data.gcCode} onClose={() => setModal(null)} onSettings={() => setModal({ t: 'site' })} /> : (
              <div className="stats"><h3>📊 สถิติผู้เข้าชม</h3>
                <p>ยังไม่ได้เชื่อมระบบนับสถิติ ทำตามนี้ (ฟรี):</p>
                <ol className="muted"><li>สมัครที่ goatcounter.com ตั้งรหัสไซต์ เช่น <b>bestcity</b> และตั้ง Timezone เป็น Asia/Bangkok</li>
                  <li>ในหน้า GoatCounter: ชื่อผู้ใช้ → API → สร้าง token (ติ๊กสิทธิ์อ่านสถิติ)</li>
                  <li>กลับมาที่นี่: ตั้งค่าเว็บ → ช่อง "GoatCounter site code" ใส่ <b>bestcity</b> แล้ว Export ไปแทน rules.json</li></ol>
                <div className="row end"><button className="btn ghost" onClick={() => setModal(null)}>ปิด</button><button className="btn" onClick={() => setModal({ t: 'site' })}>ตั้งค่าเว็บ</button></div></div>)}
          </div>
        </div>)}
      {modal?.t === 'dups' && (
        <div className="overlay" onClick={() => setModal(null)}>
          <div className="modal wide" onClick={(e) => e.stopPropagation()}>
            <h3>🔍 ข้อความที่ซ้ำกัน ({dups().length})</h3>
            {!dups().length && <p className="muted">ไม่พบข้อความซ้ำ</p>}
            {dups().map(([k, a]) => (
              <div key={k} className="dup"><p>{k.slice(0, 140)}{k.length > 140 && '…'}</p>
                {a.map(({ c, g, it }) => <div key={it.id} className="row"><small className="muted">{c.title} › {g.title}</small><a onClick={() => delItem(c.id, g.id, it.id)}>🗑️ ลบ</a></div>)}</div>
            ))}
            <div className="row end"><button className="btn" onClick={() => setModal(null)}>ปิด</button></div>
          </div>
        </div>)}
    </div>
  )
}
