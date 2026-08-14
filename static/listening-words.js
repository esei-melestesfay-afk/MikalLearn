/* =========================================================
   MIKALLEARN - LYSSNA PÅ VIKTIGA ORD
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        if (
            window.location.pathname !==
            "/lyssna"
        ) {
            return;
        }


        const sentencePanel =
            document.querySelector(
                ".listening-panel"
            );


        if (!sentencePanel) {
            return;
        }


        /* =================================================
           SKAPA VÄLJARE
        ================================================= */

        const switcher =
            document.createElement(
                "div"
            );


        switcher.className =
            "listen-mode-switch-v2";


        switcher.innerHTML = `

            <button
                type="button"
                class="listen-mode-choice active"
                data-listen-choice="sentences">

                <span class="listen-choice-icon">
                    🎧
                </span>

                <span>
                    <strong>Meningar</strong>
                    <small>Lyssna och skriv hela meningar</small>
                </span>

            </button>


            <button
                type="button"
                class="listen-mode-choice"
                data-listen-choice="words">

                <span class="listen-choice-icon">
                    🔤
                </span>

                <span>
                    <strong>Viktiga ord</strong>
                    <small>Träna stavning på vanliga svenska ord</small>
                </span>

            </button>

        `;


        sentencePanel.parentNode.insertBefore(
            switcher,
            sentencePanel
        );



        /* =================================================
           ORD-PANEL
        ================================================= */

        const wordPanel =
            document.createElement(
                "section"
            );


        wordPanel.className =
            "practice-panel word-listening-panel-v2 hidden";


        wordPanel.innerHTML = `

            <div class="word-listen-top-v2">

                <div>

                    <p class="practice-label">
                        VIKTIGA SVENSKA ORD
                    </p>

                    <h2>
                        Vilket ord hör du?
                    </h2>

                    <p class="help-text">
                        Lyssna på ordet och skriv exakt hur det stavas.
                    </p>

                </div>


                <span
                    class="word-listen-progress-v2"
                    id="wordListenProgressV2">

                    Laddar...

                </span>

            </div>


            <div class="word-hear-box-v2">

                <div class="word-hear-icon-v2">
                    🔤
                </div>

                <div>

                    <strong>
                        Lyssna noggrant
                    </strong>

                    <p>
                        Ordet visas först när du har kontrollerat.
                    </p>

                </div>


                <div class="word-hear-buttons-v2">

                    <button
                        type="button"
                        id="commonWordPlay">

                        ▶ Spela upp

                    </button>


                    <button
                        type="button"
                        id="commonWordSlow">

                        🐢 Långsammare

                    </button>

                </div>

            </div>


            <label class="word-listen-label-v2">
                SKRIV ORDET
            </label>


            <input
                type="text"
                id="commonWordAnswer"
                class="word-listen-input-v2"
                placeholder="Skriv ordet här..."
                autocomplete="off"
                autocapitalize="none"
                spellcheck="false">


            <div class="word-listen-actions-v2">

                <button
                    type="button"
                    class="check-button"
                    id="commonWordCheck">

                    Kontrollera

                </button>


                <div>

                    <button
                        type="button"
                        class="word-listen-secondary-v2"
                        id="commonWordRetry"
                        disabled>

                        ↻ Gör om

                    </button>


                    <button
                        type="button"
                        class="word-listen-next-v2"
                        id="commonWordNext"
                        disabled>

                        Nästa ord →

                    </button>

                </div>

            </div>


            <div
                class="word-listen-result-v2"
                id="commonWordResult">
            </div>


            <div class="word-learning-note-v2">

                <strong>💡 Smart repetition</strong>

                <span>
                    Ord som blir fel kommer tillbaka senare
                    så att stavningen fastnar.
                </span>

            </div>

        `;


        sentencePanel.insertAdjacentElement(
            "afterend",
            wordPanel
        );



        /* =================================================
           CSS
        ================================================= */

        const style =
            document.createElement(
                "style"
            );


        style.textContent = `

            .listen-mode-switch-v2 {
                display: grid;
                grid-template-columns: 1fr 1fr;

                gap: 10px;

                margin-top: 25px;
                margin-bottom: 19px;
            }


            .listen-mode-choice {
                display: flex;
                align-items: center;

                gap: 12px;

                width: 100%;

                margin: 0;
                padding: 15px 17px;

                color: #454956;
                background: rgba(255,255,255,.8);

                border: 1px solid #e7e7ef;
                border-radius: 16px;

                box-shadow:
                    0 8px 22px
                    rgba(31,38,68,.05);

                text-align: left;
            }


            .listen-mode-choice.active {
                color: #5152d6;

                background:
                    linear-gradient(
                        135deg,
                        #eeeeff,
                        #f8f8ff
                    );

                border-color:
                    rgba(91,92,240,.27);
            }


            .listen-choice-icon {
                display: flex;
                align-items: center;
                justify-content: center;

                width: 39px;
                height: 39px;

                flex-shrink: 0;

                background: white;

                border-radius: 11px;

                font-size: 18px;
            }


            .listen-mode-choice > span:last-child {
                display: flex;
                flex-direction: column;

                gap: 2px;
            }


            .listen-mode-choice strong {
                font-size: 12px;
            }


            .listen-mode-choice small {
                color: #8b909d;

                font-size: 9px;
            }


            .word-listening-panel-v2 {
                margin-top: 0;
            }


            .word-listen-top-v2 {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;

                gap: 20px;
            }


            .word-listen-progress-v2 {
                flex-shrink: 0;

                padding: 7px 10px;

                color: #5556d8;
                background: #eeeeff;

                border-radius: 9px;

                font-size: 9px;
                font-weight: 900;
            }


            .word-hear-box-v2 {
                display: flex;
                align-items: center;

                gap: 14px;

                margin-top: 23px;
                padding: 19px;

                background: #f7f7fc;

                border: 1px solid #e8e8f0;
                border-radius: 17px;
            }


            .word-hear-icon-v2 {
                display: flex;
                align-items: center;
                justify-content: center;

                width: 48px;
                height: 48px;

                flex-shrink: 0;

                background: #ececff;

                border-radius: 14px;

                font-size: 22px;
            }


            .word-hear-box-v2 > div:nth-child(2) {
                flex: 1;
            }


            .word-hear-box-v2 strong {
                font-size: 13px;
            }


            .word-hear-box-v2 p {
                margin: 3px 0 0;

                color: #858a98;

                font-size: 10px;
            }


            .word-hear-buttons-v2 {
                display: flex;

                gap: 7px;
            }


            .word-hear-buttons-v2 button {
                margin: 0;

                color: #444854;
                background: white;

                border: 1px solid #dedee8;

                box-shadow:
                    0 5px 15px
                    rgba(31,38,68,.05);
            }


            .word-listen-label-v2 {
                display: block;

                margin-top: 24px;

                color: #838896;

                font-size: 9px;
                font-weight: 900;

                letter-spacing: .8px;
            }


            .word-listen-input-v2 {
                width: 100%;

                margin-top: 8px;
                padding: 17px 18px;

                font-family: inherit;
                font-size: 19px;
                font-weight: 650;

                color: #292c37;
                background: white;

                border: 2px solid transparent;
                border-radius: 14px;

                outline: none;

                box-shadow:
                    0 7px 22px
                    rgba(31,38,68,.06);
            }


            .word-listen-input-v2:focus {
                border-color:
                    rgba(91,92,240,.42);

                box-shadow:
                    0 0 0 4px
                    rgba(91,92,240,.07);
            }


            .word-listen-actions-v2 {
                display: flex;
                align-items: center;
                justify-content: space-between;

                gap: 12px;

                margin-top: 16px;
            }


            .word-listen-actions-v2 button {
                margin: 0;
            }


            .word-listen-actions-v2 > div {
                display: flex;

                gap: 7px;
            }


            .word-listen-secondary-v2 {
                color: #444854;
                background: white;

                border: 1px solid #dedee8;
            }


            .word-listen-next-v2 {
                color: white;
                background: #191b25;

                border-color: #191b25;
            }


            .word-listen-actions-v2 button:disabled {
                opacity: .35;

                cursor: not-allowed;

                transform: none;
            }


            .word-listen-result-v2 {
                margin-top: 17px;
            }


            .word-listen-result-v2:empty {
                display: none;
            }


            .word-listen-correct-v2,
            .word-listen-wrong-v2,
            .word-listen-warning-v2 {
                padding: 17px;

                border-radius: 15px;

                font-size: 12px;
                line-height: 1.55;
            }


            .word-listen-correct-v2 {
                color: #17653a;
                background: #eaf8ef;

                border: 1px solid #c9ecd6;
            }


            .word-listen-wrong-v2 {
                color: #743d34;
                background: #fff2ef;

                border: 1px solid #f1cdc6;
            }


            .word-listen-warning-v2 {
                color: #735613;
                background: #fff8e7;

                border: 1px solid #f1dfad;
            }


            .word-answer-display-v2 {
                display: flex;
                flex-direction: column;

                gap: 4px;

                margin-top: 12px;
                padding: 13px 14px;

                color: #292c37;
                background: rgba(255,255,255,.76);

                border-radius: 11px;
            }


            .word-answer-display-v2 span {
                color: #858a98;

                font-size: 9px;
                font-weight: 800;

                letter-spacing: .5px;
            }


            .word-answer-display-v2 strong {
                font-size: 22px;
            }


            .word-spelling-v2 {
                margin-top: 7px;

                color: #666b78;

                font-size: 10px;

                letter-spacing: 1px;
            }


            .word-learning-note-v2 {
                display: flex;
                flex-direction: column;

                gap: 3px;

                margin-top: 22px;
                padding: 13px 15px;

                background: #f5f5fa;

                border-radius: 12px;
            }


            .word-learning-note-v2 strong {
                font-size: 10px;
            }


            .word-learning-note-v2 span {
                color: #858a98;

                font-size: 9px;
            }


            @media (max-width: 700px) {

                .listen-mode-switch-v2 {
                    grid-template-columns: 1fr;
                }


                .word-hear-box-v2 {
                    align-items: flex-start;
                    flex-direction: column;
                }


                .word-hear-buttons-v2 {
                    width: 100%;
                }


                .word-hear-buttons-v2 button {
                    flex: 1;
                }


                .word-listen-actions-v2 {
                    align-items: stretch;
                    flex-direction: column;
                }


                .word-listen-actions-v2 > div {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                }

            }

        `;


        document.head.appendChild(
            style
        );



        /* =================================================
           DATA
        ================================================= */

        let words = [];

        let currentIndex =
            -1;

        let currentAudio =
            null;


        const SEEN_KEY =
            "mikal_listening_words_seen_v2";


        const WEAK_KEY =
            "mikal_listening_words_weak_v2";


        const COUNT_KEY =
            "mikal_listening_words_count_v2";


        const MODE_KEY =
            "mikal_listening_mode_v2";



        function normalize(text) {

            return String(text || "")
                .trim()
                .toLowerCase();

        }



        function getStorageArray(key) {

            try {

                const data =
                    JSON.parse(
                        localStorage.getItem(
                            key
                        )
                        || "[]"
                    );


                return Array.isArray(data)
                    ? data
                    : [];

            }

            catch {

                return [];

            }

        }



        function saveStorageArray(
            key,
            array
        ) {

            localStorage.setItem(
                key,
                JSON.stringify(array)
            );

        }



        /* =================================================
           MODE
        ================================================= */

        function showMode(mode) {

            localStorage.setItem(
                MODE_KEY,
                mode
            );


            document
                .querySelectorAll(
                    ".listen-mode-choice"
                )
                .forEach(
                    button => {

                        button.classList.toggle(
                            "active",
                            button.dataset
                                .listenChoice
                            === mode
                        );

                    }
                );


            if (
                mode ===
                "words"
            ) {

                sentencePanel.classList.add(
                    "hidden"
                );


                wordPanel.classList.remove(
                    "hidden"
                );


                setTimeout(
                    () => {

                        document
                            .getElementById(
                                "commonWordAnswer"
                            )
                            .focus();

                    },
                    100
                );

            }

            else {

                wordPanel.classList.add(
                    "hidden"
                );


                sentencePanel.classList.remove(
                    "hidden"
                );

            }

        }



        document
            .querySelectorAll(
                ".listen-mode-choice"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            showMode(
                                button.dataset
                                    .listenChoice
                            );

                        }
                    );

                }
            );



        /* =================================================
           LOAD WORDS
        ================================================= */

        try {

            const response =
                await fetch(
                    "/static/listening_words.json?v=2"
                );


            if (!response.ok) {

                throw new Error(
                    "Ordbanken kunde inte laddas."
                );

            }


            words =
                await response.json();


        }

        catch (error) {

            console.error(error);


            document
                .getElementById(
                    "commonWordResult"
                )
                .innerHTML =
                "<div class='word-listen-warning-v2'>" +
                "Ordbanken kunde inte laddas." +
                "</div>";


            return;

        }



        /* =================================================
           PROGRESS
        ================================================= */

        function updateProgress() {

            const seen =
                getStorageArray(
                    SEEN_KEY
                );


            document
                .getElementById(
                    "wordListenProgressV2"
                )
                .textContent =
                seen.length
                +
                " av "
                +
                words.length
                +
                " ord";

        }



        /* =================================================
           WEAK WORDS
        ================================================= */

        function addWeak(index) {

            let weak =
                getStorageArray(
                    WEAK_KEY
                );


            if (
                !weak.includes(
                    index
                )
            ) {

                weak.push(
                    index
                );

            }


            saveStorageArray(
                WEAK_KEY,
                weak
            );

        }



        function removeWeak(index) {

            let weak =
                getStorageArray(
                    WEAK_KEY
                );


            weak =
                weak.filter(
                    item =>
                        item !== index
                );


            saveStorageArray(
                WEAK_KEY,
                weak
            );

        }



        /* =================================================
           CHOOSE WORD
        ================================================= */

        function chooseNewWord() {

            let seen =
                getStorageArray(
                    SEEN_KEY
                );


            let weak =
                getStorageArray(
                    WEAK_KEY
                ).filter(
                    index =>
                        index >= 0
                        &&
                        index < words.length
                );


            let count =
                Number(
                    localStorage.getItem(
                        COUNT_KEY
                    )
                    || 0
                );


            /*
               Var sjätte ord:
               träna ett tidigare fel ord igen.
            */

            const practiceWeak =
                weak.length > 0
                &&
                count > 0
                &&
                count % 6 === 0;



            if (
                practiceWeak
            ) {

                const availableWeak =
                    weak.filter(
                        index =>
                            index !==
                            currentIndex
                    );


                if (
                    availableWeak.length
                ) {

                    currentIndex =
                        availableWeak[
                            Math.floor(
                                Math.random()
                                *
                                availableWeak.length
                            )
                        ];


                    resetWord();

                    return;

                }

            }



            if (
                seen.length >=
                words.length
            ) {

                seen = [];

                saveStorageArray(
                    SEEN_KEY,
                    seen
                );

            }



            const available =
                words
                    .map(
                        (_, index) =>
                            index
                    )
                    .filter(
                        index =>
                            !seen.includes(
                                index
                            )
                            &&
                            index !==
                            currentIndex
                    );



            currentIndex =
                available[
                    Math.floor(
                        Math.random()
                        *
                        available.length
                    )
                ];



            if (
                !seen.includes(
                    currentIndex
                )
            ) {

                seen.push(
                    currentIndex
                );

            }


            saveStorageArray(
                SEEN_KEY,
                seen
            );


            updateProgress();

            resetWord();

        }



        /* =================================================
           AUDIO
        ================================================= */

        function playWord(
            slow = false
        ) {

            if (
                currentIndex < 0
            ) {
                return;
            }


            if (
                currentAudio
            ) {

                currentAudio.pause();

                currentAudio.currentTime =
                    0;

            }


            const item =
                words[
                    currentIndex
                ];


            const audio =
                new Audio(
                    "/static/audio/listening_words/"
                    +
                    item.file
                );


            audio.volume =
                1;


            audio.playbackRate =
                slow
                    ? 0.80
                    : 1;


            try {

                audio.preservesPitch =
                    true;

            }

            catch {
            }


            try {

                audio.webkitPreservesPitch =
                    true;

            }

            catch {
            }


            currentAudio =
                audio;


            audio.play()
                .catch(
                    error => {

                        console.error(
                            error
                        );

                    }
                );

        }



        /* =================================================
           RESET
        ================================================= */

        function resetWord() {

            document
                .getElementById(
                    "commonWordAnswer"
                )
                .value =
                "";


            const result =
                document.getElementById(
                    "commonWordResult"
                );


            result.innerHTML =
                "";


            document
                .getElementById(
                    "commonWordRetry"
                )
                .disabled =
                true;


            document
                .getElementById(
                    "commonWordNext"
                )
                .disabled =
                true;


            document
                .getElementById(
                    "commonWordAnswer"
                )
                .focus();

        }



        /* =================================================
           CHECK
        ================================================= */

        function checkWord() {

            const input =
                document.getElementById(
                    "commonWordAnswer"
                );


            const result =
                document.getElementById(
                    "commonWordResult"
                );


            const answer =
                normalize(
                    input.value
                );


            if (!answer) {

                result.innerHTML =
                    "<div class='word-listen-warning-v2'>" +
                    "<strong>Skriv ordet först.</strong>" +
                    "</div>";


                return;

            }


            const item =
                words[
                    currentIndex
                ];


            const correctWord =
                normalize(
                    item.word
                );


            const correct =
                answer ===
                correctWord;



            if (correct) {

                removeWeak(
                    currentIndex
                );


                result.innerHTML = `

                    <div class="word-listen-correct-v2">

                        <strong>
                            ✅ Rätt!
                        </strong>

                        <p>
                            Bra, du stavade ordet rätt.
                        </p>

                        <div class="word-answer-display-v2">

                            <span>
                                RÄTT ORD
                            </span>

                            <strong>
                                ${escapeHTML(item.word)}
                            </strong>

                            <div class="word-spelling-v2">
                                ${spellWord(item.word)}
                            </div>

                        </div>

                    </div>

                `;

            }

            else {

                addWeak(
                    currentIndex
                );


                result.innerHTML = `

                    <div class="word-listen-wrong-v2">

                        <strong>
                            ❌ Inte riktigt
                        </strong>

                        <p>
                            Titta på stavningen och försök igen.
                            Ordet kommer också tillbaka senare.
                        </p>

                        <div class="word-answer-display-v2">

                            <span>
                                RÄTT STAVNING
                            </span>

                            <strong>
                                ${escapeHTML(item.word)}
                            </strong>

                            <div class="word-spelling-v2">
                                ${spellWord(item.word)}
                            </div>

                        </div>

                    </div>

                `;

            }



            document
                .getElementById(
                    "commonWordRetry"
                )
                .disabled =
                false;


            document
                .getElementById(
                    "commonWordNext"
                )
                .disabled =
                false;


            if (
                window.MikalLearn
                &&
                typeof window.MikalLearn
                    .recordAttempt
                === "function"
            ) {

                window.MikalLearn
                    .recordAttempt(
                        "lyssna",
                        "viktiga_ord",
                        correct
                            ? 100
                            : 0,
                        {
                            word:
                                item.word
                        }
                    );

            }

        }



        /* =================================================
           NEXT
        ================================================= */

        function nextWord() {

            let count =
                Number(
                    localStorage.getItem(
                        COUNT_KEY
                    )
                    || 0
                );


            count++;


            localStorage.setItem(
                COUNT_KEY,
                count
            );


            chooseNewWord();

        }



        /* =================================================
           RETRY
        ================================================= */

        function retryWord() {

            resetWord();

            playWord(
                false
            );

        }



        /* =================================================
           SAFE HTML
        ================================================= */

        function escapeHTML(text) {

            const div =
                document.createElement(
                    "div"
                );


            div.textContent =
                String(text || "");


            return div.innerHTML;

        }



        function spellWord(word) {

            return Array
                .from(word)
                .map(
                    letter =>
                        escapeHTML(
                            letter
                        )
                )
                .join(
                    " · "
                );

        }



        /* =================================================
           EVENTS
        ================================================= */

        document
            .getElementById(
                "commonWordPlay"
            )
            .addEventListener(
                "click",
                () =>
                    playWord(false)
            );


        document
            .getElementById(
                "commonWordSlow"
            )
            .addEventListener(
                "click",
                () =>
                    playWord(true)
            );


        document
            .getElementById(
                "commonWordCheck"
            )
            .addEventListener(
                "click",
                checkWord
            );


        document
            .getElementById(
                "commonWordRetry"
            )
            .addEventListener(
                "click",
                retryWord
            );


        document
            .getElementById(
                "commonWordNext"
            )
            .addEventListener(
                "click",
                nextWord
            );


        document
            .getElementById(
                "commonWordAnswer"
            )
            .addEventListener(
                "keydown",
                event => {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        checkWord();

                    }

                }
            );



        /* =================================================
           START
        ================================================= */

        chooseNewWord();


        const savedMode =
            localStorage.getItem(
                MODE_KEY
            )
            || "sentences";


        showMode(
            savedMode
        );

    }
);
