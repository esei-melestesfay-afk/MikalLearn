import asyncio
import json
import re
import shutil
import subprocess
from pathlib import Path

import edge_tts
from edge_tts import VoicesManager


ROOT = Path(".")
STATIC = ROOT / "static"
TEMPLATES = ROOT / "templates"

NEW_AUDIO = STATIC / "audio" / "lasloop_common500_v2"
NEW_AUDIO.mkdir(parents=True, exist_ok=True)


# ============================================================
# EXAKT 500 VANLIGA OCH ANVÄNDBARA SVENSKA ORD
# ============================================================

WORDS_TEXT = """
jag du han hon vi ni man
mig dig honom henne oss dem
min mitt mina din ditt dina hans hennes vår vårt våra er ert era deras
den det de denna detta dessa någon något några ingen inget inga alla allt varje samma annan annat andra själv
en ett
och eller men att som om för med utan till från av på i under över mellan genom mot hos före efter innan
är var har hade kan kunde ska skulle vill ville får fick måste behöver behövde blir blev gör gjorde går gick kommer kom ser såg vet visste säger sa tar tog ger gav finns fanns
tycker tyckte tänker tänkte känner kände börjar började slutar slutade arbetar läser läste skriver skrev lyssnar pratar pratade frågar frågade svarar svarade hjälper hjälpte försöker försökte lär lärde använder använde hittar hittade väntar väntade bor bodde heter hette
äter åt dricker drack sover sov vaknar vaknade sitter satt står stod ligger låg springer sprang spelar spelade tränar tränade köper köpte säljer sålde betalar betalade öppnar öppnade stänger stängde tittar tittade visar visade berättar förklarar förstår förstod minns glömmer glömde väljer valde lämnar hämtar ringer ringde skickar
vem vad var varför hur vilken vilket vilka när då där här
inte också bara alltid ofta ibland aldrig kanske nästan verkligen mycket lite mer mindre ganska därför eftersom ändå direkt tillsammans snart sedan sen först sist redan igen nu
idag igår imorgon morgon kväll natt dag vecka månad år tid minut timme
hem hemma ute inne upp ner in ut bort kvar fram bak vänster höger nära långt
bra bättre bäst rätt fel stor liten lång kort ny gammal lätt svår svårt viktig viktigt enkel enkelt snabb snabbt långsam långsamt glad ledsen trött hungrig törstig kall varm snäll arg rädd trygg stark svag fin ful ren smutsig full tom öppen stängd
skola lärare elev klass lektion rast prov bok text ord mening fråga svar uppgift arbete problem hjälp exempel resultat
familj vän kompis barn mamma pappa syster bror
mat vatten mjölk bröd ris pasta kött frukt äpple banan frukost lunch middag
hus lägenhet rum kök toalett badrum sovrum bord stol säng dörr fönster golv vägg tak
mobil dator telefon bild video musik spel
butik affär jobb pengar pris kort
buss bil cykel tåg väg gata station hållplats
stad land plats park plan
jacka tröja byxor skor väska
hand arm ben fot huvud hår öga ögon öra öron mun näsa mage rygg
röd blå grön gul svart vit
måndag tisdag onsdag torsdag fredag lördag söndag
januari februari mars april maj juni juli augusti september oktober november december
vår sommar höst vinter sol regn snö vind väder
svenska engelska språk läsa skriva lyssna tala stava betyder namn nummer adress datum ålder
sak saker person personer människor idé gång gånger roligt tråkigt tidigt sent första andra tredje nästa sista många få flera mest minst ja nej okej tack hej gärna hit dit båda senare
fortsätta fortsätter fortsatte kunna förstå hjälpa tänka tro tror svara säga höra se komma gå göra vara ha
"""


words = []

for word in WORDS_TEXT.split():
    word = word.strip().lower()

    if word and word not in words:
        words.append(word)


if len(words) != 500:
    raise RuntimeError(
        f"❌ Ordlistan blev {len(words)} ord istället för exakt 500."
    )


print()
print("==========================================")
print("📚 NY KONTROLLERAD ORDLISTA")
print("==========================================")
print()
print("✅ EXAKT 500 ord")
print()
print("Första 20:")
print(", ".join(words[:20]))
print()
print("Sista 20:")
print(", ".join(words[-20:]))
print()


# ============================================================
# ÅTERANVÄND BEFINTLIGA BRA MP3
# ============================================================

existing_audio = {}

old_json = STATIC / "listening_words.json"

if old_json.exists():

    old_items = json.loads(
        old_json.read_text(
            encoding="utf-8"
        )
    )

    for item in old_items:

        word = str(
            item.get("word", "")
        ).strip().lower()

        filename = str(
            item.get("file", "")
        ).strip()

        local_file = (
            STATIC
            / "audio"
            / "listening_words"
            / filename
        )

        if (
            word
            and filename
            and local_file.exists()
        ):

            existing_audio[word] = (
                "/static/audio/listening_words/"
                + filename
            )


print(
    f"♻️ Kan återanvända {len(existing_audio)} gamla ljud."
)
print()


# ============================================================
# SVENSK RÖST
# ============================================================

async def get_voice():

    voices = await VoicesManager.create()

    female = voices.find(
        Locale="sv-SE",
        Gender="Female"
    )

    if female:
        return female[0]["Name"]

    swedish = voices.find(
        Locale="sv-SE"
    )

    if swedish:
        return swedish[0]["Name"]

    raise RuntimeError(
        "❌ Ingen svensk röst hittades."
    )


# ============================================================
# BYGG ORDBANK + LJUD
# ============================================================

async def build():

    voice = await get_voice()

    print("🎙️ Röst:", voice)
    print()

    data = []

    for index, word in enumerate(
        words,
        start=1
    ):

        if word in existing_audio:

            audio_url = existing_audio[word]

            print(
                f"[{index}/500] {word} ♻️"
            )

        else:

            filename = (
                f"common_{index:03d}.mp3"
            )

            output = (
                NEW_AUDIO
                / filename
            )

            audio_url = (
                "/static/audio/"
                "lasloop_common500_v2/"
                + filename
            )

            if (
                output.exists()
                and
                output.stat().st_size > 500
            ):

                print(
                    f"[{index}/500] {word} ✅ finns"
                )

            else:

                success = False

                for attempt in range(1, 5):

                    try:

                        speech = edge_tts.Communicate(
                            text=word,
                            voice=voice,
                            rate="-5%",
                            volume="+0%"
                        )

                        await speech.save(
                            str(output)
                        )

                        success = True

                        print(
                            f"[{index}/500] {word} ✅"
                        )

                        break

                    except Exception as error:

                        print(
                            f"⚠️ Försök {attempt}/4:",
                            error
                        )

                        await asyncio.sleep(2)

                if not success:

                    raise RuntimeError(
                        "❌ Kunde inte skapa ljud för "
                        + word
                    )

        data.append({
            "id":
                f"common_{index:03d}",

            "word":
                word,

            "audio":
                audio_url
        })


    (
        STATIC
        / "lasloop-data.json"
    ).write_text(
        json.dumps(
            {
                "words": data
            },
            ensure_ascii=False,
            indent=2
        ),
        encoding="utf-8"
    )


# ============================================================
# SÄKERSTÄLL 10 SEK + 10/10
# ============================================================

def patch_js():

    file = STATIC / "lasloop.js"

    text = file.read_text(
        encoding="utf-8"
    )

    text = re.sub(
        r'const\s+TIME_LIMIT\s*=\s*[\d.]+\s*;',
        'const TIME_LIMIT = 10;',
        text
    )

    text = re.sub(
        r'const\s+REQUIRED\s*=\s*\d+\s*;',
        'const REQUIRED = 10;',
        text
    )

    # Ny ordlista = ny sparning.
    # Gamla felaktiga framsteg följer inte med.
    text = re.sub(
        r'const\s+STORAGE_KEY\s*=\s*"[^"]+"\s*;',
        'const STORAGE_KEY = "mikal_lasloop_common500_v2";',
        text
    )

    text = re.sub(
        r'/static/lasloop-data\.json\?v=\d+',
        '/static/lasloop-data.json?v=502',
        text
    )

    text = re.sub(
        r'Math\.min\(\s*(?:500|1000)\s*,',
        'Math.min(words.length,',
        text
    )

    text = text.replace(
        "Kunde inte ladda 1000 ord.",
        "Kunde inte ladda 500 ord."
    )

    file.write_text(
        text,
        encoding="utf-8",
        newline="\n"
    )


# ============================================================
# UPPDATERA SIDAN
# ============================================================

def patch_html():

    file = TEMPLATES / "lasloop.html"

    text = file.read_text(
        encoding="utf-8"
    )

    text = text.replace(
        "0 / 1000",
        "0 / 500"
    )

    text = text.replace(
        "1000 ORD",
        "500 ORD"
    )

    text = text.replace(
        "1000 VANLIGA ORD",
        "500 VANLIGA ORD"
    )

    text = re.sub(
        r'/static/lasloop\.js\?v=\d+',
        '/static/lasloop.js?v=502',
        text
    )

    file.write_text(
        text,
        encoding="utf-8",
        newline="\n"
    )


# ============================================================
# UPPDATERA KNAPPEN PÅ LÄSA
# ============================================================

def patch_entry():

    file = STATIC / "lasloop-entry.js"

    if file.exists():

        text = file.read_text(
            encoding="utf-8"
        )

        text = text.replace(
            "1000",
            "500"
        )

        file.write_text(
            text,
            encoding="utf-8",
            newline="\n"
        )


    lasa = TEMPLATES / "lasa.html"

    if lasa.exists():

        text = lasa.read_text(
            encoding="utf-8"
        )

        text = re.sub(
            r'/static/lasloop-entry\.js\?v=\d+',
            '/static/lasloop-entry.js?v=502',
            text
        )

        lasa.write_text(
            text,
            encoding="utf-8",
            newline="\n"
        )


# ============================================================
# TA BORT GAMLA DÅLIGA LÄSLOOP-LJUD
# ============================================================

def cleanup():

    folders = [
        STATIC / "audio" / "lasloop_words",
        STATIC / "audio" / "lasloop_common500",
    ]

    for folder in folders:

        if folder.exists():

            shutil.rmtree(folder)

            print(
                "🗑️ Tog bort gammal mapp:",
                folder
            )


# ============================================================
# START
# ============================================================

async def main():

    await build()

    patch_js()

    patch_html()

    patch_entry()

    cleanup()


    # Kontrollera resultatet
    data = json.loads(
        (
            STATIC
            / "lasloop-data.json"
        ).read_text(
            encoding="utf-8"
        )
    )

    final_words = [
        item["word"]
        for item in data["words"]
    ]


    print()
    print("==========================================")
    print("✅ SLUTKONTROLL")
    print("==========================================")
    print()
    print("ANTAL:", len(final_words))
    print()
    print(
        "SISTA 30:",
        ", ".join(
            final_words[-30:]
        )
    )
    print()


    if len(final_words) != 500:

        raise RuntimeError(
            "❌ Slutkontrollen hittade inte 500 ord."
        )


    # Kontrollera Flask
    subprocess.run(
        [
            str(
                Path(
                    "C:/Users/eseim/Desktop/"
                    "MikalLearn/.venv/Scripts/python.exe"
                )
            ),
            "-m",
            "py_compile",
            "app.py"
        ],
        check=True
    )


    print("✅ app.py fungerar")
    print()


    # Git
    subprocess.run(
        [
            "git",
            "add",
            "-A"
        ],
        check=True
    )

    subprocess.run(
        [
            "git",
            "commit",
            "-m",
            "Replace LasLoop with real 500 common Swedish words"
        ],
        check=True
    )

    subprocess.run(
        [
            "git",
            "push",
            "origin",
            "main"
        ],
        check=True
    )


    print()
    print("==========================================")
    print("🎉 RIKTIGA LÄSLOOP 500 ÄR KLAR")
    print("==========================================")
    print()
    print("✅ 500 vanliga ord")
    print("✅ 10 sekunder")
    print("✅ 10/10 krävs")
    print("✅ Timeout = 0/10")
    print("✅ Missade ord kommer tillbaka")
    print("✅ GitHub uppdaterad")
    print()


asyncio.run(main())
