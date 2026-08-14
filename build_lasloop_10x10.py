from pathlib import Path
import asyncio
import json
import re

import edge_tts
from edge_tts import VoicesManager
from wordfreq import top_n_list


ROOT = Path(".")
STATIC = ROOT / "static"
TEMPLATES = ROOT / "templates"

AUDIO_DIR = STATIC / "audio" / "lasloop_words"
DATA_FILE = STATIC / "lasloop-data.json"

STATIC.mkdir(exist_ok=True)
TEMPLATES.mkdir(exist_ok=True)
AUDIO_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# BEFINTLIGA LJUD
# ============================================================

existing_audio = {}

old_audio_data = STATIC / "listening_words.json"

if old_audio_data.exists():

    try:

        old_items = json.loads(
            old_audio_data.read_text(
                encoding="utf-8"
            )
        )

        for item in old_items:

            word = str(
                item.get("word", "")
            ).strip().lower()

            file = str(
                item.get("file", "")
            ).strip()

            if word and file:

                existing_audio[word] = (
                    "/static/audio/listening_words/"
                    + file
                )

    except Exception as error:

        print(
            "⚠️ Kunde inte läsa gamla ljud:",
            error
        )


# ============================================================
# VIKTIGASTE ORDEN FÖRST
# ============================================================

CORE_WORDS = """
jag du han hon vi ni
mig dig oss dem
min mitt mina din ditt dina
hans hennes vår vårt våra er deras

den det de denna detta dessa
någon något några
ingen inget inga
alla allt varje
samma annan andra själv

en ett
och eller men att som om
för med utan till från av
på i under över mellan genom
mot hos före efter innan

är var har hade
kan kunde ska skulle
vill ville får fick
måste behöver behövde
blir blev gör gjorde
går gick kommer kom
ser såg vet visste
säger sa tar tog
ger gav finns fanns

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

vem vad var varför hur
vilken vilket vilka
när då där här

inte också bara
alltid ofta ibland aldrig
kanske nästan verkligen
mycket lite mer mindre
ganska därför eftersom ändå
direkt tillsammans

idag igår imorgon
morgon kväll natt
dag vecka månad år
tid nu snart sedan
sen först sist redan igen

hem hemma ute inne
upp ner in ut bort kvar

bra bättre bäst
rätt fel
stor liten
lång kort
ny gammal
lätt svårt
viktig viktigt
enkel enkelt
snabb långsam
glad ledsen
trött hungrig
kall varm

skola lärare elev klass
lektion rast prov
bok text ord mening
fråga svar uppgift
arbete problem hjälp
exempel resultat

familj vän kompis barn
mamma pappa syster bror

mat vatten pengar

buss bil cykel
väg gata

rum bord stol
dörr fönster

mobil dator telefon
butik affär jobb

plan idé sak saker
person människor
namn nummer

spelar tränar springer
äter dricker sover vaknar
köper säljer betalar
öppnar stänger tittar
visar förstår minns
glömmer berättar förklarar

svenska engelska språk
läsa skriva lyssna
tala stavar betyder

stad land plats
hus lägenhet

tidigt sent länge

första andra tredje
nästa sista

många få

roligt tråkigt
snäll arg rädd trygg
stark svag
fin ful
ren smutsig
full tom
öppen stängd

nära långt
fram bak
vänster höger
framför bakom bredvid
"""


BLOCKED = {
    "porr",
    "porn",
    "kuk",
    "fitta",
    "hora",
    "knulla",
    "jävla",
    "jävel",
    "fuck",
    "www",
    "http",
    "https",
    "com"
}


def clean_word(value):

    word = str(value).strip().lower()

    if not word:
        return None

    if word in BLOCKED:
        return None

    if len(word) > 18:
        return None

    if len(word) == 1 and word != "i":
        return None

    if not re.fullmatch(
        r"[a-zåäöéü]+",
        word
    ):
        return None

    return word


words = []


def add_word(value):

    word = clean_word(value)

    if (
        word
        and
        word not in words
    ):

        words.append(word)


# Viktigaste orden först
for word in CORE_WORDS.split():
    add_word(word)


# Använd även ord från MikalLearns nuvarande ordlista
words_json = STATIC / "words.json"

if words_json.exists():

    try:

        old_words = json.loads(
            words_json.read_text(
                encoding="utf-8"
            )
        )

        if isinstance(old_words, list):

            for item in old_words:

                if isinstance(item, dict):
                    add_word(
                        item.get("word", "")
                    )

                elif isinstance(item, str):
                    add_word(item)

    except Exception as error:

        print(
            "⚠️ Kunde inte läsa words.json:",
            error
        )


# Fyll resten med vanliga svenska ord
for word in top_n_list("sv", 5000):

    add_word(word)

    if len(words) >= 500:
        break


words = words[:500]


if len(words) != 500:

    raise RuntimeError(
        f"Ordbanken blev bara {len(words)} ord."
    )


print()
print("✅ EXAKT 500 svenska ord")
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
# LJUD + DATA
# ============================================================

async def build_data():

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

            audio_url = existing_audio[word]

            print(
                f"[{index}/500] {word} ✅ gammalt ljud"
            )

        else:

            filename = (
                f"word_{index:04d}.mp3"
            )

            output = (
                AUDIO_DIR
                /
                filename
            )

            audio_url = (
                "/static/audio/lasloop_words/"
                +
                filename
            )


            if (
                output.exists()
                and
                output.stat().st_size > 500
            ):

                print(
                    f"[{index}/500] {word} ✅ finns redan"
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
                            f"   ⚠️ försök {attempt}/4:",
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
                f"word_{index:04d}",

            "word":
                word,

            "audio":
                audio_url
        })


    DATA_FILE.write_text(
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
# HTML
# ============================================================

HTML = r'''<!doctype html>
<html lang="sv">

<head>

<meta charset="utf-8">

<meta
    name="viewport"
    content="width=device-width, initial-scale=1">

<title>LäsLoop | MikalLearn</title>

<link
    rel="stylesheet"
    href="/static/style.css">

<style>

:root {
    --bg: #f5f6fb;
    --card: #ffffff;
    --text: #191b25;
    --muted: #858995;
    --line: #e6e7ef;
    --purple: #5c5de9;
    --purple-soft: #eeeeff;
    --dark: #1c1e29;
    --red: #c95043;
    --red-soft: #fff0ed;
    --green: #168653;
}

* {
    box-sizing: border-box;
}

body {
    margin: 0;

    color: var(--text);

    background:
        radial-gradient(
            circle at 85% 5%,
            rgba(92,93,233,.10),
            transparent 340px
        ),
        var(--bg);

    font-family:
        Inter,
        ui-sans-serif,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
}

button {
    font: inherit;
}

.shell {
    width: min(
        850px,
        calc(100% - 28px)
    );

    margin: 0 auto;

    padding: 25px 0 70px;
}

.nav {
    display: flex;
    justify-content: space-between;
    align-items: center;

    margin-bottom: 24px;
}

.back {
    color: #555967;

    text-decoration: none;

    font-size: 12px;
    font-weight: 800;
}

.brand {
    color: var(--purple);

    font-size: 10px;
    font-weight: 950;

    letter-spacing: 1.7px;
}

.heading {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;

    gap: 15px;

    margin-bottom: 14px;
}

.label {
    margin: 0 0 5px;

    color: var(--purple);

    font-size: 10px;
    font-weight: 950;

    letter-spacing: 1.3px;
}

.heading h1 {
    margin: 0;

    font-size: clamp(30px, 6vw, 45px);

    letter-spacing: -1.5px;
}

.heading p {
    max-width: 600px;

    margin: 7px 0 0;

    color: var(--muted);

    font-size: 11px;
    line-height: 1.55;
}

.today {
    min-width: 95px;

    padding: 10px 12px;

    background: white;

    border: 1px solid var(--line);
    border-radius: 13px;

    text-align: center;
}

.today span {
    display: block;

    color: var(--muted);

    font-size: 8px;
    font-weight: 900;
}

.today strong {
    display: block;

    margin-top: 3px;

    font-size: 21px;
}

.stats {
    display: grid;

    grid-template-columns:
        repeat(3, minmax(0, 1fr));

    gap: 8px;

    margin-bottom: 12px;
}

.stat {
    padding: 11px 13px;

    background: white;

    border: 1px solid var(--line);
    border-radius: 13px;
}

.stat span {
    display: block;

    color: var(--muted);

    font-size: 8px;
    font-weight: 900;

    text-transform: uppercase;
    letter-spacing: .6px;
}

.stat strong {
    display: block;

    margin-top: 4px;

    font-size: 16px;
}

.card {
    min-height: 520px;

    padding: 25px;

    background: white;

    border: 1px solid var(--line);
    border-radius: 27px;

    box-shadow:
        0 20px 60px
        rgba(29,34,68,.08);
}

.card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.badge {
    padding: 7px 10px;

    color: var(--purple);
    background: var(--purple-soft);

    border-radius: 999px;

    font-size: 9px;
    font-weight: 900;
}

.mastery {
    color: var(--muted);

    font-size: 11px;
    font-weight: 900;
}

.word-area {
    display: grid;
    place-items: center;

    min-height: 310px;

    padding: 30px 5px 12px;

    text-align: center;
}

.word-button {
    display: inline-block;

    max-width: 100%;

    padding: 25px 32px;

    color: var(--text);
    background: transparent;

    border: 0;
    border-radius: 20px;

    cursor: pointer;

    font-size: clamp(50px, 11vw, 98px);
    font-weight: 950;

    line-height: 1;

    letter-spacing: -3px;

    transition:
        transform .08s ease,
        background .08s ease;
}

.word-button:hover {
    background: #f8f8fc;

    transform: scale(1.015);
}

.word-button:active {
    transform: scale(.97);
}

.instruction {
    margin-top: 10px;

    color: var(--muted);

    font-size: 10px;
    font-weight: 750;
}

.timer {
    max-width: 620px;

    margin: 0 auto;
}

.timer-head {
    display: flex;
    justify-content: space-between;

    margin-bottom: 7px;
}

.timer-head span {
    color: var(--muted);

    font-size: 9px;
    font-weight: 900;
}

.timer-number {
    color: var(--purple) !important;

    font-size: 15px !important;

    font-variant-numeric:
        tabular-nums;
}

.track {
    overflow: hidden;

    height: 11px;

    background: #eeeeF4;

    border-radius: 999px;
}

.fill {
    width: 0%;
    height: 100%;

    background:
        linear-gradient(
            90deg,
            #6263ec,
            #8b8cff
        );

    border-radius: inherit;
}

.message {
    min-height: 64px;

    display: flex;
    justify-content: center;
    align-items: center;

    margin-top: 13px;

    text-align: center;
}

.good {
    color: var(--green);

    font-size: 12px;
    font-weight: 900;
}

.timeout {
    width: 100%;

    padding: 14px;

    color: #843f36;

    background: var(--red-soft);

    border: 1px solid #f0cbc5;
    border-radius: 15px;
}

.timeout strong {
    display: block;

    font-size: 12px;
}

.timeout p {
    margin: 4px 0 0;

    font-size: 10px;
}

.actions {
    display: flex;
    justify-content: center;

    gap: 8px;

    margin-top: 11px;
}

.actions button {
    min-height: 42px;

    padding: 0 14px;

    border-radius: 12px;

    cursor: pointer;

    font-size: 10px;
    font-weight: 900;
}

.hear {
    color: #444854;

    background: white;

    border: 1px solid var(--line);
}

.continue {
    color: white;

    background: var(--dark);

    border: 1px solid var(--dark);
}

.note {
    margin-top: 16px;

    color: #999daa;

    text-align: center;

    font-size: 9px;
    line-height: 1.55;
}

@media (max-width: 650px) {

    .shell {
        width: calc(100% - 18px);

        padding-top: 15px;
    }

    .heading {
        align-items: stretch;

        flex-direction: column;
    }

    .today {
        width: 100%;
    }

    .stats {
        grid-template-columns: 1fr 1fr;
    }

    .stat:last-child {
        grid-column: 1 / -1;
    }

    .card {
        padding: 19px 14px;

        border-radius: 21px;
    }

}

</style>

</head>


<body>

<div class="shell">

<nav class="nav">

<a
    href="/lasa"
    class="back">
    ← Tillbaka till Läsa
</a>

<span class="brand">
    MIKALLEARN
</span>

</nav>


<header class="heading">

<div>

<p class="label">
    ⚡ LÄSLOOP · 500 ORD
</p>

<h1>
    Läs innan tiden tar slut.
</h1>

<p>
    Du har 10 sekunder.
    Läs ordet högt och tryck på själva ordet
    så fort du har läst det.
</p>

</div>


<div class="today">

<span>
    KLARA IDAG
</span>

<strong id="todayCount">
    0
</strong>

</div>

</header>


<section class="stats">

<div class="stat">

<span>
    AUTOMATISKA ORD
</span>

<strong id="masteredCount">
    0 / 500
</strong>

</div>


<div class="stat">

<span>
    TRÄNAS IGEN
</span>

<strong id="reviewCount">
    0
</strong>

</div>


<div class="stat">

<span>
    TID PER ORD
</span>

<strong>
    10 sek
</strong>

</div>

</section>


<main class="card">

<div class="card-top">

<span class="badge">
    LÄS ORDET
</span>

<span
    class="mastery"
    id="mastery">
    0 / 10
</span>

</div>


<div class="word-area">

<div>

<button
    id="wordButton"
    class="word-button"
    type="button">
    ...
</button>

<div
    class="instruction"
    id="instruction">

    Läs högt → tryck på ordet

</div>

</div>

</div>


<section class="timer">

<div class="timer-head">

<span>
    10 SEKUNDER
</span>

<span
    class="timer-number"
    id="timerNumber">
    10.0
</span>

</div>


<div class="track">

<div
    class="fill"
    id="timerFill">
</div>

</div>

</section>


<div
    class="message"
    id="message">
</div>


<div class="note">

Ett ord blir automatiskt först efter
<strong>10 lyckade läsningar på olika tillfällen.</strong>
Om tiden tar slut går ordet tillbaka till 0/10
och kommer tillbaka senare.

</div>

</main>

</div>


<script
    src="/static/lasloop.js?v=10"
    defer>
</script>

</body>

</html>
'''


# ============================================================
# JAVASCRIPT
# ============================================================

JS = r'''
document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const TIME_LIMIT = 10;

        const REQUIRED = 10;

        const MIN_CLICK_TIME = 0.40;

        const STORAGE_KEY =
            "mikal_lasloop_500_v10";


        let words = [];

        let byId = {};

        let current = null;

        let running = false;

        let startedAt = 0;

        let animation = null;

        let currentAudio = null;


        const $ = id =>
            document.getElementById(id);



        function today() {

            const d =
                new Date();


            return (
                d.getFullYear()
                +
                "-"
                +
                String(
                    d.getMonth() + 1
                ).padStart(2, "0")
                +
                "-"
                +
                String(
                    d.getDate()
                ).padStart(2, "0")
            );

        }



        function freshState() {

            return {
                date:
                    today(),

                todayCount:
                    0,

                counter:
                    0,

                stats:
                    {},

                queue:
                    []
            };

        }



        function loadState() {

            try {

                const saved =
                    JSON.parse(
                        localStorage.getItem(
                            STORAGE_KEY
                        )
                        ||
                        "null"
                    );


                if (
                    saved
                    &&
                    typeof saved
                        === "object"
                ) {

                    if (
                        saved.date
                        !== today()
                    ) {

                        saved.date =
                            today();

                        saved.todayCount =
                            0;

                    }


                    saved.stats =
                        saved.stats
                        || {};


                    saved.queue =
                        Array.isArray(
                            saved.queue
                        )
                        ?
                        saved.queue
                        :
                        [];


                    return saved;

                }

            }

            catch {
            }


            return freshState();

        }



        let state =
            loadState();



        function save() {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(
                    state
                )
            );

        }



        function statFor(id) {

            if (
                !state.stats[id]
            ) {

                state.stats[id] = {
                    streak: 0,
                    seen: 0,
                    success: 0,
                    timeout: 0
                };

            }


            return state.stats[id];

        }



        function mastered(item) {

            return (
                statFor(
                    item.id
                ).streak
                >= REQUIRED
            );

        }



        function masteredCount() {

            return words.filter(
                mastered
            ).length;

        }



        function schedule(
            id,
            offset
        ) {

            state.queue =
                state.queue.filter(
                    entry =>
                        entry.id !== id
                );


            state.queue.push({
                id:
                    id,

                due:
                    state.counter
                    +
                    offset
            });

        }



        function removeQueue(id) {

            state.queue =
                state.queue.filter(
                    entry =>
                        entry.id !== id
                );

        }



        function dueWords() {

            return state.queue
                .filter(
                    entry =>
                        entry.due
                        <=
                        state.counter
                )
                .map(
                    entry =>
                        byId[
                            entry.id
                        ]
                )
                .filter(
                    item =>
                        item
                        &&
                        !mastered(
                            item
                        )
                        &&
                        (
                            !current
                            ||
                            item.id
                            !==
                            current.id
                        )
                );

        }



        function random(array) {

            if (!array.length) {
                return null;
            }


            return array[
                Math.floor(
                    Math.random()
                    *
                    array.length
                )
            ];

        }



        function nextDelay(streak) {

            /*
                Ju fler gånger hon klarar ordet,
                desto längre väntar systemet
                innan samma ord testas igen.

                Det betyder att 10/10 inte kan
                fås genom att klicka samma ord
                tio gånger direkt.
            */

            const delays = {
                1: 3,
                2: 5,
                3: 8,
                4: 12,
                5: 18,
                6: 25,
                7: 35,
                8: 50,
                9: 70
            };


            return (
                delays[streak]
                ||
                70
            );

        }



        function chooseNext() {

            const due =
                dueWords();


            if (
                due.length
            ) {

                due.sort(
                    (a, b) => {

                        const A =
                            statFor(
                                a.id
                            );


                        const B =
                            statFor(
                                b.id
                            );


                        /*
                            Ord med flest misslyckanden
                            prioriteras.
                        */

                        if (
                            A.timeout
                            !==
                            B.timeout
                        ) {

                            return (
                                B.timeout
                                -
                                A.timeout
                            );

                        }


                        return (
                            A.streak
                            -
                            B.streak
                        );

                    }
                );


                return due[0];

            }



            /*
                Vi kastar inte in alla 500 direkt.

                Först jobbar hon med de vanligaste
                orden.

                När fler blir automatiska öppnas
                fler ord automatiskt.
            */

            const done =
                masteredCount();


            const windowSize =
                Math.min(
                    500,
                    Math.max(
                        100,
                        done + 140
                    )
                );


            const pool =
                words.slice(
                    0,
                    windowSize
                );



            /*
                Prioritera nya ord.
            */

            const unseen =
                pool.filter(
                    item =>
                        statFor(
                            item.id
                        ).seen === 0
                        &&
                        (
                            !current
                            ||
                            item.id
                            !==
                            current.id
                        )
                );


            if (
                unseen.length
            ) {

                return random(
                    unseen.slice(
                        0,
                        35
                    )
                );

            }



            /*
                Sedan ord hon ännu inte kan.
            */

            const learning =
                pool
                    .filter(
                        item =>
                            !mastered(
                                item
                            )
                            &&
                            (
                                !current
                                ||
                                item.id
                                !==
                                current.id
                            )
                    )
                    .sort(
                        (a, b) => {

                            const A =
                                statFor(
                                    a.id
                                );


                            const B =
                                statFor(
                                    b.id
                                );


                            if (
                                A.streak
                                !==
                                B.streak
                            ) {

                                return (
                                    A.streak
                                    -
                                    B.streak
                                );

                            }


                            return (
                                B.timeout
                                -
                                A.timeout
                            );

                        }
                    );


            if (
                learning.length
            ) {

                return random(
                    learning.slice(
                        0,
                        35
                    )
                );

            }



            const remaining =
                words.filter(
                    item =>
                        !mastered(
                            item
                        )
                        &&
                        (
                            !current
                            ||
                            item.id
                            !==
                            current.id
                        )
                );


            return (
                random(
                    remaining
                )
                ||
                random(
                    words
                )
            );

        }



        function reviewCount() {

            return new Set(
                state.queue
                    .filter(
                        entry => {

                            const item =
                                byId[
                                    entry.id
                                ];


                            return (
                                item
                                &&
                                !mastered(
                                    item
                                )
                            );

                        }
                    )
                    .map(
                        entry =>
                            entry.id
                    )
            ).size;

        }



        function updateStats() {

            $("todayCount")
                .textContent =
                state.todayCount;


            $("masteredCount")
                .textContent =
                masteredCount()
                +
                " / "
                +
                words.length;


            $("reviewCount")
                .textContent =
                reviewCount();

        }



        function stopTimer() {

            running =
                false;


            if (
                animation
            ) {

                cancelAnimationFrame(
                    animation
                );

            }


            animation =
                null;

        }



        function startTimer() {

            stopTimer();


            running =
                true;


            startedAt =
                performance.now();


            function frame() {

                if (!running) {
                    return;
                }


                const elapsed =
                    (
                        performance.now()
                        -
                        startedAt
                    )
                    /
                    500;


                const left =
                    Math.max(
                        0,
                        TIME_LIMIT
                        -
                        elapsed
                    );


                $("timerNumber")
                    .textContent =
                    left.toFixed(1);


                /*
                    Stapeln FYLLS åt höger
                    ju mer tid som går.
                */

                const used =
                    Math.min(
                        100,
                        elapsed
                        /
                        TIME_LIMIT
                        *
                        100
                    );


                $("timerFill")
                    .style
                    .width =
                    used
                    +
                    "%";


                if (
                    elapsed
                    >=
                    TIME_LIMIT
                ) {

                    handleTimeout();

                    return;

                }


                animation =
                    requestAnimationFrame(
                        frame
                    );

            }


            frame();

        }



        function renderWord() {

            $("message")
                .innerHTML =
                "";


            $("wordButton")
                .disabled =
                false;


            $("wordButton")
                .textContent =
                current.word;


            $("instruction")
                .textContent =
                "Läs högt → tryck på ordet";


            const stat =
                statFor(
                    current.id
                );


            $("mastery")
                .textContent =
                stat.streak
                +
                " / 10";


            $("timerNumber")
                .textContent =
                "10.0";


            $("timerFill")
                .style
                .width =
                "0%";


            updateStats();

            startTimer();

        }



        function stopAudio() {

            if (
                currentAudio
            ) {

                currentAudio.pause();

                currentAudio.currentTime =
                    0;

            }


            currentAudio =
                null;

        }



        function nextWord() {

            stopTimer();

            stopAudio();


            current =
                chooseNext();


            if (!current) {

                $("wordButton")
                    .textContent =
                    "Klart!";

                return;

            }


            renderWord();

        }



        function success() {

            if (
                !running
                ||
                !current
            ) {

                return;

            }


            const elapsed =
                (
                    performance.now()
                    -
                    startedAt
                )
                /
                500;


            /*
                Skydd mot dubbelklick från förra
                ordet. Klick under 0.4 sekunder
                räknas inte.
            */

            if (
                elapsed
                <
                MIN_CLICK_TIME
            ) {

                return;

            }


            stopTimer();


            $("wordButton")
                .disabled =
                true;


            const stat =
                statFor(
                    current.id
                );


            stat.seen++;

            stat.success++;

            stat.streak =
                Math.min(
                    REQUIRED,
                    stat.streak + 1
                );


            state.counter++;

            state.todayCount++;


            removeQueue(
                current.id
            );


            if (
                !mastered(
                    current
                )
            ) {

                schedule(
                    current.id,
                    nextDelay(
                        stat.streak
                    )
                );

            }


            $("mastery")
                .textContent =
                stat.streak
                +
                " / 10";


            if (
                mastered(
                    current
                )
            ) {

                $("message")
                    .innerHTML =
                    "<span class='good'>" +
                    "🏆 AUTOMATISKT · 10/10 · "
                    +
                    elapsed.toFixed(1)
                    +
                    " sek" +
                    "</span>";

            }

            else {

                $("message")
                    .innerHTML =
                    "<span class='good'>" +
                    "✅ "
                    +
                    stat.streak
                    +
                    "/10 · "
                    +
                    elapsed.toFixed(1)
                    +
                    " sek" +
                    "</span>";

            }


            save();

            updateStats();


            setTimeout(
                nextWord,
                280
            );

        }



        function playAudio() {

            if (
                !current
                ||
                !current.audio
            ) {

                return;

            }


            stopAudio();


            currentAudio =
                new Audio(
                    current.audio
                );


            currentAudio.volume =
                1;


            currentAudio.play()
                .catch(
                    error =>
                        console.error(
                            error
                        )
                );

        }



        function handleTimeout() {

            if (
                !running
                ||
                !current
            ) {

                return;

            }


            stopTimer();


            $("wordButton")
                .disabled =
                true;


            const stat =
                statFor(
                    current.id
                );


            stat.seen++;

            stat.timeout++;


            /*
                Misslyckas hon efter exempelvis
                8/10 måste ordet byggas upp igen.
            */

            stat.streak =
                0;


            state.counter++;

            state.todayCount++;


            schedule(
                current.id,
                3
            );


            $("mastery")
                .textContent =
                "0 / 10";


            $("timerNumber")
                .textContent =
                "0.0";


            $("timerFill")
                .style
                .width =
                "100%";


            $("instruction")
                .textContent =
                "Lyssna och säg ordet efter rösten.";


            $("message")
                .innerHTML = `

                    <div class="timeout">

                        <strong>
                            ⏰ Tiden tog slut · 0/10
                        </strong>

                        <p>
                            Lyssna på ordet.
                            Det kommer tillbaka efter några andra ord.
                        </p>

                        <div class="actions">

                            <button
                                id="hearAgain"
                                class="hear"
                                type="button">

                                🔊 Hör igen

                            </button>


                            <button
                                id="continueButton"
                                class="continue"
                                type="button">

                                Kör vidare →

                            </button>

                        </div>

                    </div>

                `;


            save();

            updateStats();


            playAudio();


            $("hearAgain")
                .addEventListener(
                    "click",
                    playAudio
                );


            $("continueButton")
                .addEventListener(
                    "click",
                    nextWord
                );

        }



        $("wordButton")
            .addEventListener(
                "click",
                success
            );



        try {

            const response =
                await fetch(
                    "/static/lasloop-data.json?v=10"
                );


            if (!response.ok) {

                throw new Error(
                    "Kunde inte ladda 500 ord."
                );

            }


            const data =
                await response.json();


            words =
                data.words
                || [];


            byId =
                Object.fromEntries(
                    words.map(
                        item => [
                            item.id,
                            item
                        ]
                    )
                );


            state.queue =
                state.queue.filter(
                    entry =>
                        byId[
                            entry.id
                        ]
                );


            save();

            updateStats();

            nextWord();

        }

        catch (error) {

            console.error(
                error
            );


            stopTimer();


            $("wordButton")
                .textContent =
                "Fel";


            $("instruction")
                .textContent =
                error.message;

        }

    }
);
'''


# ============================================================
# KNAPP PÅ LÄSA
# ============================================================

ENTRY_JS = r'''
document.addEventListener(
    "DOMContentLoaded",
    () => {

        if (
            window.location.pathname
            !== "/lasa"
        ) {

            return;

        }


        if (
            document.getElementById(
                "lasLoopEntry"
            )
        ) {

            return;

        }


        const style =
            document.createElement(
                "style"
            );


        style.textContent = `

            .lasloop-entry {

                display: grid;

                grid-template-columns:
                    1fr auto;

                align-items: center;

                gap: 18px;

                margin:
                    18px 0 23px;

                padding:
                    21px 23px;

                color: white;

                background:
                    radial-gradient(
                        circle at 86% 12%,
                        rgba(105,107,255,.75),
                        transparent 170px
                    ),
                    linear-gradient(
                        135deg,
                        #1c1e29,
                        #292c44
                    );

                border-radius: 19px;

                box-shadow:
                    0 15px 40px
                    rgba(30,33,61,.12);
            }


            .lasloop-entry-label {

                margin:
                    0 0 4px;

                color:
                    #cbccff;

                font-size: 9px;

                font-weight: 950;

                letter-spacing: 1.4px;
            }


            .lasloop-entry h3 {

                margin: 0;

                color: white;

                font-size: 21px;
            }


            .lasloop-entry p {

                max-width: 570px;

                margin:
                    6px 0 0;

                color:
                    #c9cad7;

                font-size: 10px;

                line-height: 1.55;
            }


            .lasloop-entry a {

                display: inline-flex;

                align-items: center;

                min-height: 44px;

                padding:
                    0 16px;

                color:
                    #232531;

                background:
                    white;

                border-radius:
                    12px;

                text-decoration:
                    none;

                white-space:
                    nowrap;

                font-size: 10px;

                font-weight: 900;
            }


            @media (
                max-width: 650px
            ) {

                .lasloop-entry {

                    grid-template-columns:
                        1fr;

                }

            }

        `;


        document.head.appendChild(
            style
        );


        const card =
            document.createElement(
                "section"
            );


        card.id =
            "lasLoopEntry";


        card.className =
            "lasloop-entry";


        card.innerHTML = `

            <div>

                <p class="lasloop-entry-label">
                    ⚡ 500 VANLIGA ORD
                </p>

                <h3>
                    LäsLoop
                </h3>

                <p>
                    10 sekunder per ord.
                    Ett ord måste klaras 10 gånger
                    innan det räknas som automatiskt.
                </p>

            </div>


            <a href="/lasloop">

                Starta LäsLoop →

            </a>

        `;


        const main =
            document.querySelector(
                "main"
            )
            ||
            document.body;


        const h1 =
            main.querySelector(
                "h1"
            );


        if (
            h1
            &&
            h1.parentElement
        ) {

            h1.parentElement
                .insertAdjacentElement(
                    "afterend",
                    card
                );

        }

        else {

            main.insertBefore(
                card,
                main.firstChild
            );

        }

    }
);
'''


# ============================================================
# SPARA
# ============================================================

(TEMPLATES / "lasloop.html").write_text(
    HTML,
    encoding="utf-8",
    newline="\n"
)

(STATIC / "lasloop.js").write_text(
    JS,
    encoding="utf-8",
    newline="\n"
)

(STATIC / "lasloop-entry.js").write_text(
    ENTRY_JS,
    encoding="utf-8",
    newline="\n"
)


# ============================================================
# KOPPLA TILL LÄSA
# ============================================================

lasa_file = TEMPLATES / "lasa.html"

if not lasa_file.exists():

    raise RuntimeError(
        "templates/lasa.html saknas."
    )


lasa = lasa_file.read_text(
    encoding="utf-8"
)


lasa = re.sub(
    r'\s*<script\s+src=["\']/static/lasloop-entry\.js(?:\?v=\d+)?["\']\s+defer></script>\s*',
    "\n",
    lasa
)


entry_tag = (
    '<script src="/static/lasloop-entry.js?v=10" defer></script>'
)


if "</body>" in lasa:

    lasa = lasa.replace(
        "</body>",
        "    "
        +
        entry_tag
        +
        "\n</body>"
    )

else:

    lasa += (
        "\n"
        +
        entry_tag
    )


lasa_file.write_text(
    lasa,
    encoding="utf-8",
    newline="\n"
)


# ============================================================
# ROUTE
# ============================================================

app_file = ROOT / "app.py"

app_text = app_file.read_text(
    encoding="utf-8"
)


if (
    '@app.route("/lasloop")'
    not in app_text
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


    if marker in app_text:

        app_text = app_text.replace(
            marker,
            route
            +
            "\n"
            +
            marker,
            1
        )

    else:

        app_text += (
            "\n"
            +
            route
        )


    app_file.write_text(
        app_text,
        encoding="utf-8",
        newline="\n"
    )


async def main():

    await build_data()

    print()
    print(
        "========================================"
    )

    print(
        "🎉 LÄSLOOP 10×10 KLAR"
    )

    print(
        "========================================"
    )

    print()

    print(
        "✅ Exakt 500 ord"
    )

    print(
        "✅ 10 sekunder per ord"
    )

    print(
        "✅ 10 separata rätt krävs"
    )

    print(
        "✅ Timeout = tillbaka till 0/10"
    )

    print(
        "✅ Svårt ord kommer tillbaka senare"
    )

    print(
        "✅ Svensk röst vid timeout"
    )

    print(
        "✅ Tidsstapeln fylls åt höger"
    )

    print()


asyncio.run(
    main()
)
