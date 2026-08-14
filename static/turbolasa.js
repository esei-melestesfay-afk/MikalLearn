
document.addEventListener("DOMContentLoaded", async () => {

    const STORAGE = {
        lesson: "mikal_turbo_lesson_v1",
        progress: "mikal_turbo_progress_v1",
        hard: "mikal_turbo_hard_words_v1"
    };

    let lessons = [];
    let lessonIndex = 0;
    let currentLesson = null;

    let stage = 0;

    let flashTimer = null;
    let flashIndex = 0;

    let phrasePlayed = new Set();

    let round = 0;
    let roundTimes = [null, null, null];
    let roundRunning = false;
    let roundStartedAt = 0;
    let roundTicker = null;

    let transferTime = null;
    let transferRunning = false;
    let transferStartedAt = 0;
    let transferTicker = null;

    let sessionHard = new Set();


    const $ = id =>
        document.getElementById(id);


    function safeJSON(key, fallback) {
        try {
            const value =
                JSON.parse(
                    localStorage.getItem(key)
                );

            return value ?? fallback;
        }

        catch {
            return fallback;
        }
    }


    function saveJSON(key, value) {
        localStorage.setItem(
            key,
            JSON.stringify(value)
        );
    }


    function normalizeWord(word) {
        return String(word || "")
            .toLowerCase()
            .replace(
                /[^a-zåäöéü]/gi,
                ""
            );
    }


    function getHardWords() {
        const data =
            safeJSON(
                STORAGE.hard,
                {}
            );

        return (
            data
            &&
            typeof data === "object"
            &&
            !Array.isArray(data)
        )
            ? data
            : {};
    }


    function saveHardWord(word) {

        const clean =
            normalizeWord(word);

        if (!clean) {
            return;
        }

        sessionHard.add(clean);

        const hard =
            getHardWords();

        hard[clean] =
            Number(
                hard[clean]
                || 0
            )
            + 1;

        saveJSON(
            STORAGE.hard,
            hard
        );

        updateHero();
    }


    function topHardWords(limit = 5) {

        const hard =
            getHardWords();

        return Object
            .entries(hard)
            .sort(
                (a, b) =>
                    b[1] - a[1]
            )
            .slice(0, limit)
            .map(
                item =>
                    item[0]
            );
    }


    function escapeHTML(text) {

        const div =
            document.createElement(
                "div"
            );

        div.textContent =
            String(text ?? "");

        return div.innerHTML;
    }


    function wordCount(text) {

        return String(text)
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .length;
    }


    function wpm(text, seconds) {

        if (
            !seconds
            ||
            seconds <= 0
        ) {
            return 0;
        }

        return Math.round(
            wordCount(text)
            /
            seconds
            *
            60
        );
    }


    function formatTime(seconds) {

        if (
            seconds === null
            ||
            seconds === undefined
        ) {
            return "—";
        }

        const mins =
            Math.floor(
                seconds / 60
            );

        const secs =
            Math.floor(
                seconds % 60
            );

        const tenths =
            Math.floor(
                (seconds % 1) * 10
            );

        return (
            String(mins)
                .padStart(2, "0")
            +
            ":"
            +
            String(secs)
                .padStart(2, "0")
            +
            "."
            +
            tenths
        );
    }


    function setStage(nextStage) {

        stage = nextStage;

        for (
            let i = 0;
            i <= 5;
            i++
        ) {

            const element =
                $("stage" + i);

            if (!element) {
                continue;
            }

            element.classList.toggle(
                "hidden",
                i !== stage
            );
        }


        const visibleStep =
            Math.min(
                stage + 1,
                5
            );

        $("stageCounter").textContent =
            stage >= 5
                ? "Passet klart"
                : "Steg "
                    + visibleStep
                    + " av 5";


        $("progressBar").style.width =
            stage >= 5
                ? "100%"
                : (
                    (visibleStep / 5)
                    * 100
                )
                + "%";


        window.scrollTo({
            top:
                document
                    .querySelector(
                        ".turbo-card"
                    )
                    .offsetTop
                - 20,

            behavior: "smooth"
        });
    }


    function updateHero() {

        $("heroLesson").textContent =
            (lessonIndex + 1)
            +
            " / "
            +
            lessons.length;


        const progress =
            safeJSON(
                STORAGE.progress,
                {}
            );


        const improvements =
            Object.values(progress)
                .map(
                    item =>
                        Number(
                            item.improvement
                            || 0
                        )
                )
                .filter(
                    value =>
                        Number.isFinite(value)
                        &&
                        value > 0
                );


        if (improvements.length) {

            $("heroBest").textContent =
                "+"
                +
                Math.max(...improvements)
                +
                "%";

        }

        else {

            $("heroBest").textContent =
                "—";

        }


        $("heroHard").textContent =
            Object.keys(
                getHardWords()
            ).length;
    }


    function populateLessons() {

        $("lessonSelect").innerHTML =
            lessons
                .map(
                    (lesson, index) => {

                        return `
                            <option value="${index}">
                                ${index + 1}. ${escapeHTML(lesson.title)}
                                · ${escapeHTML(lesson.level)}
                            </option>
                        `;

                    }
                )
                .join("");


        $("lessonSelect").value =
            String(
                lessonIndex
            );
    }


    function renderWordsForFollow(
        text,
        container
    ) {

        container.innerHTML =
            text
                .split(/\s+/)
                .map(
                    word =>
                        `<span class="reading-word">${escapeHTML(word)}</span>`
                )
                .join(" ");

    }


    function highlightFollow(
        audio,
        container
    ) {

        const words =
            Array.from(
                container
                    .querySelectorAll(
                        ".reading-word"
                    )
            );


        if (
            !words.length
            ||
            !audio.duration
            ||
            !Number.isFinite(
                audio.duration
            )
        ) {
            return;
        }


        const progress =
            audio.currentTime
            /
            audio.duration;


        let index =
            Math.floor(
                progress
                *
                words.length
            );


        index = Math.max(
                0,
                Math.min(
                    words.length - 1,
                    index
                )
            );


        words.forEach(
            (word, i) => {

                word.classList.toggle(
                    "active",
                    i === index
                );

            }
        );

    }


    function buildClickableText(
        text,
        container
    ) {

        container.innerHTML =
            "";


        const parts =
            text.split(/(\s+)/);


        parts.forEach(
            part => {

                if (
                    /^\s+$/.test(part)
                ) {

                    container.appendChild(
                        document.createTextNode(
                            part
                        )
                    );

                    return;
                }


                const button =
                    document.createElement(
                        "button"
                    );


                button.type =
                    "button";


                button.className =
                    "hard-word-button";


                button.textContent =
                    part;


                button.addEventListener(
                    "click",
                    () => {

                        const clean =
                            normalizeWord(
                                part
                            );


                        if (!clean) {
                            return;
                        }


                        button.classList.add(
                            "hard"
                        );


                        saveHardWord(
                            clean
                        );

                    }
                );


                container.appendChild(
                    button
                );

            }
        );

    }


    function buildWarmup() {

        const previousHard =
            topHardWords(3);


        let words =
            [
                ...previousHard,
                ...currentLesson.focus_words
            ];


        words = [...new Set(words)]
                .slice(0, 9);


        $("warmupWords").innerHTML =
            words
                .map(
                    word =>
                        `<span>${escapeHTML(word)}</span>`
                )
                .join("");


        return words;
    }


    async function playFlashWords() {

        clearInterval(
            flashTimer
        );


        const words =
            buildWarmup();


        flashIndex = 0;


        $("stage0Next").disabled =
            true;


        function showWord() {

            if (
                flashIndex
                >= words.length
            ) {

                clearInterval(
                    flashTimer
                );


                $("flashWord")
                    .classList
                    .remove(
                        "hidden-word"
                    );


                $("flashWord").textContent =
                    "Bra! ⚡";


                $("stage0Next").disabled =
                    false;


                return;
            }


            $("flashWord")
                .classList
                .remove(
                    "hidden-word"
                );


            $("flashWord").textContent =
                words[
                    flashIndex
                ];


            setTimeout(
                () => {

                    $("flashWord")
                        .classList
                        .add(
                            "hidden-word"
                        );

                },
                1050
            );


            flashIndex++;

        }


        showWord();


        flashTimer = setInterval(
                showWord,
                1450
            );

    }


    function renderPhrases() {

        phrasePlayed = new Set();


        $("stage2Next").disabled =
            true;


        $("phraseList").innerHTML =
            currentLesson.chunks
                .map(
                    (phrase, index) => {

                        const pretty =
                            escapeHTML(phrase)
                                .replace(
                                    /\//g,
                                    "<em>/</em>"
                                );


                        return `

                            <div class="phrase-card">

                                <button
                                    class="phrase-play"
                                    data-phrase="${index}"
                                    type="button">

                                    ▶

                                </button>

                                <div class="phrase-text">
                                    ${pretty}
                                </div>

                            </div>

                        `;

                    }
                )
                .join("");


        document
            .querySelectorAll(
                ".phrase-play"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const index =
                                Number(
                                    button.dataset
                                        .phrase
                                );


                            const audio =
                                new Audio(
                                    currentLesson
                                        .chunk_audio[
                                            index
                                        ]
                                );


                            audio.volume =
                                1;


                            audio.play();


                            phrasePlayed.add(
                                index
                            );


                            button.textContent =
                                "✓";


                            if (
                                phrasePlayed.size
                                >=
                                currentLesson
                                    .chunks
                                    .length
                            ) {

                                $("stage2Next")
                                    .disabled =
                                    false;

                            }

                        }
                    );

                }
            );

    }


    function resetRounds() {

        round = 0;

        roundTimes = [
                null,
                null,
                null
            ];

        roundRunning = false;

        clearInterval(
            roundTicker
        );


        $("roundLabel").textContent =
            "RUNDA 1 AV 3";


        $("roundTimer").textContent =
            "00:00.0";


        $("roundButton").textContent =
            "Starta";


        $("stage3Next").disabled =
            true;


        for (
            let i = 0;
            i < 3;
            i++
        ) {

            $("roundResult" + i)
                .textContent =
                "—";

        }


        buildClickableText(
            currentLesson.text,
            $("roundReading")
        );

    }


    function startRound() {

        if (
            round >= 3
        ) {
            return;
        }


        roundRunning = true;


        roundStartedAt = performance.now();


        $("roundButton").textContent =
            "Stoppa";


        roundTicker = setInterval(
                () => {

                    const seconds =
                        (
                            performance.now()
                            -
                            roundStartedAt
                        )
                        /
                        1000;


                    $("roundTimer")
                        .textContent =
                        formatTime(
                            seconds
                        );

                },
                100
            );

    }


    function stopRound() {

        if (!roundRunning) {
            return;
        }


        roundRunning = false;


        clearInterval(
            roundTicker
        );


        const seconds =
            Math.max(
                1,
                (
                    performance.now()
                    -
                    roundStartedAt
                )
                /
                1000
            );


        roundTimes[
            round
        ] =
            seconds;


        const speed =
            wpm(
                currentLesson.text,
                seconds
            );


        $("roundResult" + round)
            .textContent =
            speed
            +
            " ord/min";


        round++;


        if (
            round < 3
        ) {

            $("roundLabel").textContent =
                "RUNDA "
                +
                (round + 1)
                +
                " AV 3";


            $("roundTimer").textContent =
                "00:00.0";


            $("roundButton").textContent =
                "Starta nästa runda";

        }

        else {

            $("roundLabel").textContent =
                "3 RUNDOR KLARA";


            $("roundTimer").textContent =
                formatTime(
                    seconds
                );


            $("roundButton").textContent =
                "Klar ✓";


            $("roundButton").disabled =
                true;


            $("stage3Next").disabled =
                false;

        }

    }


    function resetTransfer() {

        transferTime = null;


        transferRunning = false;


        clearInterval(
            transferTicker
        );


        $("transferTimer").textContent =
            "00:00.0";


        $("transferButton").textContent =
            "Starta";


        $("transferButton").disabled =
            false;


        $("finishLesson").disabled =
            true;


        buildClickableText(
            currentLesson.transfer_text,
            $("transferReading")
        );

    }


    function startTransfer() {

        transferRunning = true;


        transferStartedAt = performance.now();


        $("transferButton").textContent =
            "Stoppa";


        transferTicker = setInterval(
                () => {

                    const seconds =
                        (
                            performance.now()
                            -
                            transferStartedAt
                        )
                        /
                        1000;


                    $("transferTimer")
                        .textContent =
                        formatTime(
                            seconds
                        );

                },
                100
            );

    }


    function stopTransfer() {

        transferRunning = false;


        clearInterval(
            transferTicker
        );


        transferTime = Math.max(
                1,
                (
                    performance.now()
                    -
                    transferStartedAt
                )
                /
                1000
            );


        $("transferTimer").textContent =
            formatTime(
                transferTime
            );


        $("transferButton").textContent =
            "Klar ✓";


        $("transferButton").disabled =
            true;


        $("finishLesson").disabled =
            false;

    }


    function saveProgress() {

        const first =
            wpm(
                currentLesson.text,
                roundTimes[0]
            );


        const third =
            wpm(
                currentLesson.text,
                roundTimes[2]
            );


        const transfer =
            wpm(
                currentLesson.transfer_text,
                transferTime
            );


        let improvement =
            0;


        if (
            first > 0
        ) {

            improvement = Math.round(
                    (
                        third - first
                    )
                    /
                    first
                    *
                    100
                );

        }


        const progress =
            safeJSON(
                STORAGE.progress,
                {}
            );


        progress[
            currentLesson.id
        ] = {
            date:
                new Date()
                    .toISOString(),

            first,
            third,
            transfer,

            improvement,

            hard_words:
                Array.from(
                    sessionHard
                )
        };


        saveJSON(
            STORAGE.progress,
            progress
        );


        /*
            Smart rekommendation:

            Om flytet ökade minst lite och
            den nya texten inte rasar kraftigt
            går vi vidare.

            Annars rekommenderar vi samma
            nivå igen nästa gång.
        */

        let recommended =
            lessonIndex;


        if (
            third >= first
            &&
            transfer >=
                first * 0.75
        ) {

            recommended = Math.min(
                    lessons.length - 1,
                    lessonIndex + 1
                );

        }


        localStorage.setItem(
            STORAGE.lesson,
            String(
                recommended
            )
        );


        return {
            first,
            third,
            transfer,
            improvement,
            recommended
        };
    }


    function renderSummary() {

        const result =
            saveProgress();


        $("summaryFirst").textContent =
            result.first
            +
            " ord/min";


        $("summaryThird").textContent =
            result.third
            +
            " ord/min";


        $("summaryImprovement")
            .textContent =
            (
                result.improvement >= 0
                    ? "+"
                    : ""
            )
            +
            result.improvement
            +
            "%";


        let message;


        if (
            result.improvement >= 15
            &&
            result.transfer >=
                result.first * 0.85
        ) {

            message = "<strong>🔥 Flytet ökade tydligt.</strong><br>"
                +
                "Den nya texten fungerade också bra. "
                +
                "Det betyder att träningen börjar överföras "
                +
                "till text som inte är memorerad.";

        }

        else if (
            result.transfer >=
                result.first * 0.75
        ) {

            message = "<strong>✅ Bra träningspass.</strong><br>"
                +
                "Fortsätt prioritera korrekt läsning. "
                +
                "När orden känns mer automatiska kommer "
                +
                "hastigheten naturligt att öka.";

        }

        else {

            message = "<strong>🧠 Gör gärna den här nivån igen.</strong><br>"
                +
                "Den nya texten tog mer energi. "
                +
                "Det betyder att fler ord behöver bli automatiska "
                +
                "innan nästa nivå.";

        }


        $("summaryMessage").innerHTML =
            message;


        const hard =
            Array.from(
                sessionHard
            );


        $("sessionHardWords").innerHTML =
            hard.length
                ? hard
                    .map(
                        word =>
                            `<span>${escapeHTML(word)}</span>`
                    )
                    .join("")
                : "<span>Inga markerade ord 🎉";


        updateHero();


        $("nextLesson").dataset
            .recommended =
            String(
                result.recommended
            );

    }


    function loadLesson(index) {

        if (
            index < 0
            ||
            index >= lessons.length
        ) {

            index = 0;

        }


        lessonIndex = index;


        currentLesson = lessons[
                lessonIndex
            ];


        sessionHard = new Set();


        localStorage.setItem(
            STORAGE.lesson,
            String(
                lessonIndex
            )
        );


        $("lessonSelect").value =
            String(
                lessonIndex
            );


        $("lessonTitle").textContent =
            currentLesson.title
            +
            " · "
            +
            currentLesson.level;


        $("flashWord").textContent =
            "Redo?";


        buildWarmup();


        renderWordsForFollow(
            currentLesson.text,
            $("followText")
        );


        renderPhrases();


        resetRounds();


        resetTransfer();


        $("stage0Next").disabled =
            true;


        $("stage1Next").disabled =
            true;


        $("roundButton").disabled =
            false;


        const audio =
            $("mainAudio");


        audio.pause();


        audio.src =
            currentLesson.main_audio;


        setStage(
            0
        );


        updateHero();

    }


    async function loadData() {

        const response =
            await fetch(
                "/static/turbolasa-data.json?v=1"
            );


        if (!response.ok) {

            throw new Error(
                "Kunde inte ladda TurboLäsning."
            );

        }


        lessons = await response.json();


        const saved =
            Number(
                localStorage.getItem(
                    STORAGE.lesson
                )
                || 0
            );


        lessonIndex = Number.isFinite(saved)
                ? Math.max(
                    0,
                    Math.min(
                        lessons.length - 1,
                        saved
                    )
                )
                : 0;


        populateLessons();


        loadLesson(
            lessonIndex
        );

    }


    $("loadLesson")
        .addEventListener(
            "click",
            () => {

                loadLesson(
                    Number(
                        $("lessonSelect")
                            .value
                    )
                );

            }
        );


    $("startFlash")
        .addEventListener(
            "click",
            playFlashWords
        );


    $("repeatFlash")
        .addEventListener(
            "click",
            playFlashWords
        );


    $("stage0Next")
        .addEventListener(
            "click",
            () => {

                setStage(
                    1
                );

            }
        );


    const mainAudio =
        $("mainAudio");


    mainAudio.addEventListener(
        "timeupdate",
        () => {

            highlightFollow(
                mainAudio,
                $("followText")
            );

        }
    );


    mainAudio.addEventListener(
        "ended",
        () => {

            $("stage1Next")
                .disabled =
                false;


            document
                .querySelectorAll(
                    "#followText .reading-word"
                )
                .forEach(
                    word =>
                        word.classList
                            .remove(
                                "active"
                            )
                );

        }
    );


    function playMain(rate) {

        mainAudio.pause();


        mainAudio.currentTime =
            0;


        mainAudio.playbackRate =
            rate;


        try {
            mainAudio.preservesPitch =
                true;
        }

        catch {
        }


        mainAudio.play();

    }


    $("playMain")
        .addEventListener(
            "click",
            () => {

                playMain(
                    1
                );

            }
        );


    $("playMainSlow")
        .addEventListener(
            "click",
            () => {

                playMain(
                    .82
                );

            }
        );


    $("stage1Next")
        .addEventListener(
            "click",
            () => {

                mainAudio.pause();

                setStage(
                    2
                );

            }
        );


    $("stage2Next")
        .addEventListener(
            "click",
            () => {

                resetRounds();

                setStage(
                    3
                );

            }
        );


    $("roundButton")
        .addEventListener(
            "click",
            () => {

                if (
                    roundRunning
                ) {

                    stopRound();

                }

                else {

                    startRound();

                }

            }
        );


    $("stage3Next")
        .addEventListener(
            "click",
            () => {

                resetTransfer();

                setStage(
                    4
                );

            }
        );


    $("transferButton")
        .addEventListener(
            "click",
            () => {

                if (
                    transferRunning
                ) {

                    stopTransfer();

                }

                else {

                    startTransfer();

                }

            }
        );


    $("finishLesson")
        .addEventListener(
            "click",
            () => {

                renderSummary();

                setStage(
                    5
                );

            }
        );


    $("nextLesson")
        .addEventListener(
            "click",
            () => {

                let index =
                    Number(
                        $("nextLesson")
                            .dataset
                            .recommended
                    );


                if (
                    !Number.isFinite(index)
                ) {

                    index = Math.min(
                            lessons.length - 1,
                            lessonIndex + 1
                        );

                }


                loadLesson(
                    index
                );

            }
        );


    $("repeatLesson")
        .addEventListener(
            "click",
            () => {

                loadLesson(
                    lessonIndex
                );

            }
        );


    try {

        await loadData();

    }

    catch (error) {

        console.error(error);


        $("lessonTitle").textContent =
            "TurboLäsning kunde inte laddas";


        document
            .querySelector(
                ".turbo-card"
            )
            .insertAdjacentHTML(
                "beforeend",
                `
                    <div class="notice">
                        ${escapeHTML(error.message)}
                    </div>
                `
            );

    }

});
