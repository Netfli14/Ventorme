# Original VentorMe mascot video

The intro is a **normal, timed video on both phone and laptop**. Mouse movements, scrolling, and touch gestures do not control its timeline. The homepage scrolls naturally after the video section.

- Asset: original user-provided `kling_20261012_VIDEO_Create_an__412_0.mp4` placed at `public/media/ventorme-mascot-intro.mp4`.
- Video element: `autoPlay muted playsInline preload="auto"` so autoplay is allowed by most mobile and desktop browsers; it plays once and holds the last frame.
- Final overlay near the end: «Мы VentorMe» / «AI-платформа для поступления» (localized across six languages).
- If autoplay is blocked, the visitor can tap «Воспроизвести видео». A replay button is available after completion.
- Content follows immediately after the `100svh` section; no sticky `280svh` scene, no `scrollProgress`, and no video seeking from page scroll.
- If the actual MP4 is not in the repository at build time, `hasMascotVideo()` omits the entire intro. There is no fake 3D illustration or sample video.

## Encoding the actual uploaded video

For wider mobile compatibility, encode the *same original clip* (not a replacement) into H.264 + AAC (or omit audio), yuv420p, with faststart:

```bash
mkdir -p public/media
ffmpeg -i kling_20261012_VIDEO_Create_an__412_0.mp4 -an -c:v libx264 -pix_fmt yuv420p -crf 21 -preset medium -movflags +faststart public/media/ventorme-mascot-intro.mp4
```

Then run `npm run check` and test on actual Android Chrome and iOS Safari.

The original uploaded media is visible in previous Project metadata, but its bytes could not be materialized in this session. Upload the original MP4 directly to the current conversation (or commit it in the repository) before claiming the video itself is live.
