'use client'
import { useEffect, useState } from 'react'

type Staff = { id:string; name:string; color:string; initials:string }
const staff: Staff[] = [
  {id:'seller-1', name:'سمیه فلاح پور', color:'#2563eb', initials:'س'},
  {id:'seller-2', name:'ثنا آخته', color:'#7c3aed', initials:'ث'},
  {id:'seller-3', name:'گیتا ازم', color:'#059669', initials:'گ',},
]
const today = new Intl.DateTimeFormat('fa-IR',{dateStyle:'full'}).format(new Date())

export default function Home() {
  const [selected,setSelected]=useState<Staff|null>(null)
  const [hours,setHours]=useState('')
  const [sent,setSent]=useState(false)
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const [done,setDone]=useState<string[]>([])
  useEffect(()=>{ const x=localStorage.getItem('submitted-today'); if(x) setDone(JSON.parse(x)) },[])
  async function submit(e:React.FormEvent){
    e.preventDefault(); if(!selected) return; setError('');
    const value=Number(hours); if(!value || value<0 || value>24){setError('لطفاً مقدار معتبر بین ۰ تا ۲۴ وارد کنید.');return}
    setLoading(true)
    try { const r=await fetch('/api/attendance',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({staffId:selected.id,hours:value})}); const d=await r.json(); if(!r.ok) throw new Error(d.error||'ثبت انجام نشد');
      const next=[...done,selected.id]; setDone(next); localStorage.setItem('submitted-today',JSON.stringify(next)); setSent(true)
    } catch(e:any){setError(e.message)} finally{setLoading(false)}
  }
  if(sent) return <main className="shell"><div className="topbar"><div className="brand"><div className="logo">✓</div><div><b>کارکردینو</b><small>ثبت کارکرد روزانه</small></div></div></div><section className="card success"><div className="successIcon">✓</div><h1>با موفقیت ثبت شد</h1><p>کارکرد <b>{selected?.name}</b> برای امروز در جدول ذخیره شد.</p><div className="receipt"><span>تاریخ</span><b>{today}</b><span>مقدار کارکرد</span><b>{hours} ساعت</b></div><button className="secondary" onClick={()=>{setSelected(null);setSent(false);setHours('')}}>بازگشت به صفحه اصلی</button></section><footer>ثبت هر نفر، فقط یک‌بار در روز امکان‌پذیر است.</footer></main>
  return <main className="shell"><div className="topbar"><div className="brand"><div className="logo">✓</div><div><b>کارکردینو</b><small>ثبت کارکرد روزانه</small></div></div><div className="date"><span className="dot"/> امروز<br/><b>{today}</b></div></div>
    <section className="hero"><div><div className="eyebrow">پنل پرسنل</div><h1>کارکرد امروزت را ثبت کن</h1><p>نام خودت را انتخاب کن و مقدار کارکرد امروز را وارد کن.</p></div><div className="heroShape">◷</div></section>
    {!selected ? <section><h2>چه کسی هستی؟</h2><div className="people">{staff.map(s=><button className={'person '+(done.includes(s.id)?'disabled':'')} key={s.id} disabled={done.includes(s.id)} onClick={()=>setSelected(s)}><span style={{background:s.color}}>{s.initials}</span><strong>{s.name}</strong>{done.includes(s.id)?<em>ثبت شده ✓</em>:<i>انتخاب ›</i>}</button>)}</div><div className="info">ⓘ هر نفر فقط یک‌بار در روز می‌تواند کارکرد خود را ثبت کند.</div></section> : <section className="card formCard"><button className="back" onClick={()=>setSelected(null)}>← تغییر نام</button><div className="selected"><span style={{background:selected.color}}>{selected.initials}</span><div><small>در حال ثبت برای</small><h2>{selected.name}</h2></div><label>امروز<br/><b>{today}</b></label></div><form onSubmit={submit}><label className="field">مقدار کارکرد امروز <span>ضروری</span><div className="inputWrap"><input autoFocus type="number" min="0" max="24" step="0.25" placeholder="مثلاً ۸" value={hours} onChange={e=>setHours(e.target.value)}/><b>ساعت</b></div></label>{error&&<div className="error">⚠ {error}</div>}<button className="primary" disabled={loading}>{loading?'در حال ثبت...':'ثبت کارکرد امروز  ✓'}</button></form></section>}
    <footer>اطلاعات ثبت‌شده مستقیماً در جدول کارکرد ذخیره می‌شود.</footer></main>
}
