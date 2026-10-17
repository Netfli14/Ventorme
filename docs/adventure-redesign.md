# VentorMe: warm palette and SAT adventure

This update targets Netfli14/Ventorme and the existing ventorme.vercel.app project. Ventorme1 is a separate earlier variant.

## Experience

- Original mascot MP4 remains the first section, with immediate plan, registration and skip controls.
- Existing six-question personal quiz and optional IB-status question remain intact. The result explains its basis, displays two concrete actions, and shows five further chapter buttons through fog. Each opens a registration dialog. The copied route includes only the two visible actions.
- University exploration contains two open examples and two gated placeholders. Comparison criteria reorder what to inspect, not university rankings. No fees, requirements, match percentages or admission probabilities are fabricated.
- The university conveyor recreates the public VentorMe site's two-direction CSS movement, grayscale-to-colour hover, and pause behaviour. All logo and mascot assets come from public /figma/studentlanding/v4f/ paths on ventorme.ai. These are illustrative, not evidence of our visitors' admission outcomes.
- /[locale]/sat/ is a separate page with ten original introductory lessons, alternating English and Math. Each has a short explanation and three four-choice questions. Three wrong submissions exhaust HP and require restarting that lesson. Closing or refreshing preserves the current attempt. A completion grants 20 XP once; replay does not grant more. Stops 11–12 lead to a registration dialog.
- Game progress stays in versioned localStorage. Quiz state stays in sessionStorage. Neither is transferred to VentorMe. No new accounts, payments, personal forms, or answer analytics were added.
- All registration buttons retain team-004 UTM attribution and the existing anonymous click counter. Optional funnel events still honour cookie consent.

## Design and motion

Uses the existing MASTER.md design principles and LottieFiles motion-design skill already bundled in .agents/skills/motion-design. Signature ease power3.out / cubic-bezier(.2,0,0,1), feedback 150–220 ms, panel transitions 220–300 ms, entrance 520 ms. Subject buttons use a shallow 3D press. Important changes combine position and opacity. The continuous university conveyor uses constant speed to avoid a visible seam and has an explicit pause button. No scroll hijacking. Reduced motion stops conveyors and removes spatial choreography.

The blue and orange palette is implemented with shared CSS variables in light and dark themes. The native dialogs support Escape and focus containment. SAT questions and teaching notes remain English intentionally; all surrounding UI is translated in RU/EN/KK/UZ/ZH/TR. This is not an official College Board test, SAT score estimate, or a full SAT curriculum.

## Sources checked 18 October 2026

- https://ventorme.ai/ — public feature names, mascot, logo source and visual/motion reference.
- https://satsuite.collegeboard.org/practice/content-domains — scope of English and math topic families. Questions are original, not copied from College Board.

## Verification

30 unit/server tests passed, including full ten-lesson progression, life loss, failure/restart, restoration, corrupt storage, and no duplicate XP. Production build and TypeScript passed. Build includes all six languages for landing, quiz, result and SAT routes. Browser checks are recorded separately when completed. Local preview was skipped because the required control-browser capability is unavailable in this managed environment.
