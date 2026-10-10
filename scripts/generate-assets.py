"""Optional: regenerate local fonts and share images. Requires Pillow + fontTools[woff]."""
import argparse, json, shutil
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from fontTools import subset
from fontTools.ttLib import TTFont

parser = argparse.ArgumentParser()
parser.add_argument('--fonts', type=Path, required=True, help='Directory with NotoSans.ttf, NotoSansSC.otf and their OFL licenses')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
font_dir = root / 'public/fonts'; font_dir.mkdir(parents=True, exist_ok=True)
og_dir = root / 'public/og'; og_dir.mkdir(parents=True, exist_ok=True)
texts = {locale: json.loads((root / f'src/locales/{locale}.json').read_text()) for locale in ['ru','en','kk','uz','zh','tr']}
latin = TTFont(args.fonts / 'NotoSans.ttf')
sc = TTFont(args.fonts / 'NotoSansSC.otf')
required = set('ӘҒҚҢӨҰҮҺІәғқңөұүһіçşğıİÇŞĞ')
assert all(ord(c) in latin.getBestCmap() for c in required), 'Missing required alphabet glyphs'
for filename, font, unicodes in [
    ('noto-sans.woff2', latin, set(range(0x0530)) | set(range(0x1e00,0x1f00)) | set(range(0x2000,0x2100))),
    ('noto-sans-sc.woff2', sc, {ord(c) for c in json.dumps(texts['zh'],ensure_ascii=False)} | set(range(32,127))),
]:
    options = subset.Options(); options.flavor = 'woff2'; options.recalc_bounds = True; options.notdef_glyph = True
    sub = subset.Subsetter(options=options); sub.populate(unicodes=unicodes); sub.subset(font)
    font.flavor = 'woff2'; font.save(font_dir / filename)
for name in ['NotoSans-OFL.txt', 'NotoSansSC-OFL.txt']:
    shutil.copyfile(args.fonts / name, font_dir / name)

def font(size, zh=False, weight=400):
    f = ImageFont.truetype(str(args.fonts / ('NotoSansSC.otf' if zh else 'NotoSans.ttf')), size)
    if not zh: f.set_variation_by_axes([weight,100])
    return f
def wrap(draw, text, face, width, zh=False):
    units = list(text) if zh else text.split(' '); lines=[]; line=''
    for unit in units:
        candidate = line + ('' if zh or not line else ' ') + unit
        if line and draw.textlength(candidate,font=face)>width: lines.append(line); line=unit
        else: line=candidate
    if line: lines.append(line)
    return lines
for locale,d in texts.items():
    image = Image.new('RGB',(1200,630),'#ecf0f5'); draw=ImageDraw.Draw(image)
    draw.text((72,56),'Ventorme.',font=font(38,weight=700),fill='#232540')
    cx,cy=1080,92
    draw.ellipse((cx-38,cy-38,cx+38,cy+38),outline='#3d5da1',width=2)
    draw.polygon([(cx+18,cy-24),(cx+4,cy+4),(cx-18,cy+24),(cx-4,cy-4)],fill='#3d5da1')
    draw.polygon([(cx+18,cy-24),(cx+4,cy+4),(cx-4,cy-4)],fill='#f5c774')
    heading=font(57,zh=locale=='zh',weight=650); y=174
    for part,color in [(d['landing']['titleStart'],'#232540'),(d['landing']['titleEnd'],'#3d5da1')]:
        for line in wrap(draw,part,heading,1030,locale=='zh'):
            draw.text((72,y),line,font=heading,fill=color); y+=78
    note=font(23,zh=locale=='zh'); line=d['landing']['note']
    y=max(465,y+32); y=min(y,520)
    draw.rounded_rectangle((72,y,1128,y+66),radius=16,fill='#f5c774')
    draw.text((96,y+14),line,font=note,fill='#232540')
    image.save(og_dir / f'{locale}.png',optimize=True)
print('Local fonts, required glyphs and six share images generated.')
