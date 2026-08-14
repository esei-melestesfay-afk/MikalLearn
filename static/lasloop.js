
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
