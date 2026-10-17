"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  emptyRoute,
  restoreRoute,
  routeFromAnswers,
  type RouteState,
  type RouteEvent,
} from "@/lib/route-model";
import { readState } from "@/lib/storage";
const KEY = "ventorme.route.v3";
type Context = {
  route: RouteState;
  ready: boolean;
  patch: (p: Partial<RouteState>) => void;
  track: (event: RouteEvent) => void;
  journey: () => string;
};
const RouteContext = createContext<Context | null>(null);
export function RouteProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState(emptyRoute),
    [ready, setReady] = useState(false);
  const current = useRef(route),
    id = useRef(""),
    sent = useRef(new Set<string>());
  const journey = useCallback(() => {
    if (!id.current) {
      try {
        id.current = sessionStorage.getItem("ventorme.journey.v2") || "";
      } catch {}
      if (!id.current) {
        id.current = crypto.randomUUID();
        try {
          sessionStorage.setItem("ventorme.journey.v2", id.current);
        } catch {}
      }
    }
    return id.current;
  }, []);
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(KEY) || sessionStorage.getItem("ventorme.route.v2");
      const oldQuiz = readState(sessionStorage);
      const s = restoreRoute(JSON.parse(saved || "null")) || (oldQuiz ? routeFromAnswers(oldQuiz.answers, oldQuiz.step) : null);
      if (s) {
        current.current = s;
        setRoute(s);
        sessionStorage.setItem(KEY, JSON.stringify(s));
      }
    } catch {}
    setReady(true);
  }, []);
  const patch = useCallback((p: Partial<RouteState>) => {
    const next = { ...current.current, ...p };
    current.current = next;
    setRoute(next);
    try {
      sessionStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  }, []);
  const track = useCallback(
    (event: RouteEvent) => {
      if (sent.current.has(event)) return;
      const journeyId = journey();
      sent.current.add(event);
      // Analytics carries event names and a random route ID only: no answers or contacts.
      void fetch("/api/route-events/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, journeyId }),
        keepalive: true,
      })
        .then((r) => {
          if (!r.ok) sent.current.delete(event);
        })
        .catch(() => sent.current.delete(event));
    },
    [journey],
  );
  return (
    <RouteContext.Provider value={{ route, ready, patch, track, journey }}>
      {children}
    </RouteContext.Provider>
  );
}
export function useRoute() {
  const c = useContext(RouteContext);
  if (!c) throw new Error("Route provider missing");
  return c;
}
