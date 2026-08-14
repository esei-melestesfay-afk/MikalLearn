from pathlib import Path
import re

p = Path("build_lasloop_10x10.py")

text = p.read_text(
    encoding="utf-8"
)

# LäsLoop ska nu ha 500 ord istället för 1000.
text = text.replace(
    "1000",
    "500"
)

p.write_text(
    text,
    encoding="utf-8",
    newline="\n"
)

# Ta bort gamla ljud över nummer 500 om sådana finns.
audio = Path(
    "static/audio/lasloop_words"
)

removed = 0

if audio.exists():

    for file in audio.glob(
        "word_*.mp3"
    ):

        match = re.search(
            r"word_(\d+)\.mp3$",
            file.name
        )

        if (
            match
            and
            int(match.group(1)) > 500
        ):

            file.unlink()
            removed += 1


print("✅ LäsLoop ändrad till 500 ord")
print("✅ Fortfarande 10 sekunder per ord")
print("✅ Fortfarande 10/10 för att behärska ett ord")
print(
    f"✅ Tog bort {removed} ljud över nummer 500"
)
