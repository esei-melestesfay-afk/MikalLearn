/* =========================================================
   MIKALLEARN - ORD V2
========================================================= */

window.WordTrainer = (() => {

    let words = [];
    let current = null;
    let currentMode = "listen";

    const SEEN_KEY = "mikal_word_seen_v2";
    const CURRENT_KEY = "mikal_word_current_v2";


    /* =====================================================
       HELPERS
    ===================================================== */

    function normalize(text) {

        return String(text || "")
            .toLowerCase()
            .trim()
            .replace(/\s+/g, " ");

    }


    function getSeen() {

        try {

            const data = JSON.parse(
                localStorage.getItem(SEEN_KEY) || "[]"
            );

            return Array.isArray(data)
                ? data
                : [];

        }

        catch {

            return [];

        }

    }


    function saveSeen(seen) {

        localStorage.setItem(
            SEEN_KEY,
            JSON.stringify(seen)
        );

    }


    function saveCurrent() {

        if (!current) {
            return;
        }

        localStorage.setItem(
            CURRENT_KEY,
            current.word
        );

    }


    function getSavedCurrent() {

        return localStorage.getItem(
            CURRENT_KEY
        );

    }


    /* =====================================================
       NYTT ORD UTAN ONÖDIG REPETITION
    ===================================================== */

    function chooseNewWord() {

        let seen = getSeen();


        if (
            seen.length >=
            words.length
        ) {

            seen = [];

            saveSeen(seen);

        }


        let available =
            words.filter(
                item =>
                    !seen.includes(
                        normalize(item.word)
                    )
            );


        if (!available.length) {

            seen = [];

            saveSeen(seen);

            available = [...words];

        }


        if (
            current &&
            available.length > 1
        ) {

            available =
                available.filter(
                    item =>
                        normalize(item.word)
                        !==
                        normalize(current.word)
                );

        }


        current =
            available[
                Math.floor(
                    Math.random() *
                    available.length
                )
            ];


        saveCurrent();

        renderAll();

    }


    function markCurrentSeen() {

        if (!current) {
            return;
        }


        let seen = getSeen();

        const word =
            normalize(current.word);


        if (!seen.includes(word)) {

            seen.push(word);

        }


        saveSeen(
            seen.slice(-2000)
        );

    }


    function nextWord() {

        markCurrentSeen();

        chooseNewWord();

    }


    /* =====================================================
       PROGRESS
    ===================================================== */

    function updateProgress() {

        const seen =
            getSeen();


        const text =
            seen.length +
            " av " +
            words.length +
            " ord";


        document
            .querySelectorAll(
                "[data-word-progress]"
            )
            .forEach(
                element =>
                    element.textContent =
                        text
            );


        const count =
            document.getElementById(
                "wordBankCount"
            );


        if (count) {

            count.textContent =
                words.length +
                " svenska ord";

        }

    }


    /* =====================================================
       SVENSK RÖST
    ===================================================== */

    function getSwedishVoice() {

        const voices =
            speechSynthesis
                .getVoices();


        return (
            voices.find(
                voice =>
                    String(voice.lang)
                        .toLowerCase()
                        .startsWith("sv")
            )
            ||
            voices[0]
        );

    }


    function speakWord(rate = 0.82) {

        if (!current) {
            return;
        }


        speechSynthesis.cancel();


        const speech =
            new SpeechSynthesisUtterance(
                current.word
            );


        speech.lang =
            "sv-SE";


        speech.rate =
            rate;


        const voice =
            getSwedishVoice();


        if (voice) {

            speech.voice =
                voice;

        }


        speechSynthesis.speak(
            speech
        );

    }


    /* =====================================================
       MODE
    ===================================================== */

    function setMode(mode, button) {

        currentMode = mode;


        document
            .querySelectorAll(
                ".word-mode-panel"
            )
            .forEach(
                panel =>
                    panel.classList.add(
                        "hidden"
                    )
            );


        const map = {

            listen:
                "wordListenMode",

            learn:
                "wordLearnMode",

            fill:
                "wordFillMode",

            own:
                "wordOwnMode"

        };


        const panel =
            document.getElementById(
                map[mode]
            );


        if (panel) {

            panel.classList.remove(
                "hidden"
            );

        }


        document
            .querySelectorAll(
                ".word-mode-button"
            )
            .forEach(
                item =>
                    item.classList.remove(
                        "active"
                    )
            );


        if (button) {

            button.classList.add(
                "active"
            );

        }


        renderAll();

    }


    /* =====================================================
       LYSSNA & SKRIV
    ===================================================== */

    function resetListen() {

        const answer =
            document.getElementById(
                "wordListenAnswer"
            );


        const result =
            document.getElementById(
                "wordListenResult"
            );


        if (answer) {

            answer.value = "";

        }


        if (result) {

            result.innerHTML = "";
            result.className =
                "word-v2-result";

        }


        document
            .getElementById(
                "wordListenRetry"
            )
            .disabled = true;


        document
            .getElementById(
                "wordListenNext"
            )
            .disabled = true;

    }


    function checkListen() {

        const answer =
            document.getElementById(
                "wordListenAnswer"
            );


        const result =
            document.getElementById(
                "wordListenResult"
            );


        if (
            !answer.value.trim()
        ) {

            result.className =
                "word-v2-result word-result-warning";


            result.innerHTML =
                "<strong>Skriv ordet f\u00f6rst.</strong>";

            return;

        }


        const correct =
            normalize(answer.value)
            ===
            normalize(current.word);


        if (correct) {

            result.className =
                "word-v2-result word-result-correct";


            result.innerHTML =
                "<strong>\u2705 R\u00e4tt!</strong>" +
                "<p>Du h\u00f6rde ordet r\u00e4tt.</p>" +
                "<div class=\"word-answer-box\">" +
                "<span>R\u00e4tt ord</span>" +
                "<strong>" +
                escapeHTML(current.word) +
                "</strong></div>";

        }

        else {

            result.className =
                "word-v2-result word-result-wrong";


            result.innerHTML =
                "<strong>\u274c Inte riktigt</strong>" +
                "<p>Lyssna igen och j\u00e4mf\u00f6r med det r\u00e4tta ordet.</p>" +
                "<div class=\"word-answer-box\">" +
                "<span>R\u00e4tt ord</span>" +
                "<strong>" +
                escapeHTML(current.word) +
                "</strong></div>";

        }


        document
            .getElementById(
                "wordListenRetry"
            )
            .disabled = false;


        document
            .getElementById(
                "wordListenNext"
            )
            .disabled = false;

    }


    function retryListen() {

        resetListen();

        speakWord();

        document
            .getElementById(
                "wordListenAnswer"
            )
            .focus();

    }


    /* =====================================================
       LÄR ORDET
    ===================================================== */

    function renderLearn() {

        if (!current) {
            return;
        }


        document
            .getElementById(
                "learnWord"
            )
            .textContent =
            current.word;


        document
            .getElementById(
                "learnMeaning"
            )
            .textContent =
            current.meaning
            || "Ingen betydelse sparad.";


        document
            .getElementById(
                "learnExample"
            )
            .textContent =
            current.example
            || "";

    }


    /* =====================================================
       FYLL I ORDET
    ===================================================== */

    function makeBlankSentence() {

        let example =
            String(
                current.example || ""
            );


        if (!example) {

            return "Skriv ordet som passar: ______";

        }


        const escaped =
            escapeRegExp(
                current.word
            );


        const regex =
            new RegExp(
                escaped,
                "i"
            );


        if (
            regex.test(example)
        ) {

            return example.replace(
                regex,
                "________"
            );

        }


        return (
            example +
            "  Vilket ord tr\u00e4nar vi?"
        );

    }


    function resetFill() {

        document
            .getElementById(
                "fillSentence"
            )
            .textContent =
            makeBlankSentence();


        document
            .getElementById(
                "fillMeaning"
            )
            .textContent =
            current.meaning || "";


        document
            .getElementById(
                "fillAnswer"
            )
            .value = "";


        const result =
            document.getElementById(
                "fillResult"
            );


        result.innerHTML = "";
        result.className =
            "word-v2-result";


        document
            .getElementById(
                "fillNext"
            )
            .disabled = true;

    }


    function checkFill() {

        const answer =
            document.getElementById(
                "fillAnswer"
            );


        const result =
            document.getElementById(
                "fillResult"
            );


        if (
            !answer.value.trim()
        ) {

            result.className =
                "word-v2-result word-result-warning";


            result.innerHTML =
                "<strong>Skriv ett ord f\u00f6rst.</strong>";

            return;

        }


        const correct =
            normalize(answer.value)
            ===
            normalize(current.word);


        result.className =
            correct
            ? "word-v2-result word-result-correct"
            : "word-v2-result word-result-wrong";


        result.innerHTML =
            (
                correct
                ? "<strong>\u2705 R\u00e4tt!</strong>"
                : "<strong>\u274c Inte riktigt</strong>"
            )
            +
            "<div class=\"word-answer-box\">" +
            "<span>R\u00e4tt ord</span>" +
            "<strong>" +
            escapeHTML(current.word) +
            "</strong></div>" +
            "<p>" +
            escapeHTML(
                current.example || ""
            ) +
            "</p>";


        document
            .getElementById(
                "fillNext"
            )
            .disabled = false;

    }


    /* =====================================================
       EGEN MENING
    ===================================================== */

    function resetOwn() {

        document
            .getElementById(
                "ownWord"
            )
            .textContent =
            current.word;


        document
            .getElementById(
                "ownMeaning"
            )
            .textContent =
            current.meaning || "";


        document
            .getElementById(
                "ownSentence"
            )
            .value = "";


        const result =
            document.getElementById(
                "ownResult"
            );


        result.innerHTML = "";
        result.className =
            "word-v2-result";


        document
            .getElementById(
                "ownNext"
            )
            .disabled = true;

    }


    function checkOwn() {

        const answer =
            document.getElementById(
                "ownSentence"
            );


        const result =
            document.getElementById(
                "ownResult"
            );


        const text =
            normalize(
                answer.value
            );


        if (
            text.length < 8
        ) {

            result.className =
                "word-v2-result word-result-warning";


            result.innerHTML =
                "<strong>Skriv en hel mening f\u00f6rst.</strong>";

            return;

        }


        const word =
            normalize(
                current.word
            );


        const containsWord =
            text
                .split(/[\s.,!?;:]+/)
                .includes(word);


        if (containsWord) {

            result.className =
                "word-v2-result word-result-correct";


            result.innerHTML =
                "<strong>\u2705 Bra!</strong>" +
                "<p>Du anv\u00e4nde ordet i en egen mening.</p>" +
                "<div class=\"word-answer-box\">" +
                "<span>Exempel fr\u00e5n ordbanken</span>" +
                "<strong>" +
                escapeHTML(
                    current.example || ""
                ) +
                "</strong></div>";


            document
                .getElementById(
                    "ownNext"
                )
                .disabled = false;

        }

        else {

            result.className =
                "word-v2-result word-result-wrong";


            result.innerHTML =
                "<strong>\u274c Anv\u00e4nd sj\u00e4lva ordet</strong>" +
                "<p>Din mening ska inneh\u00e5lla ordet <strong>" +
                escapeHTML(current.word) +
                "</strong>.</p>";

        }

    }


    /* =====================================================
       RENDER ALLT
    ===================================================== */

    function renderAll() {

        if (!current) {
            return;
        }


        updateProgress();

        resetListen();

        renderLearn();

        resetFill();

        resetOwn();

    }


    /* =====================================================
       SECURITY
    ===================================================== */

    function escapeHTML(text) {

        const div =
            document.createElement(
                "div"
            );


        div.textContent =
            String(text || "");


        return div.innerHTML;

    }


    function escapeRegExp(text) {

        return String(text)
            .replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

    }


    /* =====================================================
       LOAD WORD BANK
    ===================================================== */

    async function loadWords() {

        try {

            const response =
                await fetch(
                    "/static/words.json?v=" +
                    Date.now()
                );


            if (!response.ok) {

                throw new Error(
                    "words.json kunde inte laddas"
                );

            }


            const data =
                await response.json();


            words =
                data.filter(
                    item =>
                        item &&
                        typeof item.word
                        === "string" &&
                        item.word.trim()
                );


            if (!words.length) {

                throw new Error(
                    "Ordbanken \u00e4r tom"
                );

            }


            const saved =
                getSavedCurrent();


            if (saved) {

                current =
                    words.find(
                        item =>
                            normalize(item.word)
                            ===
                            normalize(saved)
                    )
                    || null;

            }


            if (!current) {

                chooseNewWord();

            }

            else {

                renderAll();

            }

        }

        catch (error) {

            console.error(error);


            document.body.insertAdjacentHTML(
                "beforeend",
                "<div class=\"word-load-error\">" +
                "<strong>Ordbanken kunde inte laddas.</strong>" +
                "<span>Kontrollera att static/words.json finns.</span>" +
                "</div>"
            );

        }

    }


    /* =====================================================
       EVENTS
    ===================================================== */

    function connectEvents() {

        document
            .querySelectorAll(
                ".word-mode-button"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () =>
                            setMode(
                                button.dataset
                                    .wordMode,
                                button
                            )
                    );

                }
            );


        document
            .getElementById(
                "wordPlay"
            )
            .addEventListener(
                "click",
                () =>
                    speakWord(0.82)
            );


        document
            .getElementById(
                "wordPlaySlow"
            )
            .addEventListener(
                "click",
                () =>
                    speakWord(0.63)
            );


        document
            .getElementById(
                "wordListenCheck"
            )
            .addEventListener(
                "click",
                checkListen
            );


        document
            .getElementById(
                "wordListenRetry"
            )
            .addEventListener(
                "click",
                retryListen
            );


        document
            .getElementById(
                "wordListenNext"
            )
            .addEventListener(
                "click",
                nextWord
            );


        document
            .getElementById(
                "learnSpeak"
            )
            .addEventListener(
                "click",
                () =>
                    speakWord(0.82)
            );


        document
            .getElementById(
                "learnNext"
            )
            .addEventListener(
                "click",
                nextWord
            );


        document
            .getElementById(
                "fillCheck"
            )
            .addEventListener(
                "click",
                checkFill
            );


        document
            .getElementById(
                "fillNext"
            )
            .addEventListener(
                "click",
                nextWord
            );


        document
            .getElementById(
                "ownCheck"
            )
            .addEventListener(
                "click",
                checkOwn
            );


        document
            .getElementById(
                "ownNext"
            )
            .addEventListener(
                "click",
                nextWord
            );


        document
            .getElementById(
                "wordListenAnswer"
            )
            .addEventListener(
                "keydown",
                event => {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        checkListen();

                    }

                }
            );


        document
            .getElementById(
                "fillAnswer"
            )
            .addEventListener(
                "keydown",
                event => {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        checkFill();

                    }

                }
            );

    }


    function init() {

        connectEvents();

        loadWords();

    }


    return {
        init,
        setMode,
        nextWord
    };

})();


document.addEventListener(
    "DOMContentLoaded",
    WordTrainer.init
);
