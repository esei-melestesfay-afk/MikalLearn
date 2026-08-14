from pathlib import Path
import re
import shutil

ROOT = Path(".")

app_file = ROOT / "app.py"
lasa_file = ROOT / "templates" / "lasa.html"


# ============================================================
# TA BORT /turbolasa FRÅN APP.PY
# ============================================================

if app_file.exists():

    text = app_file.read_text(
        encoding="utf-8"
    )

    # Ta bort hela TurboLäsning-blocket
    text = re.sub(
        r'''
        \n*
        \#\s*=+\s*\n
        \#\s*TURBOLÄSNING\s*\n
        \#\s*=+\s*\n
        \s*
        @app\.route\(["']/turbolasa["']\)
        \s*
        def\s+turbolasa\(\):
        \s*
        return\s+render_template\(["']turbolasa\.html["']\)
        \s*
        ''',
        "\n",
        text,
        flags=re.VERBOSE
    )

    # Extra säkerhet om kommentarerna skulle se annorlunda ut
    text = re.sub(
        r'''
        \n*
        @app\.route\(["']/turbolasa["']\)
        \s*
        def\s+turbolasa\(\):
        \s*
        return\s+render_template\(["']turbolasa\.html["']\)
        \s*
        ''',
        "\n",
        text,
        flags=re.VERBOSE
    )

    app_file.write_text(
        text,
        encoding="utf-8",
        newline="\n"
    )

    print("✅ /turbolasa borttagen från app.py")


# ============================================================
# TA BORT KNAPPEN FRÅN LÄSA
# ============================================================

if lasa_file.exists():

    html = lasa_file.read_text(
        encoding="utf-8"
    )

    html = re.sub(
        r'\s*<script\s+src=["\']/static/turbolasa-entry\.js(?:\?v=\d+)?["\']\s+defer></script>\s*',
        "\n",
        html
    )

    lasa_file.write_text(
        html,
        encoding="utf-8",
        newline="\n"
    )

    print("✅ TurboLäsning-knappen borttagen från Läsa")


# ============================================================
# TA BORT ALLA TURBO-FILER
# ============================================================

files = [
    ROOT / "templates" / "turbolasa.html",
    ROOT / "static" / "turbolasa.js",
    ROOT / "static" / "turbolasa-entry.js",
    ROOT / "static" / "turbolasa-data.json",
]

for file in files:

    if file.exists():
        file.unlink()
        print("🗑️ Tog bort:", file)


audio_folder = (
    ROOT
    / "static"
    / "audio"
    / "turbolasa"
)

if audio_folder.exists():

    shutil.rmtree(
        audio_folder
    )

    print("🗑️ Alla TurboLäsning-ljud borttagna")


# Lokala byggfiler behöver vi inte heller längre
for name in [
    "build_turbolasning.py",
    "repair_turbo_builder.py"
]:

    file = ROOT / name

    if file.exists():
        file.unlink()


print()
print("======================================")
print("✅ TURBOLÄSNING ÄR BORTTAGEN")
print("======================================")
