# Mascot video intro

Place the uploaded real mascot animation at `public/media/ventorme-mascot-intro.mp4` (the MP4 asset has not yet been committed). This file is the actual generated mascot video, not a demo placeholder.

On every locale homepage, `MascotScrollIntro` occupies 280svh and contains a 100svh sticky video scene. Vertical scroll sets `video.currentTime`, and reverse scroll seeks backward. No autoplay and no wheel event cancellation. After the scene, the normal Hero follows. The "Skip intro" link jumps to `#content-start`.

The component detects missing media and removes itself to avoid a blank sticky screen. It respects reduced-motion and preserves the browser's normal scroll speed. For smoother seeking, encode the real MP4 as H.264/yuv420p with frequent keyframes (ideally each frame or every 2-4 frames); verify on Safari/iOS, Chrome/Android, and desktop wheel/trackpad.

Before release: add the actual MP4, test scrolling forward and backward with a browser, confirm 6 locales, run `npm ci && npm run check` then deploy. Current environment could parse the TypeScript but couldn't install all npm packages offline or obtain the original video bytes from Project storage.

## Layout detail
The home header is fixed above the video scene to preserve the full 100svh frame (it switches to a dark glass treatment during the intro), and returns to the page theme as the scene is left. Mobile progress uses the scene's measured element height, not the browser's changing innerHeight.

## Automated checks
`npm test` now checks clamping, forward/reverse media seeking, the end frame boundary, and invalid metadata. GitHub Actions runs `npm run check` on the mascot PR and main.
