# VentorMe route landing

Implemented 16 October 2026 in the existing Netfli14/Ventorme project. The existing `/api/registration-click/` records and `/stats/` URL are retained. The new design is served at `/{locale}/`, with compatible `/quiz/` and `/result/` entry points.

## User flow

Three questions share one session state with the IB builder, comparisons and route card. Contact details are never required for the result or PNG export. The builder presents learning scenarios, not verified university requirements or admission probabilities. A general non-IB route is available. Recommendations are deterministic rules, explicitly labelled as such.

Languages: RU, EN, KZ (`kk`), UZ, ZH, TR. Theme preferences continue to follow the existing cookie choice. The original mascot MP4 and poster are retained, with an accessible native video dialog and inline playback on phones. There is no scroll interception or mandatory intro.

## Motion

The project-scoped skill is installed at `.agents/skills/motion-design/SKILL.md`, with its upstream MIT license and supporting references. Source: `LottieFiles/motion-design-skill`, commit `f9a8a041b85185ee4881b3471d3415e939aac772`.

GSAP handles the route construction scene, quiz changes, IB shared-element moves and result assembly. Signature easing: `power3.out`; feedback 240–320 ms, cards 400 ms, hero sequence under 2 seconds. Effects settle instead of looping. Reduced motion removes spatial choreography. Native controls, readable labels and selected states remain usable without motion.

Existing Three.js, GSAP, design-dna reference profiles and the linked Genjutsu repository were reviewed. No duplicate animation framework or WebGL scene was added for the same effect. This implementation applies the LottieFiles skill; it does not claim to install every linked repository as a skill.

The Instagram exclusion reference could not be fetched. Its contents were not inferred.

## Private storage and administration

Use the existing **private** Vercel Blob store connected to the click counter. The server uses `BLOB_STORE_ID` with platform OIDC or the existing server-only `BLOB_READ_WRITE_TOKEN`.

Paths:

- `registration-clicks/`: existing immutable per-click records, unchanged.
- `route-events/{event}/{journeyId}.json`: one anonymous record per stage and route ID. No answers or contact data.
- `leads/{id}.json`: contact, consent, quiz state, both subject sets, active set, server-generated localized route, timestamp and fixed `team-004` source. Private and administrator-only.
- `rate-limits/`: fixed-window immutable slots for cross-instance login and lead limits; no raw IP is stored.

`/stats/` is the protected panel. It shows the original click totals, new route funnel, conversion intersections and saved leads. Confirmed registrations stay unavailable until the main platform supplies them. A click or request is never labelled as a registration.

Authentication uses a salted scrypt password hash, signed 8-hour HttpOnly/SameSite=Strict cookie, Secure over HTTPS, same-origin write checks and server-side rate limits. All data APIs check authorization and return private/no-store responses. A client-side login screen is not relied on as authorization.

## Production setup and password rotation

Production is connected at `https://ventorme.vercel.app/`. On 17 October 2026, the Vercel connection allowed the two administrator values to be added as **sensitive, Production-only** environment variables in the existing project. No existing storage values were replaced and no production credentials were committed. The project was redeployed with the new environment. The administrator password is provided privately to the owner.

A clearly labelled synthetic lead, `Тест подключения · 17.10.2026` with `test@example.invalid`, was submitted through the published quiz and form. The production endpoint saved it in the private store; authenticated statistics returned its answers, subject sets, consent and generated route. It remains visible as a test record. Anonymous statistics requests return 401. Quiz start/completion, result view and PNG download appeared in the same funnel. These test conversions are verification data, not product performance claims.

For a new environment or password rotation, in a private local terminal run:

```sh
npm run admin:setup
```

This creates an ignored, mode-0600 `.env.admin-setup.json` without transmitting or logging its contents. In the existing Vercel project `ventorme` (`prj_TTv7tqzNwTl6R8sbAslP8kRHaLt8`, team `team_52fKwoB02PPz5IA8PPUj7Hqy`), add these two values as sensitive environment variables:

- `VENTORME_ADMIN_PASSWORD_HASH`
- `VENTORME_SESSION_SECRET`

Redeploy, open `/stats/`, and log in with the generated `password`. Keep the setup file private. Rotating the session secret invalidates existing administrator sessions. The source contains no production password, signing key or storage credential.

Until both authentication and storage are configured, lead submission returns 503 and the visitor sees a real failure message. There is no fake success or mail promise. Automatic email delivery is not implemented; the form is a voluntary request to team 004.

## Verification

```sh
npm run check
npx playwright install chromium
npm run test:e2e
```

The E2E script starts its own Next server, creates isolated temporary data and synthetic administrator credentials, and cleans up the data afterward. It never creates production test leads. `VENTORME_BROWSER_PATH` can select an existing Chromium executable. `VENTORME_TEST_DIST_DIR` keeps E2E development output separate from the production build.

Verified in Chromium: three-question flow, multiple interests and exclusive undecided choice, back navigation, immediate result, IB selection and A/B changes, PNG download, required consent, real local server persistence, administrator login/view/logout, anonymous event schemas, six languages, both themes, widths 320/390/768/1024/1440, original video playback, reduced motion and non-IB route. No page or console errors occurred in the passing run. Russian and Chinese PNG exports were opened and visually checked. The Chinese character subset includes every character used by the current locale copy; a separate CJK font family is loaded for the interface and canvas export.

Production persistence and authenticated access were additionally verified on 17 October 2026. Chromium emulation does not constitute a physical iPhone/Safari check.

## Primary content sources

VentorMe capabilities were checked against `https://ventorme.ai/` on 16 October 2026: career exploration, university selection, admission task planning, exam preparation, essay tools and AI mentoring. No user counts, reviews, outcome metrics or university requirements were copied into the landing. Subject guidance remains explicitly demonstrative.
