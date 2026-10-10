'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
export default function RootPage() {
  const router = useRouter(); useEffect(() => { router.replace('/ru/'); }, [router]);
  return <main className="root-redirect"><meta httpEquiv="refresh" content="0;url=/ru/" /><Link href="/ru/">Ventorme · Открыть сайт</Link></main>;
}
