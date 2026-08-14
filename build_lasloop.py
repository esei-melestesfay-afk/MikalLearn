from pathlib import Path
import asyncio
import json
import re

import edge_tts
from edge_tts import VoicesManager


ROOT = Path(".")
STATIC = ROOT / "static"
TEMPLATES = ROOT / "templates"
AUDIO = STATIC / "audio" / "lasloop"

STATIC.mkdir(exist_ok=True)
TEMPLATES.mkdir(exist_ok=True)
AUDIO.mkdir(parents=True, exist_ok=True)


# ============================================================
# KONTROLLERA BEFINTLIGA ORD + LJUD
# ============================================================

LISTENING_WORDS = STATIC / "listening_words.json"

if not LISTENING_WORDS.exists():
    raise RuntimeError(
        "static/listening_words.json saknas. "
        "LäsLoop använder de ordljud som redan finns i MikalLearn."
    )

existing_words = json.loads(
    LISTENING_WORDS.read_text(
        encoding="utf-8"
    )
)

word_lookup = {
    str(item["word"]).lower().strip(): item
    for item in existing_words
}


# ============================================================
# VANLIGA ORD
#
# Börjar med extremt vanliga och användbara ord.
# Sedan kommer fler verb, tidsord och skolord.
# ============================================================

PRIORITY_WORDS = """
jag du han hon vi ni
mig dig oss
min mitt mina din ditt dina
hans hennes vår vårt våra deras
den det de
en ett
är har kan ska vill får
måste behöver blir gör går kommer
ser vet säger tar ger
finns tycker tänker känner
börjar slutar läser skriver
lyssnar pratar frågar svarar
hjälper försöker lär använder
hittar väntar bor heter

och eller men att som om
när då där här
vem vad var varför hur
vilken vilket vilka
för med utan till från av på i
under över mellan innan efter

inte också bara
alltid ofta ibland aldrig
nu snart sedan igen
först sist redan
mycket lite mer mindre
bra rätt fel
stor liten lång kort
ny gammal lätt svårt
glad ledsen trött

idag igår imorgon
morgon kväll natt
dag vecka månad år tid
hem hemma ute inne
upp ner in ut bort kvar

skola lärare elev klass
bok text ord mening
fråga svar uppgift
arbete problem hjälp
vän kompis familj
mamma pappa syster bror
mat vatten buss bil
rum bord stol dörr
mobil dator telefon
butik jobb rast lektion prov
person namn nummer
därför eftersom ändå
tillsammans direkt kanske
"""

requested_words = []

for word in PRIORITY_WORDS.split():
    word = word.strip().lower()

    if (
        word
        and
        word not in requested_words
        and
        word in word_lookup
    ):
        requested_words.append(word)


if len(requested_words) < 80:
    raise RuntimeError(
        f"För få ord hittades i ordbanken: {len(requested_words)}"
    )


# ============================================================
# FRASER
#
# De dyker INTE upp direkt.
# LäsLoop låser upp dem automatiskt när flera ord blivit
# automatiska.
# ============================================================

PHRASES = [
    "jag är",
    "du är",
    "han är",
    "hon är",
    "vi är",
    "det är",
    "jag har",
    "du har",
    "hon har",
    "han har",
    "vi har",
    "jag kan",
    "du kan",
    "hon kan",
    "han kan",
    "vi kan",
    "jag vill",
    "hon vill",
    "han vill",
    "vi vill",
    "jag ska",
    "hon ska",
    "han ska",
    "vi ska",

    "jag är hemma",
    "hon är hemma",
    "han är hemma",
    "vi är hemma",
    "det är bra",
    "det är svårt",
    "det är lätt",
    "jag kan läsa",
    "hon kan läsa",
    "han kan läsa",
    "jag kan skriva",
    "hon kan skriva",
    "vi kan gå",
    "jag vill gå",
    "hon vill gå",
    "han vill gå",
    "vi ska gå",
    "jag går hem",
    "hon går hem",
    "han går hem",
    "vi går hem",
    "jag går ut",
    "hon går ut",
    "han går ut",
    "jag kommer snart",
    "hon kommer snart",

    "jag går till skolan",
    "hon går till skolan",
    "han går till skolan",
    "vi går till skolan",
    "jag är hemma nu",
    "hon är hemma nu",
    "han är hemma nu",
    "jag vill gå hem",
    "hon vill gå hem",
    "han vill gå hem",
    "jag kan göra det",
    "hon kan göra det",
    "han kan göra det",
    "vi kan göra det",
    "jag har en bok",
    "hon har en bok",
    "han har en bok",
    "det är en bok",
    "jag läser en bok",
    "hon läser en bok",

    "jag vet inte",
    "hon vet inte",
    "han vet inte",
    "jag kan inte",
    "hon kan inte",
    "han kan inte",
    "jag vill inte",
    "hon vill inte",
    "han vill inte",
    "vad är det",
    "vem är det",
    "var är hon",
    "var är han",
    "hur är det",
    "när kommer hon",
    "när kommer han",

    "jag kommer hem snart",
    "hon kommer hem snart",
    "han kommer hem snart",
    "vi kommer hem snart",
    "jag går ut nu",
    "hon går ut nu",
    "han går ut nu",
    "jag läser texten",
    "hon läser texten",
    "han läser texten",
    "jag skriver ett svar",
    "hon skriver ett svar",
    "vi skriver ett svar",

    "jag frågar läraren",
    "hon frågar läraren",
    "han frågar läraren",
    "jag behöver hjälp",
    "hon behöver hjälp",
    "han behöver hjälp",
    "vi behöver hjälp",
    "jag förstår frågan",
    "hon förstår frågan",
    "jag svarar på frågan"
]


# ============================================================
# BYGG DATA
# ============================================================

word_items = []

for index, word in enumerate(
    requested_words,
    start=1
):
    source = word_lookup[word]

    word_items.append({
        "id": f"word_{index:03d}",
        "type": "word",
        "text": word,
        "audio": (
            "/static/audio/listening_words/"
            + source["file"]
        ),
        "word_count": 1,
        "requires": []
    })


word_set = set(requested_words)

phrase_items = []

for index, phrase in enumerate(
    PHRASES,
    start=1
):
    tokens = re.findall(
        r"[a-zåäöéü]+",
        phrase.lower()
    )

    requires = []

    for token in tokens:
        if (
            token in word_set
            and
            token not in requires
        ):
            requires.append(token)

    phrase_items.append({
        "id": f"phrase_{index:03d}",
        "type": "phrase",
        "text": phrase,
        "audio": (
            f"/static/audio/lasloop/"
            f"phrase_{index:03d}.mp3"
        ),
        "word_count": len(tokens),
        "requires": requires
    })


data = {
    "words": word_items,
    "phrases": phrase_items
}


(STATIC / "lasloop-data.json").write_text(
    json.dumps(
        data,
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
    --loop-bg: #f5f6fb;
    --loop-card: #ffffff;
    --loop-text: #181a24;
    --loop-muted: #7d8190;
    --loop-line: #e7e8ef;
    --loop-purple: #5d5ee8;
    --loop-purple-soft: #eeeeff;
    --loop-dark: #1c1e29;
    --loop-green: #168652;
    --loop-green-soft: #eaf8f0;
    --loop-orange-soft: #fff3e5;
    --loop-orange: #a75d0c;
}

* {
    box-sizing: border-box;
}

body {
    margin: 0;

    color: var(--loop-text);

    background:
        radial-gradient(
            circle at 85% 5%,
            rgba(93,94,232,.10),
            transparent 350px
        ),
        var(--loop-bg);

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

.loop-shell {
    width: min(
        900px,
        calc(100% - 28px)
    );

    margin: 0 auto;

    padding:
        26px 0
        70px;
}

.loop-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;

    margin-bottom: 20px;
}

.loop-back {
    color: #555966;

    font-size: 12px;
    font-weight: 800;

    text-decoration: none;
}

.loop-brand {
    color: var(--loop-purple);

    font-size: 10px;
    font-weight: 950;

    letter-spacing: 1.6px;
}

.loop-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;

    gap: 20px;

    margin-bottom: 15px;
}

.loop-label {
    margin: 0 0 5px;

    color: var(--loop-purple);

    font-size: 10px;
    font-weight: 950;

    letter-spacing: 1.3px;
}

.loop-head h1 {
    margin: 0;

    font-size:
        clamp(
            30px,
            6vw,
            46px
        );

    letter-spacing: -1.6px;
}

.loop-head p {
    max-width: 560px;

    margin:
        8px 0 0;

    color: var(--loop-muted);

    font-size: 12px;
    line-height: 1.6;
}

.today-box {
    min-width: 100px;

    padding:
        11px 13px;

    text-align: center;

    background: white;

    border:
        1px solid
        var(--loop-line);

    border-radius: 14px;
}

.today-box span {
    display: block;

    color: var(--loop-muted);

    font-size: 8px;
    font-weight: 900;

    letter-spacing: .8px;
}

.today-box strong {
    display: block;

    margin-top: 3px;

    font-size: 21px;
}

.progress-card {
    display: grid;

    grid-template-columns:
        repeat(
            3,
            minmax(0, 1fr)
        );

    gap: 8px;

    margin-bottom: 12px;
}

.progress-item {
    padding:
        12px 14px;

    background: white;

    border:
        1px solid
        var(--loop-line);

    border-radius: 14px;
}

.progress-item span {
    display: block;

    color: var(--loop-muted);

    font-size: 8px;
    font-weight: 900;

    text-transform: uppercase;
    letter-spacing: .7px;
}

.progress-item strong {
    display: block;

    margin-top: 4px;

    font-size: 16px;
}

.loop-card {
    position: relative;

    overflow: hidden;

    min-height: 500px;

    padding:
        28px;

    background: white;

    border:
        1px solid
        var(--loop-line);

    border-radius: 27px;

    box-shadow:
        0 20px 60px
        rgba(29,34,68,.08);
}

.loop-card::after {
    content: "";

    position: absolute;

    width: 300px;
    height: 300px;

    top: -170px;
    right: -180px;

    border:
        45px solid
        rgba(93,94,232,.035);

    border-radius: 999px;

    pointer-events: none;
}

.loop-topline {
    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 10px;

    position: relative;
    z-index: 2;
}

.item-type {
    padding:
        7px 10px;

    color: var(--loop-purple);

    background:
        var(--loop-purple-soft);

    border-radius: 999px;

    font-size: 9px;
    font-weight: 900;
}

.item-mastery {
    color: var(--loop-muted);

    font-size: 10px;
    font-weight: 800;
}

.word-zone {
    display: grid;
    place-items: center;

    min-height: 290px;

    padding:
        30px 10px;

    text-align: center;
}

.loop-word {
    max-width: 760px;

    font-size:
        clamp(
            48px,
            10vw,
            94px
        );

    font-weight: 950;

    line-height: 1.05;

    letter-spacing:
        -3px;

    overflow-wrap:
        anywhere;
}

.loop-word.phrase {
    font-size:
        clamp(
            37px,
            7vw,
            67px
        );

    line-height: 1.15;
}

.loop-instruction {
    margin-top: 13px;

    color: var(--loop-muted);

    font-size: 11px;
    font-weight: 700;
}

.loop-response {
    min-height: 37px;

    margin-bottom: 10px;

    text-align: center;

    font-size: 11px;
    font-weight: 800;
}

.response-good {
    color: var(--loop-green);
}

.response-hard {
    color: var(--loop-orange);
}

.buttons {
    display: grid;

    grid-template-columns:
        1.35fr 1fr;

    gap: 9px;
}

.loop-button {
    min-height: 61px;

    border-radius: 16px;

    border: 0;

    cursor: pointer;

    font-weight: 900;

    transition:
        transform .12s ease,
        box-shadow .12s ease;
}

.loop-button:hover {
    transform:
        translateY(-1px);
}

.direct-button {
    color: white;

    background:
        linear-gradient(
            135deg,
            #5758e8,
            #6c6df2
        );

    box-shadow:
        0 12px 25px
        rgba(93,94,232,.19);
}

.hard-button {
    color: #454957;

    background: #f7f7fa;

    border:
        1px solid
        var(--loop-line);
}

.loop-button:disabled {
    opacity: .4;

    cursor: not-allowed;

    transform: none;
}

.bottom-note {
    margin-top: 15px;

    color: #999daa;

    text-align: center;

    font-size: 9px;
    line-height: 1.5;
}

.unlock-toast {
    position: fixed;

    left: 50%;
    bottom: 25px;

    z-index: 50;

    transform:
        translateX(-50%)
        translateY(120px);

    padding:
        13px 17px;

    color: white;

    background:
        #1c1e29;

    border-radius: 14px;

    box-shadow:
        0 15px 40px
        rgba(0,0,0,.18);

    font-size: 11px;
    font-weight: 800;

    opacity: 0;

    transition:
        .3s ease;
}

.unlock-toast.show {
    opacity: 1;

    transform:
        translateX(-50%)
        translateY(0);
}

@media (
    max-width: 650px
) {

    .loop-shell {
        width:
            min(
                100% - 18px,
                900px
            );

        padding-top: 16px;
    }

    .loop-head {
        flex-direction: column;
    }

    .today-box {
        width: 100%;
    }

    .progress-card {
        grid-template-columns:
            1fr 1fr;
    }

    .progress-item:last-child {
        grid-column:
            1 / -1;
    }

    .loop-card {
        min-height: 470px;

        padding:
            20px 15px;

        border-radius: 21px;
    }

    .word-zone {
        min-height: 275px;
    }

    .buttons {
        grid-template-columns: 1fr;
    }

    .loop-button {
        min-height: 58px;
    }
}

</style>

</head>


<body>

<div class="loop-shell">

    <nav class="loop-nav">

        <a
            class="loop-back"
            href="/lasa">
            ← Tillbaka till Läsa
        </a>

        <span class="loop-brand">
            MIKALLEARN
        </span>

    </nav>


    <header class="loop-head">

        <div>

            <p class="loop-label">
                ⚡ LÄSLOOP
            </p>

            <h1>
                Läs. Klicka. Nästa.
            </h1>

            <p>
                Målet är att vanliga ord ska kännas igen
                direkt utan att läsa bokstav för bokstav.
                Läs högt och välj hur det kändes.
            </p>

        </div>


        <div class="today-box">

            <span>
                LÄSTA IDAG
            </span>

            <strong id="todayCount">
                0
            </strong>

        </div>

    </header>


    <section class="progress-card">

        <div class="progress-item">

            <span>
                Automatiska ord
            </span>

            <strong id="masteredWords">
                0
            </strong>

        </div>


        <div class="progress-item">

            <span>
                Tränas igen
            </span>

            <strong id="reviewCount">
                0
            </strong>

        </div>


        <div class="progress-item">

            <span>
                Nuvarande nivå
            </span>

            <strong id="currentLevel">
                Ord
            </strong>

        </div>

    </section>


    <main class="loop-card">

        <div class="loop-topline">

            <span
                class="item-type"
                id="itemType">
                ORD
            </span>


            <span
                class="item-mastery"
                id="itemMastery">
                0 / 4
            </span>

        </div>


        <div class="word-zone">

            <div>

                <div
                    class="loop-word"
                    id="loopWord">
                    ...
                </div>


                <div
                    class="loop-instruction"
                    id="loopInstruction">
                    Läs ordet högt direkt.
                </div>

            </div>

        </div>


        <div
            class="loop-response"
            id="loopResponse">
        </div>


        <div class="buttons">

            <button
                id="directButton"
                class="
                    loop-button
                    direct-button
                "
                type="button">

                ✅ Direkt

            </button>


            <button
                id="hardButton"
                class="
                    loop-button
                    hard-button
                "
                type="button">

                🧠 Svårt

            </button>

        </div>


        <div class="bottom-note">

            “Direkt” = du kunde läsa utan att
            behöva gå igenom bokstäverna en efter en.
            <br>
            “Svårt” = ordet kommer tillbaka snart.

        </div>

    </main>

</div>


<div
    class="unlock-toast"
    id="unlockToast">
</div>


<script
    src="/static/lasloop.js?v=1"
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

        const REQUIRED_WORD =
            4;

        const REQUIRED_PHRASE =
            3;


        const STORAGE_KEY =
            "mikal_lasloop_v1";


        let words = [];
        let phrases = [];
        let allItems = [];
        let byId = {};

        let current = null;
        let shownAt = 0;
        let busy = false;


        const $ = id =>
            document.getElementById(id);



        function todayString() {

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



        function newState() {

            return {
                day:
                    todayString(),

                todayCount:
                    0,

                counter:
                    0,

                stats:
                    {},

                queue:
                    [],

                phraseUnlocked:
                    false
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
                        saved.day
                        !==
                        todayString()
                    ) {

                        saved.day =
                            todayString();

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
                            ? saved.queue
                            : [];

                    return saved;

                }

            }

            catch {
            }


            return newState();

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
                    direct: 0,
                    hard: 0,
                    totalTime: 0
                };

            }


            return state.stats[id];

        }



        function required(item) {

            return item.type
                === "word"
                    ? REQUIRED_WORD
                    : REQUIRED_PHRASE;

        }



        function mastered(item) {

            return (
                statFor(
                    item.id
                ).streak
                >=
                required(item)
            );

        }



        function masteredWordSet() {

            const result =
                new Set();


            words.forEach(
                item => {

                    if (
                        mastered(item)
                    ) {

                        result.add(
                            item.text
                                .toLowerCase()
                        );

                    }

                }
            );


            return result;

        }



        function masteredWordCount() {

            let count =
                0;


            words.forEach(
                item => {

                    if (
                        mastered(item)
                    ) {

                        count++;

                    }

                }
            );


            return count;

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



        function phraseAllowed(
            item
        ) {

            if (
                item.type
                !== "phrase"
            ) {

                return true;

            }


            const masteredWords =
                masteredWordSet();


            if (
                masteredWords.size
                < 12
            ) {

                return false;

            }


            /*
                2 ord låses upp först.
                3 ord senare.
                4+ ord ännu senare.
            */

            if (
                item.word_count === 2
                &&
                masteredWords.size < 12
            ) {

                return false;

            }


            if (
                item.word_count === 3
                &&
                masteredWords.size < 22
            ) {

                return false;

            }


            if (
                item.word_count >= 4
                &&
                masteredWords.size < 38
            ) {

                return false;

            }


            if (
                !item.requires
                ||
                !item.requires.length
            ) {

                return true;

            }


            let known =
                0;


            item.requires.forEach(
                word => {

                    if (
                        masteredWords.has(
                            word
                                .toLowerCase()
                        )
                    ) {

                        known++;

                    }

                }
            );


            const ratio =
                known
                /
                item.requires.length;


            return ratio >= 0.60;

        }



        function dueItems() {

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
                        (
                            !current
                            ||
                            item.id
                            !==
                            current.id
                        )
                        &&
                        phraseAllowed(
                            item
                        )
                );

        }



        function randomFrom(array) {

            if (
                !array.length
            ) {

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



        function chooseWord() {

            const available =
                words.filter(
                    item =>
                        (
                            !current
                            ||
                            item.id
                            !==
                            current.id
                        )
                        &&
                        !mastered(item)
                );


            if (
                !available.length
            ) {

                return randomFrom(
                    words.filter(
                        item =>
                            !current
                            ||
                            item.id
                            !==
                            current.id
                    )
                );

            }


            /*
                Först helt nya ord.
            */

            const unseen =
                available.filter(
                    item =>
                        statFor(
                            item.id
                        ).seen === 0
                );


            if (
                unseen.length
            ) {

                return randomFrom(
                    unseen.slice(
                        0,
                        Math.min(
                            25,
                            unseen.length
                        )
                    )
                );

            }


            /*
                Sedan de med lägst streak.
            */

            const sorted =
                [...available]
                    .sort(
                        (a, b) => {

                            const sa =
                                statFor(
                                    a.id
                                );


                            const sb =
                                statFor(
                                    b.id
                                );


                            if (
                                sa.streak
                                !==
                                sb.streak
                            ) {

                                return (
                                    sa.streak
                                    -
                                    sb.streak
                                );

                            }


                            return (
                                sb.hard
                                -
                                sa.hard
                            );

                        }
                    );


            return randomFrom(
                sorted.slice(
                    0,
                    Math.min(
                        18,
                        sorted.length
                    )
                )
            );

        }



        function choosePhrase() {

            const allowed =
                phrases.filter(
                    item =>
                        phraseAllowed(item)
                        &&
                        (
                            !current
                            ||
                            item.id
                            !==
                            current.id
                        )
                        &&
                        !mastered(item)
                );


            if (
                !allowed.length
            ) {

                return null;

            }


            const unseen =
                allowed.filter(
                    item =>
                        statFor(
                            item.id
                        ).seen === 0
                );


            if (
                unseen.length
            ) {

                return randomFrom(
                    unseen
                );

            }


            const sorted =
                [...allowed]
                    .sort(
                        (a, b) =>
                            statFor(
                                a.id
                            ).streak
                            -
                            statFor(
                                b.id
                            ).streak
                    );


            return randomFrom(
                sorted.slice(
                    0,
                    Math.min(
                        12,
                        sorted.length
                    )
                )
            );

        }



        function chooseNext() {

            const due =
                dueItems();


            if (
                due.length
            ) {

                /*
                    Svåra / schemalagda ord
                    prioriteras när deras tur
                    har kommit.
                */

                due.sort(
                    (a, b) => {

                        const sa =
                            statFor(
                                a.id
                            );


                        const sb =
                            statFor(
                                b.id
                            );


                        return (
                            sb.hard
                            -
                            sa.hard
                        );

                    }
                );


                return due[0];

            }


            const masteredWords =
                masteredWordCount();


            let phraseChance =
                0;


            if (
                masteredWords >= 12
                &&
                masteredWords < 22
            ) {

                phraseChance =
                    0.18;

            }

            else if (
                masteredWords >= 22
                &&
                masteredWords < 38
            ) {

                phraseChance =
                    0.30;

            }

            else if (
                masteredWords >= 38
            ) {

                phraseChance =
                    0.42;

            }


            if (
                phraseChance > 0
                &&
                Math.random()
                <
                phraseChance
            ) {

                const phrase =
                    choosePhrase();


                if (phrase) {

                    return phrase;

                }

            }


            return (
                chooseWord()
                ||
                choosePhrase()
                ||
                randomFrom(
                    allItems
                )
            );

        }



        function currentLevelText() {

            const masteredWords =
                masteredWordCount();


            if (
                masteredWords < 12
            ) {

                return "Ord";

            }


            if (
                masteredWords < 22
            ) {

                return "Ord + 2 ord";

            }


            if (
                masteredWords < 38
            ) {

                return "Korta fraser";

            }


            return "Flytande fraser";

        }



        function reviewCount() {

            const ids =
                new Set();


            state.queue.forEach(
                entry => {

                    const item =
                        byId[
                            entry.id
                        ];


                    if (
                        item
                        &&
                        !mastered(item)
                    ) {

                        ids.add(
                            item.id
                        );

                    }

                }
            );


            return ids.size;

        }



        function updateStats() {

            $("todayCount")
                .textContent =
                state.todayCount;


            $("masteredWords")
                .textContent =
                masteredWordCount()
                +
                " / "
                +
                words.length;


            $("reviewCount")
                .textContent =
                reviewCount();


            $("currentLevel")
                .textContent =
                currentLevelText();

        }



        function showToast(text) {

            const toast =
                $("unlockToast");


            toast.textContent =
                text;


            toast.classList.add(
                "show"
            );


            setTimeout(
                () => {

                    toast.classList
                        .remove(
                            "show"
                        );

                },
                2600
            );

        }



        function checkUnlock() {

            const count =
                masteredWordCount();


            if (
                count >= 12
                &&
                !state.phraseUnlocked
            ) {

                state.phraseUnlocked =
                    true;


                save();


                showToast(
                    "🔥 Ny nivå: två ord tillsammans är upplåsta!"
                );

            }

        }



        function renderCurrent() {

            busy =
                false;


            $("directButton")
                .disabled =
                false;


            $("hardButton")
                .disabled =
                false;


            $("loopResponse")
                .textContent =
                "";


            if (!current) {

                $("loopWord")
                    .textContent =
                    "Klart!";


                return;

            }


            const stat =
                statFor(
                    current.id
                );


            $("loopWord")
                .textContent =
                current.text;


            $("loopWord")
                .classList.toggle(
                    "phrase",
                    current.type
                    === "phrase"
                );


            $("itemType")
                .textContent =
                current.type
                === "word"
                    ? "ORD"
                    : (
                        current.word_count
                        +
                        " ORD TILLSAMMANS"
                    );


            $("itemMastery")
                .textContent =
                stat.streak
                +
                " / "
                +
                required(
                    current
                );


            $("loopInstruction")
                .textContent =
                current.type
                === "word"
                    ? "Läs ordet högt direkt."
                    : "Försök läsa hela frasen tillsammans.";


            shownAt =
                performance.now();


            updateStats();

        }



        function next() {

            current =
                chooseNext();


            renderCurrent();

        }



        function playAudio(item) {

            if (
                !item
                ||
                !item.audio
            ) {

                return Promise.resolve();

            }


            return new Promise(
                resolve => {

                    const audio =
                        new Audio(
                            item.audio
                        );


                    audio.volume =
                        1;


                    let finished =
                        false;


                    function done() {

                        if (finished) {
                            return;
                        }


                        finished =
                            true;


                        resolve();

                    }


                    audio.addEventListener(
                        "ended",
                        done,
                        {
                            once: true
                        }
                    );


                    audio.addEventListener(
                        "error",
                        done,
                        {
                            once: true
                        }
                    );


                    audio.play()
                        .catch(
                            () => done()
                        );


                    setTimeout(
                        done,
                        3500
                    );

                }
            );

        }



        function markDirect() {

            if (
                busy
                ||
                !current
            ) {

                return;

            }


            busy =
                true;


            $("directButton")
                .disabled =
                true;


            $("hardButton")
                .disabled =
                true;


            const elapsed =
                Math.max(
                    0.1,
                    (
                        performance.now()
                        -
                        shownAt
                    )
                    /
                    1000
                );


            const stat =
                statFor(
                    current.id
                );


            stat.seen++;

            stat.direct++;

            stat.totalTime +=
                elapsed;


            stat.streak =
                Math.min(
                    required(
                        current
                    ),
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

                let delay;


                if (
                    stat.streak === 1
                ) {

                    delay =
                        4;

                }

                else if (
                    stat.streak === 2
                ) {

                    delay =
                        8;

                }

                else {

                    delay =
                        15;

                }


                schedule(
                    current.id,
                    delay
                );

            }


            $("itemMastery")
                .textContent =
                stat.streak
                +
                " / "
                +
                required(
                    current
                );


            if (
                mastered(
                    current
                )
            ) {

                $("loopResponse")
                    .innerHTML =
                    "<span class='response-good'>" +
                    "⚡ Automatiskt! "
                    +
                    elapsed.toFixed(1)
                    +
                    " s" +
                    "</span>";

            }

            else {

                $("loopResponse")
                    .innerHTML =
                    "<span class='response-good'>" +
                    "✓ Direkt · "
                    +
                    elapsed.toFixed(1)
                    +
                    " s · "
                    +
                    stat.streak
                    +
                    "/"
                    +
                    required(
                        current
                    )
                    +
                    "</span>";

            }


            save();

            checkUnlock();

            updateStats();


            setTimeout(
                next,
                430
            );

        }



        async function markHard() {

            if (
                busy
                ||
                !current
            ) {

                return;

            }


            busy =
                true;


            $("directButton")
                .disabled =
                true;


            $("hardButton")
                .disabled =
                true;


            const stat =
                statFor(
                    current.id
                );


            stat.seen++;

            stat.hard++;

            /*
                Svårt = tillbaka till 0.
                Hon måste sedan bygga upp
                4 separata Direkt igen.
            */

            stat.streak =
                0;


            state.counter++;

            state.todayCount++;


            schedule(
                current.id,
                3
            );


            $("itemMastery")
                .textContent =
                "0 / "
                +
                required(
                    current
                );


            $("loopResponse")
                .innerHTML =
                "<span class='response-hard'>" +
                "🔊 Lyssna och säg efter. " +
                "Den kommer tillbaka snart." +
                "</span>";


            save();

            updateStats();


            await playAudio(
                current
            );


            setTimeout(
                next,
                300
            );

        }



        $("directButton")
            .addEventListener(
                "click",
                markDirect
            );


        $("hardButton")
            .addEventListener(
                "click",
                markHard
            );


        /*
            Tangentbord:
            Enter = Direkt
            S = Svårt
        */

        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.repeat
                ) {

                    return;

                }


                if (
                    event.key
                    === "Enter"
                ) {

                    event.preventDefault();

                    markDirect();

                }


                if (
                    event.key
                        .toLowerCase()
                    === "s"
                ) {

                    event.preventDefault();

                    markHard();

                }

            }
        );


        try {

            const response =
                await fetch(
                    "/static/lasloop-data.json?v=1"
                );


            if (!response.ok) {

                throw new Error(
                    "LäsLoop-data kunde inte laddas."
                );

            }


            const data =
                await response.json();


            words =
                data.words
                || [];


            phrases =
                data.phrases
                || [];


            allItems =
                [
                    ...words,
                    ...phrases
                ];


            byId =
                Object.fromEntries(
                    allItems.map(
                        item =>
                            [
                                item.id,
                                item
                            ]
                    )
                );


            /*
                Ta bort köposter för
                gamla / saknade objekt.
            */

            state.queue =
                state.queue.filter(
                    entry =>
                        byId[
                            entry.id
                        ]
                );


            save();

            next();

        }

        catch (error) {

            console.error(
                error
            );


            $("loopWord")
                .textContent =
                "Kunde inte ladda";


            $("loopInstruction")
                .textContent =
                error.message;


            $("directButton")
                .disabled =
                true;


            $("hardButton")
                .disabled =
                true;

        }

    }
);
'''


# ============================================================
# KNAPP PÅ LÄSA-SIDAN
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
                position: relative;

                display: grid;

                grid-template-columns:
                    1fr auto;

                align-items: center;

                gap: 20px;

                overflow: hidden;

                margin:
                    18px 0
                    23px;

                padding:
                    21px 23px;

                color: white;

                background:
                    radial-gradient(
                        circle at 86% 12%,
                        rgba(105,107,255,.76),
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

                letter-spacing:
                    1.4px;
            }


            .lasloop-entry h3 {
                margin: 0;

                color: white;

                font-size: 21px;

                letter-spacing:
                    -.5px;
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
                position: relative;

                z-index: 2;

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

                font-size:
                    10px;

                font-weight:
                    900;
            }


            @media (
                max-width: 650px
            ) {

                .lasloop-entry {
                    grid-template-columns:
                        1fr;
                }


                .lasloop-entry a {
                    width:
                        fit-content;
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
                    ⚡ SNABBLÄSNING
                </p>

                <h3>
                    LäsLoop
                </h3>

                <p>
                    Läs ett ord, klicka och få nästa direkt.
                    Svåra ord kommer tillbaka tills de känns automatiska.
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
            document.querySelector(
                ".page-shell"
            )
            ||
            document.body;


        const heading =
            main.querySelector(
                "h1"
            );


        if (
            heading
            &&
            heading.parentElement
        ) {

            heading.parentElement
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
# SKRIV WEBBFILER
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
# KOPPLA KNAPP TILL LÄSA.HTML
# ============================================================

LASA = TEMPLATES / "lasa.html"

if not LASA.exists():
    raise RuntimeError(
        "templates/lasa.html saknas."
    )


lasa_html = LASA.read_text(
    encoding="utf-8"
)


entry_tag = (
    '<script src="/static/lasloop-entry.js?v=1" defer></script>'
)


if entry_tag not in lasa_html:

    if "</body>" in lasa_html:

        lasa_html = lasa_html.replace(
            "</body>",
            "    "
            + entry_tag
            + "\n</body>"
        )

    else:

        lasa_html += (
            "\n"
            + entry_tag
            + "\n"
        )


LASA.write_text(
    lasa_html,
    encoding="utf-8",
    newline="\n"
)


# ============================================================
# ROUTE /lasloop
# ============================================================

APP = ROOT / "app.py"

if not APP.exists():
    raise RuntimeError(
        "app.py saknas."
    )


app_text = APP.read_text(
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
            + "\n"
            + marker,
            1
        )

    else:

        app_text += (
            "\n"
            + route
        )


APP.write_text(
    app_text,
    encoding="utf-8",
    newline="\n"
)


# ============================================================
# SVENSK RÖST FÖR FRASERNA
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


async def create_phrase_audio(
    phrase,
    output,
    voice
):

    if (
        output.exists()
        and
        output.stat().st_size
        > 500
    ):
        return


    for attempt in range(
        1,
        5
    ):

        try:

            speech = edge_tts.Communicate(
                text=phrase,
                voice=voice,
                rate="-4%",
                volume="+0%"
            )

            await speech.save(
                str(output)
            )

            return

        except Exception as error:

            print(
                f"   ⚠️ Försök {attempt}/4:",
                error
            )

            await asyncio.sleep(2)


    raise RuntimeError(
        "Kunde inte skapa ljud för: "
        + phrase
    )


async def build_audio():

    voice = await get_voice()

    print()
    print(
        "🎙️ Svensk röst:",
        voice
    )
    print()


    total = len(PHRASES)


    for index, phrase in enumerate(
        PHRASES,
        start=1
    ):

        output = (
            AUDIO
            /
            f"phrase_{index:03d}.mp3"
        )


        print(
            f"[{index}/{total}] "
            f"{phrase}"
        )


        await create_phrase_audio(
            phrase,
            output,
            voice
        )


        print(
            "   ✅ klar"
        )


async def main():

    await build_audio()


    print()
    print(
        "============================================"
    )

    print(
        "⚡ LÄSLOOP ÄR KLAR"
    )

    print(
        "============================================"
    )

    print()

    print(
        f"✅ {len(word_items)} vanliga ord"
    )

    print(
        f"✅ {len(phrase_items)} fraser"
    )

    print(
        "✅ Svårt ord kommer tillbaka efter 3 andra kort"
    )

    print(
        "✅ Ord kräver 4 separata Direkt"
    )

    print(
        "✅ Svårt återställer ordet till 0/4"
    )

    print(
        "✅ 2-ordsfraser låses upp automatiskt"
    )

    print(
        "✅ 3- och 4-ordsfraser kommer senare"
    )

    print(
        "✅ Svenskt ljud spelas när något är svårt"
    )

    print(
        "✅ Resultat sparas i webbläsaren"
    )

    print()


asyncio.run(
    main()
)
