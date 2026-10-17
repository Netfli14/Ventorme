import { eventNames, uuidPattern, type RouteEvent } from "./route-model";
export function buildFunnel(paths: string[], leadJourneys: string[]) {
  const sets = Object.fromEntries(
    eventNames.map((e) => [e, new Set<string>()]),
  ) as Record<RouteEvent, Set<string>>;
  for (const path of paths) {
    const [, event, file] = path.split("/");
    const id = file?.replace(/\.json$/, "");
    if (eventNames.includes(event as RouteEvent) && id && uuidPattern.test(id))
      sets[event as RouteEvent].add(id);
  }
  const leads = new Set(leadJourneys);
  const counts = Object.fromEntries(
    eventNames.map((e) => [e, sets[e].size]),
  ) as Record<RouteEvent, number>;
  const conversion = (from: Set<string>, to: Set<string>) => ({
    from: from.size,
    to: [...from].filter((id) => to.has(id)).length,
    rate: from.size
      ? Math.round(
          ([...from].filter((id) => to.has(id)).length / from.size) * 1000,
        ) / 10
      : null,
  });
  return {
    counts,
    leadJourneys: leads.size,
    conversions: {
      startToComplete: conversion(sets.quiz_start, sets.quiz_complete),
      completeToResult: conversion(sets.quiz_complete, sets.result_view),
      resultToDownload: conversion(sets.result_view, sets.route_download),
      resultToLead: conversion(sets.result_view, leads),
      resultToRegistrationClick: conversion(
        sets.result_view,
        sets.registration_click,
      ),
    },
  };
}
