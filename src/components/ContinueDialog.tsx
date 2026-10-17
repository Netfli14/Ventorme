"use client";
import {useEffect,useRef} from 'react';
import {LockKeyhole,X} from 'lucide-react';
import type {Locale} from '@/lib/i18n';
import {experienceCopy} from '@/lib/experience-copy';
import {RegistrationButton} from './Actions';
import styles from './AdmissionLanding.module.css';
export function ContinueDialog({locale,open,onClose,game=false}:{locale:Locale;open:boolean;onClose:()=>void;game?:boolean}){
 const ref=useRef<HTMLDialogElement>(null),c=experienceCopy[locale];
 useEffect(()=>{const dialog=ref.current;if(open&&!dialog?.open)dialog?.showModal();else if(!open&&dialog?.open)dialog.close();},[open]);
 return <dialog className={styles.gateDialog} ref={ref} onCancel={onClose} onClose={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose();}} aria-labelledby="continue-heading">
  <div className={styles.gateInner}><button type="button" className={`icon-button ${styles.close}`} onClick={onClose} aria-label={c.close}><X/></button>
   <div className={styles.lockIcon}><LockKeyhole size={28}/></div><span className={styles.eyebrow}>VENTORME / NEXT CHAPTER</span>
   <h2 id="continue-heading">{game?c.gateGame:c.gateTitle}</h2><p>{game?c.gateGameText:c.gateText}</p>
   <RegistrationButton locale={locale} primary/><button type="button" className="text-button" onClick={onClose}>{c.back}</button>
  </div>
 </dialog>;
}
