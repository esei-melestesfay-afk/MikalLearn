from pathlib import Path

path = Path("static/listening-words.js")

if not path.exists():
    raise SystemExit("❌ static/listening-words.js hittades inte")

text = path.read_text(encoding="utf-8")

start_marker = """        /* =================================================
           DATA
        ================================================= */"""

end_marker = """        /* =================================================
           SAFE HTML
        ================================================= */"""

start = text.find(start_marker)
end = text.find(end_marker)

if start == -1 or end == -1:
    raise SystemExit(
        "❌ Kunde inte hitta rätt del i listening-words.js. "
        "Ingen fil ändrades."
    )

new_logic = r'''        /* =================================================
           DATA + SMART INLÄRNING V4
        ================================================= */

        let words = [];

        let currentIndex = -1;

        let currentAudio = null;

        /*
            Viktigt:
            Ett ord måste bli rätt 4 gånger
            på OLIKA visningar för att räknas
            som behärskat.
        */

        const REQUIRED_CORRECT = 4;


        const SEEN_KEY =
            "mikal_listening_words_seen_v4";

        const REVIEW_KEY =
            "mikal_listening_words_review_v4";

        const MASTERY_KEY =
            "mikal_listening_words_mastery_v4";

        const COUNT_KEY =
            "mikal_listening_words_count_v4";

        const MODE_KEY =
            "mikal_listening_mode_v2";


        /*
            Hindrar att "Gör om" räknas som
            en ny repetition av samma ord.
        */

        let countedThisRound = false;



        function normalize(text) {

            return String(text || "")
                .trim()
                .toLowerCase();

        }



        function getStorageArray(key) {

            try {

                const data =
                    JSON.parse(
                        localStorage.getItem(key)
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



        function getMastery() {

            try {

                const data =
                    JSON.parse(
                        localStorage.getItem(
                            MASTERY_KEY
                        )
                        || "{}"
                    );


                if (
                    data
                    &&
                    typeof data === "object"
                    &&
                    !Array.isArray(data)
                ) {

                    return data;

                }

            }

            catch {
            }


            return {};

        }



        function saveMastery(data) {

            localStorage.setItem(
                MASTERY_KEY,
                JSON.stringify(data)
            );

        }



        function getWordKey(index) {

            if (
                index < 0
                ||
                !words[index]
            ) {

                return "";

            }


            return normalize(
                words[index].word
            );

        }



        function getStreak(index) {

            const key =
                getWordKey(index);


            if (!key) {

                return 0;

            }


            const mastery =
                getMastery();


            return Math.min(
                REQUIRED_CORRECT,
                Number(
                    mastery[key]
                    || 0
                )
            );

        }



        function isMastered(index) {

            return (
                getStreak(index)
                >= REQUIRED_CORRECT
            );

        }



        function setStreak(
            index,
            value
        ) {

            const key =
                getWordKey(index);


            if (!key) {

                return;

            }


            const mastery =
                getMastery();


            mastery[key] =
                Math.max(
                    0,
                    Math.min(
                        REQUIRED_CORRECT,
                        value
                    )
                );


            saveMastery(
                mastery
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
                    "/static/listening_words.json?v=4"
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


            const mastery =
                getMastery();


            let mastered =
                0;


            words.forEach(
                item => {

                    const key =
                        normalize(
                            item.word
                        );


                    if (
                        Number(
                            mastery[key]
                            || 0
                        )
                        >= REQUIRED_CORRECT
                    ) {

                        mastered++;

                    }

                }
            );


            document
                .getElementById(
                    "wordListenProgressV2"
                )
                .textContent =
                mastered
                +
                " behärskade • "
                +
                seen.length
                +
                "/"
                +
                words.length
                +
                " tränade";

        }



        /* =================================================
           REPETITIONSLISTA
        ================================================= */

        function getReviewWords() {

            return getStorageArray(
                REVIEW_KEY
            )
            .filter(
                index =>
                    index >= 0
                    &&
                    index < words.length
                    &&
                    !isMastered(index)
            );

        }



        function addReview(index) {

            let review =
                getReviewWords();


            if (
                !review.includes(index)
            ) {

                review.push(index);

            }


            saveStorageArray(
                REVIEW_KEY,
                review
            );

        }



        function removeReview(index) {

            let review =
                getStorageArray(
                    REVIEW_KEY
                );


            review =
                review.filter(
                    item =>
                        item !== index
                );


            saveStorageArray(
                REVIEW_KEY,
                review
            );

        }



        /* =================================================
           VÄLJ NÄSTA ORD
        ================================================= */

        function chooseNewWord() {

            let seen =
                getStorageArray(
                    SEEN_KEY
                );


            let review =
                getReviewWords();


            const count =
                Number(
                    localStorage.getItem(
                        COUNT_KEY
                    )
                    || 0
                );


            /*
                Var tredje övning försöker vi
                ta tillbaka ett ord som ännu
                inte är behärskat.
            */

            const reviewNow =
                review.length > 0
                &&
                count > 0
                &&
                count % 3 === 0;


            if (reviewNow) {

                const candidates =
                    review.filter(
                        index =>
                            index !== currentIndex
                    );


                if (
                    candidates.length > 0
                ) {

                    currentIndex =
                        candidates[
                            Math.floor(
                                Math.random()
                                *
                                candidates.length
                            )
                        ];


                    startNewRound();

                    return;

                }

            }



            /*
                Först prioriteras helt nya ord.
            */

            const newWords =
                words
                    .map(
                        (_, index) =>
                            index
                    )
                    .filter(
                        index =>
                            !seen.includes(index)
                            &&
                            index !== currentIndex
                    );


            if (
                newWords.length > 0
            ) {

                currentIndex =
                    newWords[
                        Math.floor(
                            Math.random()
                            *
                            newWords.length
                        )
                    ];


                seen.push(
                    currentIndex
                );


                saveStorageArray(
                    SEEN_KEY,
                    seen
                );


                startNewRound();

                return;

            }



            /*
                När alla ord har visats minst
                en gång prioriterar vi ord som
                ännu inte har 4/4.
            */

            const learning =
                words
                    .map(
                        (_, index) =>
                            index
                    )
                    .filter(
                        index =>
                            !isMastered(index)
                            &&
                            index !== currentIndex
                    );


            if (
                learning.length > 0
            ) {

                currentIndex =
                    learning[
                        Math.floor(
                            Math.random()
                            *
                            learning.length
                        )
                    ];


                addReview(
                    currentIndex
                );


                startNewRound();

                return;

            }



            /*
                Om ALLA ord är behärskade kan
                vi fortfarande repetera ibland.
            */

            const all =
                words
                    .map(
                        (_, index) =>
                            index
                    )
                    .filter(
                        index =>
                            index !== currentIndex
                    );


            if (
                all.length > 0
            ) {

                currentIndex =
                    all[
                        Math.floor(
                            Math.random()
                            *
                            all.length
                        )
                    ];

            }

            else {

                currentIndex = 0;

            }


            startNewRound();

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
           NY OMGÅNG
        ================================================= */

        function clearExercise() {

            document
                .getElementById(
                    "commonWordAnswer"
                )
                .value =
                "";


            document
                .getElementById(
                    "commonWordResult"
                )
                .innerHTML =
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



        function startNewRound() {

            /*
                Ny visning av ordet =
                nästa svar får räknas.
            */

            countedThisRound =
                false;


            clearExercise();

            updateProgress();

        }



        /* =================================================
           KONTROLLERA
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
                answer === correctWord;


            /*
                Endast FÖRSTA svaret på denna
                visning påverkar 4/4-systemet.

                "Gör om" räknas alltså INTE
                som en ny repetition.
            */

            const countsForMastery =
                !countedThisRound;


            if (
                countsForMastery
            ) {

                countedThisRound =
                    true;


                if (correct) {

                    const oldStreak =
                        getStreak(
                            currentIndex
                        );


                    const newStreak =
                        Math.min(
                            REQUIRED_CORRECT,
                            oldStreak + 1
                        );


                    setStreak(
                        currentIndex,
                        newStreak
                    );


                    if (
                        newStreak
                        >= REQUIRED_CORRECT
                    ) {

                        removeReview(
                            currentIndex
                        );

                    }

                    else {

                        /*
                            Även rätt ord måste
                            komma tillbaka tills
                            det har blivit 4/4.
                        */

                        addReview(
                            currentIndex
                        );

                    }

                }

                else {

                    /*
                        Ett fel betyder att hon
                        ännu inte kan ordet säkert.

                        3/4 + fel = tillbaka till 0/4.
                    */

                    setStreak(
                        currentIndex,
                        0
                    );


                    addReview(
                        currentIndex
                    );

                }

            }


            const streak =
                getStreak(
                    currentIndex
                );


            if (correct) {

                if (
                    streak >=
                    REQUIRED_CORRECT
                ) {

                    result.innerHTML = `

                        <div class="word-listen-correct-v2">

                            <strong>
                                🏆 Behärskat!
                            </strong>

                            <p>
                                Du har nu stavat ordet rätt
                                ${REQUIRED_CORRECT} gånger på olika tillfällen.
                            </p>

                            <div class="word-answer-display-v2">

                                <span>
                                    BEHÄRSKAT ORD
                                </span>

                                <strong>
                                    ${escapeHTML(item.word)}
                                </strong>

                                <div class="word-spelling-v2">
                                    ${spellWord(item.word)}
                                </div>

                            </div>

                            <p>
                                ✅ ${REQUIRED_CORRECT}/${REQUIRED_CORRECT} rätt
                            </p>

                        </div>

                    `;

                }

                else {

                    const extraText =
                        countsForMastery
                            ? "Bra! Ordet kommer tillbaka senare så att vi vet att stavningen verkligen sitter."
                            : "Bra! Men detta var samma omgång. Nästa gång ordet kommer tillbaka kan du höja din nivå igen.";


                    result.innerHTML = `

                        <div class="word-listen-correct-v2">

                            <strong>
                                ✅ Rätt!
                            </strong>

                            <p>
                                ${extraText}
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

                            <p>
                                🧠 ${streak}/${REQUIRED_CORRECT} rätt mot behärskat
                            </p>

                        </div>

                    `;

                }

            }

            else {

                result.innerHTML = `

                    <div class="word-listen-wrong-v2">

                        <strong>
                            ❌ Inte riktigt
                        </strong>

                        <p>
                            Ordet är inte behärskat ännu.
                            Det kommer tillbaka igen senare.
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

                        <p>
                            🔁 0/${REQUIRED_CORRECT} — börja bygga upp ordet igen
                        </p>

                    </div>

                `;

            }


            updateProgress();


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
                                item.word,

                            mastery:
                                streak,

                            required:
                                REQUIRED_CORRECT
                        }
                    );

            }

        }



        /* =================================================
           NÄSTA
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
           GÖR OM
        ================================================= */

        function retryWord() {

            /*
                Vi tömmer övningen men sätter INTE
                countedThisRound till false.

                Därför kan hon träna samma ord igen,
                men inte få fyra poäng genom att
                trycka Gör om fyra gånger.
            */

            clearExercise();

            playWord(
                false
            );

        }



'''

new_text = (
    text[:start]
    + new_logic
    + text[end:]
)

path.write_text(
    new_text,
    encoding="utf-8",
    newline="\n"
)

print("✅ 4/4-system installerat")
print("✅ Fel ord kommer tillbaka")
print("✅ Fel återställer ordet till 0/4")
print("✅ Rätt ord fortsätter komma tillbaka tills 4/4")
print("✅ Gör om kan inte användas för att fuska 4/4")
print("✅ Behärskat visas först efter 4 rätt på olika tillfällen")
