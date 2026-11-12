"""Re-export only the four authorized review props. Existing 113 records stay intact."""
from pathlib import Path
import hashlib
import json
from PIL import Image

root = Path(__file__).resolve().parents[1] / 'review/botanical'
manifest_path = root / 'asset-manifest.json'
manifest = json.loads(manifest_path.read_text())
for name in ('uruli', 'kinnam', 'pourer', 'filter'):
    master = root / f'masters/brass-{name}.png'
    assert master.is_file() and not master.is_symlink()
    image = Image.open(master).convert('RGBA')
    bounds = image.getchannel('A').point(lambda alpha: 255 if alpha > 8 else 0).getbbox()
    assert bounds
    image = image.crop(bounds)
    image.thumbnail((1400, 1400), Image.Resampling.LANCZOS)
    for extension in ('png', 'webp'):
        destination = root / f'assets/brass-{name}.{extension}'
        assert not destination.is_symlink()
        if extension == 'png':
            image.save(destination, optimize=True)
        else:
            image.save(destination, 'WEBP', quality=90, method=6)
        record = next(a for a in manifest['assets'] if a['file'] == destination.relative_to(root).as_posix())
        record.update(sha256=hashlib.sha256(destination.read_bytes()).hexdigest(), bytes=destination.stat().st_size, width=image.width, height=image.height)
manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
print('Exported four brass prop variants; preserved original media and all existing studies.')
