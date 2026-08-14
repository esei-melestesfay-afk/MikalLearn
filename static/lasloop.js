
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
