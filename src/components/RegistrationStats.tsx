"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  LockKeyhole,
  LogOut,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { dictionaries } from "@/lib/i18n";
import { routeCopy } from "@/lib/route-copy";
import { subjects } from "@/lib/route-model";
import type { ClickStats } from "@/lib/registration-clicks";
import type { LeadRecord } from "@/app/api/stats/route";
import type { buildFunnel } from "@/lib/funnel";
import styles from "./RegistrationStats.module.css";
type Stats = {
  clickStats: ClickStats;
  funnel: ReturnType<typeof buildFunnel>;
  leads: LeadRecord[];
  totalLeads: number;
  offset: number;
  nextOffset: number | null;
  updatedAt: string;
};
const format = (iso: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Asia/Qyzylorda",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
export function RegistrationStats() {
  const [auth, setAuth] = useState<boolean | null>(null),
    [configured, setConfigured] = useState(true),
    [stats, setStats] = useState<Stats | null>(null),
    [loading, setLoading] = useState(false),
    [message, setMessage] = useState("");
  const load = useCallback(async (offset = 0) => {
    setLoading(true);
    setMessage("");
    try {
      const r = await fetch(`/api/stats/?offset=${offset}`, {
        cache: "no-store",
      });
      if (r.status === 401) {
        setAuth(false);
        setStats(null);
        return;
      }
      if (!r.ok) throw new Error();
      setStats(await r.json());
      setAuth(true);
    } catch {
      setMessage(
        "Не удалось загрузить статистику. Обнови страницу чуть позже.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/session/", {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((x) => {
        setConfigured(x.configured);
        setAuth(x.authenticated);
        if (x.authenticated) void load();
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setAuth(false);
          setMessage("Не удалось проверить доступ.");
        }
      });
    return () => controller.abort();
  }, [load]);
  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget,
      password = String(new FormData(form).get("password") || "");
    setLoading(true);
    setMessage("");
    try {
      const r = await fetch("/api/admin/session/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!r.ok) {
        setMessage(
          r.status === 429
            ? "Слишком много попыток. Повтори через 15 минут."
            : r.status === 503
              ? "Вход пока не настроен. Нужны серверные настройки администратора."
              : "Неверный пароль.",
        );
        return;
      }
      form.reset();
      setAuth(true);
      await load();
    } catch {
      setMessage("Не удалось войти. Повтори позже.");
    } finally {
      setLoading(false);
    }
  }
  async function logout() {
    const r = await fetch("/api/admin/session/", { method: "DELETE" });
    if (r.ok) {
      setAuth(false);
      setStats(null);
    } else setMessage("Не удалось выйти. Повтори позже.");
  }
  const labels = [
    ["story_start", "Начали историю"],
    ["story_step_1", "История: интересы"],
    ["story_step_2", "История: сравнение"],
    ["story_step_3", "История: план"],
    ["story_step_4", "История: экзамены"],
    ["story_step_5", "История: эссе"],
    ["story_step_6", "История: финансирование"],
    ["story_step_7", "История: документы"],
    ["story_complete", "Завершили историю"],
    ["quiz_start", "Начали квиз"],
    ["quiz_complete", "Завершили квиз"],
    ["result_view", "Посмотрели маршрут"],
    ["route_download", "Скачали PNG"],
    ["lead", "Оставили заявку"],
    ["registration_click", "Перешли к регистрации"],
  ] as const;
  const conversions = [
    ["startToComplete", "Начало → завершение"],
    ["completeToResult", "Завершение → просмотр"],
    ["resultToDownload", "Просмотр → скачивание"],
    ["resultToLead", "Просмотр → заявка"],
    ["resultToRegistrationClick", "Просмотр → переход"],
  ] as const;
  return (
    <main id="main-content" className={styles.main}>
      <Link href="/ru/" className="text-button">
        <ArrowLeft size={17} />
        Открыть сайт
      </Link>
      <p className={styles.label}>VENTORME / TEAM-004 / ADMIN</p>
      <h1>Заявки и статистика</h1>
      <p className={styles.lead}>
        Контакты и маршруты доступны только администратору.
      </p>
      {auth === null ? (
        <p role="status">Проверяем доступ…</p>
      ) : !auth ? (
        <section className={styles.login}>
          <LockKeyhole size={28} />
          <h2>Вход администратора</h2>
          {!configured && (
            <p>
              Вход ещё не настроен. Добавь VENTORME_ADMIN_PASSWORD_HASH и
              VENTORME_SESSION_SECRET в окружение сервера. Заявки не принимаются
              до настройки защиты.
            </p>
          )}
          <form onSubmit={login} method="post" action="/api/admin/session/">
            <label>
              Пароль
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                maxLength={256}
              />
            </label>
            <button
              className="button button-primary"
              disabled={loading || !configured}
            >
              {loading ? "Входим…" : "Войти"}
            </button>
          </form>
        </section>
      ) : (
        <>
          <div className={styles.toolbar}>
            <button
              className="button button-outline"
              disabled={loading}
              onClick={() => void load(stats?.offset || 0)}
            >
              <RefreshCw size={16} />
              {loading ? "Загрузка…" : "Обновить"}
            </button>
            <button className="text-button" onClick={() => void logout()}>
              <LogOut size={16} />
              Выйти
            </button>
            {stats && <span>Обновлено {format(stats.updatedAt)}</span>}
          </div>
          {stats && (
            <>
              <div className={styles.cards}>
                <div className={styles.card}>
                  <span>Все клики регистрации · старый счётчик</span>
                  <strong>{stats.clickStats.total}</strong>
                  <small>Сегодня: {stats.clickStats.today}</small>
                </div>
                <div className={styles.card}>
                  <span>Сохранённые заявки</span>
                  <strong>{stats.totalLeads}</strong>
                  <small>Контакт оставлен добровольно</small>
                </div>
                <div className={styles.card}>
                  <span>Подтверждённые регистрации</span>
                  <strong>—</strong>
                  <small>Данные основной платформы не подключены</small>
                </div>
              </div>
              <section className={styles.panel}>
                <h2>Воронка маршрутов</h2>
                <p>
                  Каждый этап считается один раз на случайный ID маршрута. Это
                  не количество людей. Редактирование и обновление страницы не
                  увеличивают этап.
                </p>
                <div className={styles.funnel}>
                  {labels.map(([k, l]) => (
                    <div key={k}>
                      <span>{l}</span>
                      <strong>
                        {k === "lead"
                          ? stats.funnel.leadJourneys
                          : stats.funnel.counts[k]}
                      </strong>
                    </div>
                  ))}
                </div>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <caption>
                      Конверсия: совпавшие ID маршрутов, а не отношение
                      несвязанных сумм
                    </caption>
                    <thead>
                      <tr>
                        <th>Этапы</th>
                        <th>Из предыдущего этапа</th>
                        <th>Конверсия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {conversions.map(([k, l]) => {
                        const v = stats.funnel.conversions[k];
                        return (
                          <tr key={k}>
                            <th>{l}</th>
                            <td>
                              {v.to} / {v.from}
                            </td>
                            <td>{v.rate === null ? "—" : `${v.rate}%`}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className={styles.note}>
                  Скачивание, заявка и переход — независимые действия после
                  результата. Переходы без квиза учитываются в числе переходов,
                  но не в конверсии результата. Подтверждённой регистрации эти
                  данные не доказывают.
                </p>
              </section>
              <section className={styles.panel}>
                <h2>Заявки · {stats.totalLeads}</h2>
                {stats.leads.length === 0 ? (
                  <p>Пока нет сохранённых заявок.</p>
                ) : (
                  <div className={styles.leads}>
                    {stats.leads.map((lead) => (
                      <details key={lead.id}>
                        <summary>
                          <span>
                            <strong>{lead.name}</strong>
                            <span>{lead.email}</span>
                          </span>
                          <span>
                            {format(lead.createdAt)} <ChevronDown size={15} />
                          </span>
                        </summary>
                        <div className={styles.leadDetail}>
                          <p>
                            <CheckCircle2 size={15} />
                            Согласие получено · {lead.source} ·{" "}
                            {lead.locale.toUpperCase()} · {lead.consentVersion}
                          </p>
                          <dl>
                            <dt>Класс</dt>
                            <dd>{lead.answers.grade}</dd>
                            <dt>Интересы</dt>
                            <dd>
                              {lead.answers.interests
                                .map(
                                  (i) => dictionaries.ru.choices.interests[i],
                                )
                                .join(", ")}
                            </dd>
                            <dt>Задачи по приоритету</dt>
                            <dd>{lead.answers.challenges.map(id => dictionaries.ru.choices.challenges[id]).join(" · ") || "—"}</dd>
                            <dt>Программа обучения</dt>
                            <dd>{lead.answers.program ? dictionaries.ru.choices.program[lead.answers.program] : "Не указана в прежнем квизе"}</dd>
                            <dt>Текущий этап</dt>
                            <dd>{lead.answers.stage ? dictionaries.ru.choices.stage[lead.answers.stage] : "—"}</dd>
                            <dt>Регионы</dt>
                            <dd>{lead.answers.regions.map(id => dictionaries.ru.choices.regions[id]).join(", ") || "—"}</dd>
                            {lead.answers.ibStatus && <><dt>Выбор предметов IB</dt><dd>{dictionaries.ru.choices.ibStatus[lead.answers.ibStatus]}</dd></>}
                            {lead.answers.ib &&
                              (["a", "b"] as const).map((k) => (
                                <div className={styles.definition} key={k}>
                                  <dt>
                                    Набор {k.toUpperCase()}
                                    {lead.answers.active === k
                                      ? " · выбран"
                                      : ""}
                                  </dt>
                                  <dd>
                                    {lead.answers[k]
                                      .map(
                                        (s) =>
                                          routeCopy.ru.subjects[
                                            subjects.indexOf(s)
                                          ],
                                      )
                                      .join(", ") || "—"}
                                  </dd>
                                </div>
                              ))}
                          </dl>
                          <h3>{lead.route.title}</h3>
                          <p>{lead.route.summary}</p>
                          <ol>
                            {lead.route.steps.map((step, i) => (
                              <li key={step}>
                                {i + 1}. {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      </details>
                    ))}
                  </div>
                )}
                <div className={styles.toolbar}>
                  <button
                    className="text-button"
                    disabled={loading || stats.offset === 0}
                    onClick={() => void load(Math.max(0, stats.offset - 25))}
                  >
                    ← Предыдущие
                  </button>
                  <span>
                    {stats.offset + 1}–
                    {Math.min(stats.offset + 25, stats.totalLeads)}
                  </span>
                  <button
                    className="text-button"
                    disabled={loading || stats.nextOffset === null}
                    onClick={() => void load(stats.nextOffset!)}
                  >
                    Следующие →
                  </button>
                </div>
              </section>
              <details className={styles.panel}>
                <summary>Старый счётчик по дням</summary>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Дата · время Казахстана</th>
                      <th>Клики</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.clickStats.days.map((day) => (
                      <tr key={day.date}>
                        <th>{day.date}</th>
                        <td>{day.clicks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </>
          )}
        </>
      )}
      {message && (
        <p role="alert" className={styles.error}>
          {message}
        </p>
      )}
    </main>
  );
}
