# Ventorme1 — three-step admission plan

This version is separate from the original landing at `https://ventorme.vercel.app`.

The original is the six-question quiz and video version at Git commit `ec785674958f929ec7e31793cb2fb803ef756e93`. The new version starts from `b3a7fb85457dcd1308785a8f5b6b560a799f7052` and applies the user's 17 October follow-up.

Changes:

- Replaced the scenario choice with “Создать план за минуту”; removed the personal next-step option from this variant.
- Three interactive decisions produce the first plan. Exams, essays, funding and applications are locked previews leading to the actual VentorMe registration, never a local signup form.
- Restored the original video intro in front of the hero. The intro provides direct plan and registration actions and normal scrolling.
- Replaced the FAQ with the six questions in the supplied screenshot, with cautious answers grounded in the official public site.
- Retained both themes, six languages, the mascot route assembly animation, team-004 registration attribution and consent-based funnel events.
- Migrated old seven-stage sessions to the new three-stage limit; no saved state can reopen the locked content.

Validation: typecheck, 31 tests and production build passed. Generated HTML for all 18 localized routes was checked for the six FAQ entries, locked stages, removal of the scenario switch, exact registration URL and restored video on each home page. Live browser visual verification remains unavailable.

Target separation requested: GitHub `Netfli14/Ventorme` + the existing Vercel `ventorme` project for the old version; GitHub `Netfli14/Ventorme1` + a separate `ventorme1` project for this version. Do not claim the new repository or deployment exists until the services return success.
