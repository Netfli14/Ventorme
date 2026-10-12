# Original VentorMe mascot video intro

The intro uses **only the user's original** `kling_20261012_VIDEO_Create_an__412_0.mp4`, not a substitute generated illustration or a demo clip.

## Import the original video

1. Place the original MP4 at `public/media/ventorme-mascot-intro.mp4`.
2. For mobile-friendly frame scrubbing, consider re-encoding the **same** video using:
   ```bash
   ffmpeg -i kling_20261012_VIDEO_Create_an__412_0.mp4 -an -c:v libx264 -pix_fmt yuv420p -crf 20 -preset medium -g 4 -keyint_min 4 -sc_threshold 0 -movflags +faststart public/media/ventorme-mascot-intro.mp4
   ```
3. Run `npm run check`, test scroll forward/backward in mobile Safari and Android Chrome, then push to main.

## Deployment behavior

The static-exported Next.js homepage checks at **build time** that the MP4 exists and has a plausible MP4 header. If missing, the entire sticky intro is omitted rather than showing a blank screen or a code-drawn snow leopard. On the next build with the real file, video scrubbing activates automatically. The real video has `playsInline`, `muted`, and is never played with autoplay; scroll adjusts `currentTime`.

Section is 280svh with a 100svh sticky scene. Scroll down moves forward and scroll up rewinds. The first frame appears on initial load and the final title overlays the last frames: `Мы VentorMe` / `AI-платформа для поступления`.

The original file from an earlier Project upload was visible in Library metadata but the current file access layer denied access to its actual bytes. Never claim it is deployed until the file has been committed under the path above and verified on mobile.
