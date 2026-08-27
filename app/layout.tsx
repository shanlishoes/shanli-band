import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'کارکرد روزانه', description: 'ثبت آنلاین کارکرد پرسنل' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fa" dir="rtl"><body>{children}</body></html>
}
