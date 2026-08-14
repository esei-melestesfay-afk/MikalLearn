from pathlib import Path
import asyncio
import json
import re
import shutil

import edge_tts
from edge_tts import VoicesManager


ROOT = Path(".")
STATIC = ROOT / "static"
TEMPLATES = ROOT / "templates"

NEW_AUDIO = (
    STATIC
    / "audio"
    / "lasloop_common500"
)

NEW_AUDIO.mkdir(
    parents=True,
    exist_ok=True
)


# ============================================================
# 500 HANDPLOCKADE VANLIGA ORD
# ============================================================

POOL = """
man sig sin sitt sina
vara ha göra gå komma se säga ta ge

jag du han hon vi ni
mig dig honom henne oss dem
min mitt mina din ditt dina
hans hennes vår vårt våra er ert era deras

den det de
denna detta dessa
någon något några
ingen inget inga
alla allt varje
samma annan annat andra
själv

en ett

och eller men att som om
för med utan till från av
på i under över mellan genom
mot hos före efter innan

är var
har hade
kan kunde
ska skulle
vill ville
får fick
måste behöver behövde
blir blev
gör gjorde
går gick
kommer kom
ser såg
vet visste
säger sa
tar tog
ger gav
finns fanns

tycker tyckte
tänker tänkte
känner kände
börjar började
slutar slutade
arbetar arbetade
läser läste
skriver skrev
lyssnar lyssnade
pratar pratade
frågar frågade
svarar svarade
hjälper hjälpte
försöker försökte
lär lärde
använder använde
hittar hittade
väntar väntade
bor bodde
heter hette

äter åt
dricker drack
sover sov
vaknar vaknade
sitter satt
står stod
ligger låg
springer sprang
spelar spelade
tränar tränade
köper köpte
säljer sålde
betalar betalade
öppnar öppnade
stänger stängde
tittar tittade
visar visade
berättar berättade
förklarar förklarade
förstår förstod
minns glömmer glömde
väljer valde
lämnar lämnade
hämtar hämtade
ringer ringde
skickar skickade

vem vad var
varför hur
vilken vilket vilka
när då där här

inte också bara
alltid ofta ibland aldrig
kanske nästan verkligen
mycket lite
mer mindre
ganska därför eftersom
ändå direkt tillsammans
snart sedan sen
först sist redan igen
nu

idag igår imorgon
morgon kväll natt
dag vecka månad år
tid minut timme

hem hemma
ute inne
upp ner
in ut
bort kvar
fram bak
vänster höger
nära långt

bra bättre bäst
rätt fel
stor liten
lång kort
ny gammal
lätt svår svårt
viktig viktigt
enkel enkelt
snabb snabbt
långsam långsamt
glad ledsen
trött hungrig törstig
kall varm
snäll arg
rädd trygg
stark svag
fin ful
ren smutsig
full tom
öppen stängd

skola lärare elev klass
lektion rast prov
bok text ord mening
fråga svar uppgift
arbete problem hjälp
exempel resultat

familj vän kompis barn
mamma pappa syster bror
farmor farfar
mormor morfar

mat vatten mjölk bröd
ris pasta kött fisk
frukt äpple banan potatis
kaffe te
frukost lunch middag

hus lägenhet
rum kök toalett
badrum sovrum vardagsrum
bord stol säng
dörr fönster
golv vägg tak

mobil dator telefon
internet tv
bild video musik
spel app

butik affär jobb
pengar pris krona
kort konto kvitto kassa

buss bil cykel tåg
väg gata station hållplats

stad land plats
område centrum
park plan

jacka tröja byxor
skor strumpor mössa
väska

hand arm ben fot
huvud hår
öga ögon
öra öron
mun näsa
tand tänder
mage rygg

röd blå grön gul
svart vit brun grå

måndag tisdag onsdag
torsdag fredag
lördag söndag

januari februari mars
april maj juni
juli augusti september
oktober november december

vår sommar höst vinter
sol regn snö vind väder

svenska engelska språk
läsa skriva lyssna
tala prata stava
betyder betydelse

namn nummer
adress datum ålder

sak saker
person personer människor
idé gång gånger

rolig roligt
tråkig tråkigt

tidig tidigt
sent

första andra tredje
nästa sista

många få flera
mest minst

ja nej okej
tack hej hejdå

gärna hit dit
överallt ingenstans
båda
efteråt senare

börja sluta
fortsätta fortsätter fortsatte
kunna lära förstå hjälpa
"""


# ============================================================
# TA BORT DE MINST VIKTIGA
#
# Poolen ovan är större än 500 så vi kan välja bort sådant
# som inte är lika viktigt för snabb vardagsläsning.
# ============================================================

EXCLUDE = {
    "farmor",
    "farfar",
    "mormor",
    "morfar",

    "kaffe",
    "te",

    "vardagsrum",
    "internet",
    "tv",
    "app",

    "krona",
    "konto",
    "kvitto",
    "kassa",

    "område",
    "centrum",

    "mössa",
    "tänder",

    "brun",
    "grå",

    "rolig",
    "tråkig",
    "tidig",

    "överallt",
    "ingenstans",

    "fisk",
    "potatis",
    "jacka",
    "strumpor",

    # Mindre viktiga dåtidsformer.
    "arbetade",
    "lyssnade",
    "tränade",
    "sålde",
    "betalade",
    "öppnade",
    "stängde",
    "skickade",
    "hämtade",
    "lämnade",
    "berättade",
    "förklarade",
    "frågade",
    "svarade",
}


words = []

for raw in POOL.split():

    word = raw.strip().lower()

    if (
        word
        and
        word not in EXCLUDE
        and
        word not in words
    ):

        words.append(word)


if len(words) != 500:

    raise RuntimeError(
        "Ordbanken måste vara exakt 500 ord. "
        f"Den blev {len(words)}."
    )


print()
print("==========================================")
print("📚 NY ORDBANK")
print("==========================================")
print()
print("✅ Exakt 500 handplockade vanliga ord")
print()
print("Första 25:")
print(", ".join(words[:25]))
print()
print("Sista 25:")
print(", ".join(words[-25:]))
print()


# ============================================================
# ÅTERANVÄND DE BRA ORD-LJUDEN SOM REDAN FINNS
# ============================================================

existing_audio = {}

listening_json = (
    STATIC
    / "listening_words.json"
)

if listening_json.exists():

    try:

        old = json.loads(
            listening_json.read_text(
                encoding="utf-8"
            )
        )

        for item in old:

            word = str(
                item.get(
                    "word",
                    ""
                )
            ).strip().lower()

            filename = str(
                item.get(
                    "file",
                    ""
                )
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

    except Exception as error:

        print(
            "⚠️ Kunde inte återanvända gamla ljud:",
            error
        )


print(
    f"♻️ {len(existing_audio)} gamla ordljud kan återanvändas."
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
        "Ingen svensk röst hittades."
    )


# ============================================================
# SKAPA ENDAST LJUD SOM SAKNAS
# ============================================================

async def build_words():

    voice = await get_voice()

    print(
        "🎙️ Svensk röst:",
        voice
    )

    print()

    data = []


    for index, word in enumerate(
        words,
        start=1
    ):

        if word in existing_audio:

            audio_url = (
                existing_audio[word]
            )

            print(
                f"[{index}/500] {word} "
                "♻️ återanvänder ljud"
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
                "lasloop_common500/"
                + filename
            )


            if (
                output.exists()
                and
                output.stat().st_size > 500
            ):

                print(
                    f"[{index}/500] "
                    f"{word} ✅ finns redan"
                )

            else:

                success = False

                for attempt in range(
                    1,
                    5
                ):

                    try:

                        speech = (
                            edge_tts.Communicate(
                                text=word,
                                voice=voice,
                                rate="-5%",
                                volume="+0%"
                            )
                        )

                        await speech.save(
                            str(output)
                        )

                        success = True

                        print(
                            f"[{index}/500] "
                            f"{word} ✅"
                        )

                        break

                    except Exception as error:

                        print(
                            f"   ⚠️ försök "
                            f"{attempt}/4:",
                            error
                        )

                        await asyncio.sleep(2)


                if not success:

                    raise RuntimeError(
                        "Kunde inte skapa ljud för: "
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
                "words":
                    data
            },
            ensure_ascii=False,
            indent=2
        ),
        encoding="utf-8"
    )


# ============================================================
# UPPDATERA LÄSLOOP-SIDAN
# ============================================================

def update_html():

    file = (
        TEMPLATES
        / "lasloop.html"
    )

    if not file.exists():

        raise RuntimeError(
            "templates/lasloop.html saknas."
        )


    text = file.read_text(
        encoding="utf-8"
    )


    # Gamla 1000-versionen
    text = text.replace(
        "1000",
        "500"
    )


    # Tvinga ny JS så webbläsaren inte visar cache.
    text = re.sub(
        r'/static/lasloop\.js\?v=\d+',
        '/static/lasloop.js?v=500',
        text
    )


    file.write_text(
        text,
        encoding="utf-8",
        newline="\n"
    )


# ============================================================
# UPPDATERA LÄSLOOP-MOTORN
# ============================================================

def update_js():

    file = (
        STATIC
        / "lasloop.js"
    )

    if not file.exists():

        raise RuntimeError(
            "static/lasloop.js saknas."
        )


    text = file.read_text(
        encoding="utf-8"
    )


    # Exakt 10 sekunder.
    text = re.sub(
        r'const\s+TIME_LIMIT\s*=\s*[\d.]+\s*;',
        'const TIME_LIMIT = 10;',
        text
    )


    # Exakt 10 rätt.
    text = re.sub(
        r'const\s+REQUIRED\s*=\s*\d+\s*;',
        'const REQUIRED = 10;',
        text
    )


    # Ny lagring eftersom ordbanken är helt ny.
    text = re.sub(
        r'const\s+STORAGE_KEY\s*=\s*"[^"]+"\s*;',
        (
            'const STORAGE_KEY = '
            '"mikal_lasloop_common500_v1";'
        ),
        text
    )


    # Begränsa ord-fönstret till hur många ord
    # som faktiskt finns.
    text = re.sub(
        r'Math\.min\(\s*(?:500|1000)\s*,',
        'Math.min(words.length,',
        text
    )


    # Ny data-version för att undvika cache.
    text = re.sub(
        r'/static/lasloop-data\.json\?v=\d+',
        '/static/lasloop-data.json?v=500',
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
# UPPDATERA KNAPPEN PÅ LÄSA
# ============================================================

def update_entry():

    entry = (
        STATIC
        / "lasloop-entry.js"
    )


    if entry.exists():

        text = entry.read_text(
            encoding="utf-8"
        )

        text = text.replace(
            "1000",
            "500"
        )

        entry.write_text(
            text,
            encoding="utf-8",
            newline="\n"
        )


    lasa = (
        TEMPLATES
        / "lasa.html"
    )


    if lasa.exists():

        text = lasa.read_text(
            encoding="utf-8"
        )

        text = re.sub(
            r'/static/lasloop-entry\.js\?v=\d+',
            '/static/lasloop-entry.js?v=500',
            text
        )

        lasa.write_text(
            text,
            encoding="utf-8",
            newline="\n"
        )


# ============================================================
# SÄKERSTÄLL ROUTE
# ============================================================

def ensure_route():

    app_file = (
        ROOT
        / "app.py"
    )

    text = app_file.read_text(
        encoding="utf-8"
    )


    if (
        '@app.route("/lasloop")'
        not in text
    ):

        route = '''

# ============================================================
# LÄSLOOP
# ============================================================

@app.route("/lasloop")
def lasloop():
    return render_template("lasloop.html")

'''


        marker = (
            'if __name__ == "__main__":'
        )


        if marker in text:

            text = text.replace(
                marker,
                route
                + "\n"
                + marker,
                1
            )

        else:

            text += (
                "\n"
                + route
            )


        app_file.write_text(
            text,
            encoding="utf-8",
            newline="\n"
        )


# ============================================================
# RADERA GAMLA DÅLIGA LÄSLOOP-LJUD
# ============================================================

def clean_old_audio():

    old_folders = [
        STATIC
        / "audio"
        / "lasloop_words",

        STATIC
        / "audio"
        / "lasloop",
    ]


    for folder in old_folders:

        if folder.exists():

            shutil.rmtree(
                folder
            )

            print(
                "🗑️ Tog bort gamla ljud:",
                folder
            )


# ============================================================
# START
# ============================================================

async def main():

    await build_words()

    update_html()

    update_js()

    update_entry()

    ensure_route()

    clean_old_audio()


    print()
    print(
        "=========================================="
    )

    print(
        "🎉 NYA LÄSLOOP 500 ÄR KLAR"
    )

    print(
        "=========================================="
    )

    print()

    print(
        "✅ Exakt 500 vanliga vardagsord"
    )

    print(
        "✅ Inga ord som principiell / hypotes / globalisering"
    )

    print(
        "✅ 10 sekunder per ord"
    )

    print(
        "✅ 10 separata lyckade läsningar krävs"
    )

    print(
        "✅ Missad tid = tillbaka till 0/10"
    )

    print(
        "✅ Missade ord kommer tillbaka"
    )

    print(
        "✅ Svenskt ljud när tiden tar slut"
    )

    print(
        "✅ Gamla onödiga LäsLoop-ljud borttagna"
    )

    print()


asyncio.run(
    main()
)
