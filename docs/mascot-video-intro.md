# Real Kling video intro — VentorMe

The homepage now includes the actual Kling snow-leopard mascot video that the user uploaded, encoded as H.264/yuv420p MP4 with faststart.

- Real video: `public/media/ventorme-mascot-intro.mp4` (4.5 s, ~1.1 MB)
- First-frame poster: `public/media/ventorme-mascot-poster.jpg`
- The final clip preserves the actual filmed mascot animation, omits the initial white multi-pose storyboard frames, and covers the generator's incorrect baked-in ending text with a clean frame sampled from the same original video. The correct accessible localized headline is rendered as HTML over the final segment.
- Both mobile and desktop: normal muted, inline video autoplay, **no scroll-driven seeking and no mouse control**. Plays once and holds the ending frame.
- Mobile: `object-fit: cover` fills portrait screens with the mascot centered instead of displaying a tiny horizontal strip. Desktop uses the same cover behavior with centered subject.
- Localized final copy on RU: «Мы VentorMe» — «AI-платформа для поступления».
- If autoplay is blocked, a play button is displayed when the video is ready; replay remains available after the finish; the intro can always be skipped.
- Native page scrolling remains available, with no 280vh sticky lock.
- Build-time `hasMascotVideo()` confirms a valid-looking MP4 exists; if missing during future deployments, the intro is omitted (no fake drawn mascot).

## Validation

Verify `npm run check` in GitHub Actions, Vercel Preview, and the Production deployment commit. Confirm the MP4 is delivered with HTTP 200, the poster loads, and visual playback on an Android phone and a laptop. Automated checks cannot replace testing on the user's actual device.

The user-provided original file was named `kling_20261012_VIDEO_Create_an__412_0.mp4`; the optimized derived clip is produced from that file and retains the same mascot footage.
