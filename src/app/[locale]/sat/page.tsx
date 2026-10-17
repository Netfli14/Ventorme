import {notFound} from 'next/navigation';
import {isLocale} from '@/lib/i18n';
import {experienceCopy} from '@/lib/experience-copy';
import {SatAdventure} from '@/components/SatAdventure';
import {localizedMetadata} from '@/lib/metadata';
export async function generateMetadata({params}:{params:Promise<{locale:string}>}){const {locale}=await params;if(!isLocale(locale))notFound();return {...localizedMetadata(locale,'sat'),title:`${experienceCopy[locale].navGame} · VentorMe`};}
export default async function Page({params}:{params:Promise<{locale:string}>}){const {locale}=await params;if(!isLocale(locale))notFound();return <SatAdventure locale={locale}/>;}
