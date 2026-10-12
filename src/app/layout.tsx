import type { Metadata, Viewport } from 'next';
import { Providers } from '@/components/Providers';
import { SITE_URL } from '@/lib/config';
import './globals.css';
export const metadata: Metadata = { metadataBase: new URL(SITE_URL), title: 'Ventorme', robots: { index: false, follow: true }, icons: { icon: '/icon.svg' } };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };
const setup = `(function(){try{var l=location.pathname.split('/')[1];if(['ru','en','kk','uz','zh','tr'].includes(l))document.documentElement.lang=l;var c=JSON.parse(localStorage.getItem('ventorme.cookies.v1')||'null');var age=c?Date.now()-c.updatedAt:-1;if(c&&c.version===1&&c.preferences===true&&typeof c.updatedAt==='number'&&age>=0&&age<15552000000){var t=localStorage.getItem('ventorme.theme');if(t==='dark')document.documentElement.dataset.theme='dark';}}catch(e){}})();`;
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ru" data-theme="light" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: setup }} /></head><body><Providers>{children}</Providers></body></html>;
}
