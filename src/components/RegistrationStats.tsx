'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import type { ClickStats } from '@/lib/registration-clicks';
import styles from './RegistrationStats.module.css';

export function RegistrationStats() {
  const [stats, setStats] = useState<ClickStats | null>(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState(false);
  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setError(false);
    try {
      const response = await fetch('/api/registration-click/', { signal });
      if (!response.ok) throw new Error('Statistics unavailable');
      setStats(await response.json() as ClickStats);
    } catch (cause) {
      if (cause instanceof Error && cause.name === 'AbortError') return;
      setError(true);
    } finally { if (!signal?.aborted) setLoading(false); }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);
  return <main id="main-content" className={styles.main}>
    <Link className="text-button" href="/ru/"><ArrowLeft size={18} aria-hidden="true" />Открыть сайт</Link>
    <p className={styles.label}>VENTORME · КОМАНДА 004</p>
    <h1>Клики по регистрации</h1>
    <p className={styles.lead}>Нажатия на все кнопки «Регистрация» на сайте, на любом языке.</p>
    <div className={styles.cards} aria-live="polite" aria-busy={loading}>
      <div className={styles.card}><span>Всего с подключения</span><strong>{stats ? stats.total.toLocaleString('ru-RU') : '—'}</strong></div>
      <div className={styles.card}><span>Сегодня · Алматы</span><strong>{stats ? stats.today.toLocaleString('ru-RU') : '—'}</strong></div>
    </div>
    {error && <p role="alert">Не удалось загрузить статистику. Попробуй обновить её чуть позже.</p>}
    <button type="button" className="button button-outline" disabled={loading} onClick={() => { void load(); }}><RefreshCw size={17} aria-hidden="true" />{loading ? 'Загрузка…' : 'Обновить'}</button>
    {stats && <p className={styles.note}>Обновлено {new Intl.DateTimeFormat('ru-RU', { timeZone: stats.timezone, dateStyle: 'short', timeStyle: 'short' }).format(new Date(stats.updatedAt))}. Новые клики появляются в течение минуты.</p>}
    {stats && stats.days.length > 0 && <div className={styles.tableWrap}><table className={styles.table}>
      <caption>По дням · время Алматы</caption><thead><tr><th scope="col">Дата</th><th scope="col">Клики</th></tr></thead>
      <tbody>{stats.days.map(day => <tr key={day.date}><th scope="row">{day.date.split('-').reverse().join('.')}</th><td>{day.clicks.toLocaleString('ru-RU')}</td></tr>)}</tbody>
    </table></div>}
    <p className={styles.note}>Повторные нажатия учитываются отдельно. Это число кликов, а не уникальных людей или завершённых регистраций. До подключения счётчика данные не собирались.</p>
    <p className={styles.note}>Счётчик не сохраняет контакты, ответы квиза или идентификаторы посетителей и не использует cookies. На этой странице доступны только общие числа.</p>
  </main>;
}
