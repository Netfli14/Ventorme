# Real Kling video intro — VentorMe

The homepage now includes the actual Kling snow-leopard mascot video that the user uploaded, encoded as H.264/yuv420p MP4 with faststart.

- Real video: `public/media/ventorme-mascot-intro.mp4` (4.5 s, native 1484 × 620, high-quality CRF 14)
- First-frame poster: `public/media/ventorme-mascot-poster.jpg`
- The final clip preserves the actual filmed mascot animation, omits the initial white multi-pose storyboard frames, and covers the generator's incorrect baked-in ending text with a clean frame sampled from the same original video. The correct accessible localized headline is rendered as HTML over the final segment.
- Both mobile and desktop: normal muted, inline video autoplay, **no scroll-driven seeking and no mouse control**. Plays once and holds the ending frame.
- Mobile: `object-fit: cover` uses a centered scene capped at 56svh / 460px to limit enlargement. Desktop uses `contain` to preserve the full aspect ratio.
- Localized final copy on RU: «Мы VentorMe» — «AI-платформа для поступления».
- If autoplay is blocked, a play button is displayed when the video is ready; replay remains available after the finish; the intro can always be skipped.
- Native page scrolling remains available, with no 280vh sticky lock.
- Build-time `hasMascotVideo()` confirms a valid-looking MP4 exists; if missing during future deployments, the intro is omitted (no fake drawn mascot).

## Validation

Verify `npm run check` in GitHub Actions, Vercel Preview, and the Production deployment commit. Confirm the MP4 is delivered with HTTP 200, the poster loads, and visual playback on an Android phone and a laptop. Automated checks cannot replace testing on the user's actual device.

The user-provided original file was named `kling_20261012_VIDEO_Create_an__412_0.mp4`; the optimized derived clip is produced from that file and retains the same mascot footage.

## Update: 2026-10-12

Video is encoded directly from the original MP4, using CRF 14, GOP 48 and conservative luma sharpening. Source frames 41–105 retain the same animation; the last clean frame is held before the misspelled title appears. The first-frame poster uses JPEG quality 1. The asset URLs carry `?v=2` to refresh cached copies. No invented 4K detail or frame interpolation is claimed.

Registration is pinned to the official team-004 link. Cookie preferences are localized to all six languages; optional theme storage only follows acceptance. No analytics are enabled.
