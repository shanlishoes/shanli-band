import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export const runtime = 'nodejs'
const staff: Record<string,{name:string; column:'C'|'D'|'E'}> = {
  'seller-1': {name:'سمیه فلاح پور', column:'C'},
  'seller-2': {name:'ثنا آخته', column:'D'},
  'seller-3': {name:'گیتا ازم', column:'E'}
}
const monthNames=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند']
function today(){
  const parts=new Intl.DateTimeFormat('en-US-u-ca-persian',{timeZone:process.env.APP_TIMEZONE||'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date())
  const get=(type:string)=>parts.find(p=>p.type===type)?.value||''
  return {key:`${get('year')}/${get('month')}/${get('day')}`, legacyKey:`${get('month')}/${get('day')}`, month:monthNames[Number(get('month'))-1], day:get('day')}
}
async function sheet(){
  const raw=process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if(!raw||!process.env.GOOGLE_SHEET_ID) throw new Error('اتصال Google Sheets هنوز تنظیم نشده است.')
  const auth=new google.auth.GoogleAuth({credentials:JSON.parse(raw),scopes:['https://www.googleapis.com/auth/spreadsheets']})
  return google.sheets({version:'v4',auth})
}
export async function POST(req:Request){
  try{
    const body=await req.json(); const {staffId,hours,edit}=body
    const person=staff[staffId]
    if(!person) return NextResponse.json({error:'پرسنل معتبر نیست.'},{status:400})
    const n=Number(hours); if(!Number.isInteger(n)||n<0) return NextResponse.json({error:'تعداد کارکرد باید عدد صحیح و صفر یا بیشتر باشد.'},{status:400})
    if (process.env.APPS_SCRIPT_URL) {
      const response = await fetch(process.env.APPS_SCRIPT_URL, {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({staffId,hours:n,edit})})
      const result = await response.json()
      if (!response.ok || result.error) return NextResponse.json(result,{status:response.status||400})
      return NextResponse.json({ok:true})
    }
    const date=today(); const api=await sheet(); const tab=process.env.GOOGLE_SHEET_TAB||'DATA'
    const existing=await api.spreadsheets.values.get({spreadsheetId:process.env.GOOGLE_SHEET_ID!,range:`${tab}!A2:F`})
    const rows=existing.data.values||[]
    const index=rows.findIndex(r=>String(r[0]).trim()===date.key)
    if(index<0) return NextResponse.json({error:`ردیف امروز (${date.key}) در جدول پیدا نشد.`},{status:404})
    const row=index+2
    const current=rows[index][person.column==='C'?2:person.column==='D'?3:4]
    if(current!==undefined && String(current).trim()!=='' && !edit) return NextResponse.json({error:'کارکرد امروز شما قبلاً ثبت شده است.'},{status:409})
    await api.spreadsheets.values.batchUpdate({spreadsheetId:process.env.GOOGLE_SHEET_ID!,requestBody:{valueInputOption:'USER_ENTERED',data:[
      {range:`${tab}!${person.column}${row}`,values:[[n]]},
      {range:`${tab}!F${row}`,values:[[`=SUM(C${row}:E${row})`]]}
    ]}})
    return NextResponse.json({ok:true})
  }catch(e:any){console.error(e); return NextResponse.json({error:e.message||'خطای سرور'},{status:500})}
}
