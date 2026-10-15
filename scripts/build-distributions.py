#!/usr/bin/env python3
"""Build the portable skill with deterministic, public-only contents."""
from hashlib import sha256
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

root = Path(__file__).resolve().parents[1]
method = (root / "COUNCIL.md").read_bytes()
reference = root / "skills/m3s-council/references/COUNCIL.md"
reference.write_bytes(method)
output = root / "downloads"
output.mkdir(exist_ok=True)
archive = output / "m3s-council-skill.zip"
entries = {
    "m3s-council/SKILL.md": root / "skills/m3s-council/SKILL.md",
    "m3s-council/references/COUNCIL.md": reference,
}
license_file = root / "LICENSE"
if license_file.exists():
    entries["m3s-council/LICENSE"] = license_file
with ZipFile(archive, "w", compression=ZIP_DEFLATED) as bundle:
    for name, source in sorted(entries.items()):
        info = ZipInfo(name, date_time=(2026, 10, 14, 0, 0, 0))
        info.compress_type = ZIP_DEFLATED
        info.external_attr = 0o644 << 16
        bundle.writestr(info, source.read_bytes())
(output / "SHA256SUMS").write_text(f"{sha256(archive.read_bytes()).hexdigest()}  {archive.name}\n")
with ZipFile(archive) as bundle:
    assert bundle.testzip() is None
    assert bundle.read("m3s-council/references/COUNCIL.md") == method
print(f"Built and verified {archive.name}: {len(entries)} public files")
