# VentorMe intro media

Source: the user's `kling_20261012_VIDEO_Create_an__412_0.mp4`.
The deployable copy is regenerated directly from the original, rather than
recompressing the earlier 1.1 MB derivative.

- Native resolution: 1484 × 620; 24 fps; 4.5 seconds.
- H.264/yuv420p, CRF 14, GOP 48, no audio, MP4 faststart.
- Conservative sharpening: unsharp luma amount 0.25, chroma unchanged.
- Original frames 41–105 retain the turn, high-five and return.
- The last clean frame is held for the remaining time, before the generator's
  misspelled title appears. Localized title text is rendered as HTML.
- First-frame JPEG poster is encoded at quality 1.
- No invented 4K detail or interpolated animation frames.

Reproduce from the attached original as `INPUT.mp4`:

```bash
ffmpeg -i INPUT.mp4 -an \
  -vf 'trim=start_frame=41:end_frame=106,setpts=PTS-STARTPTS,unsharp=5:5:0.25:5:5:0,tpad=stop_mode=clone:stop_duration=1.791667' \
  -t 4.5 -c:v libx264 -preset slow -crf 14 -g 48 -pix_fmt yuv420p \
  -movflags +faststart -map_metadata -1 public/media/ventorme-mascot-intro.mp4
ffmpeg -i public/media/ventorme-mascot-intro.mp4 -frames:v 1 -q:v 1 \
  public/media/ventorme-mascot-poster.jpg
```

Both screen sizes use ordinary muted inline autoplay, with play fallback,
replay and skip. Desktop uses contain; mobile limits the video height to
56svh / 460px to prevent excessive enlargement of the landscape source.
