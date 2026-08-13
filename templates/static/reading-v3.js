/* ==========================================================
   MIKALLEARN - READING V3
   EASY / MEDIUM / HARD
========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {


        if (
            window.location.pathname !==
            "/lasa"
        ) {
            return;
        }


        let selectedLevel =
            localStorage.getItem(
                "mikal_reading_level_v3"
            )
            || "easy";


        let currentReading =
            null;



        const LEVELS = {

            easy: {
                name: "L\u00e4tt",
                badge: "L\u00c4TT"
            },

            medium: {
                name: "Mellan",
                badge: "MELLAN"
            },

            hard: {
                name: "Sv\u00e5r",
                badge: "SV\u00c5R"
            }

        };



        const createButton =
            document.getElementById(
                "createReadingV3"
            );


        const newButton =
            document.getElementById(
                "newReadingV3"
            );


        const checkButton =
            document.getElementById(
                "checkReadingV3"
            );


        const loading =
            document.getElementById(
                "readingLoadingV3"
            );


        const area =
            document.getElementById(
                "readingAreaV3"
            );


        const overall =
            document.getElementById(
                "readingOverallV3"
            );



        /* ==================================================
           STORAGE
        ================================================== */

        function seenTitleKey() {

            return (
                "mikal_reading_v3_titles_" +
                selectedLevel
            );

        }


        function seenTextKey() {

            return (
                "mikal_reading_v3_texts_" +
                selectedLevel
            );

        }


        function getArray(key) {

            try {

                const value =
                    JSON.parse(
                        localStorage.getItem(
                            key
                        )
                        || "[]"
                    );


                return Array.isArray(value)
                    ? value
                    : [];

            }

            catch {

                return [];

            }

        }


        function saveArray(
            key,
            value
        ) {

            localStorage.setItem(
                key,
                JSON.stringify(
                    value.slice(-200)
                )
            );

        }


        function normalize(text) {

            return String(text || "")
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

        }



        /* ==================================================
           LEVEL BUTTONS
        ================================================== */

        function renderSelectedLevel() {


            document
                .querySelectorAll(
                    "[data-reading-level]"
                )
                .forEach(
                    button => {

                        button.classList.toggle(
                            "active",
                            button.dataset
                                .readingLevel
                            === selectedLevel
                        );

                    }
                );


            document
                .getElementById(
                    "selectedReadingLevel"
                )
                .textContent =
                LEVELS[
                    selectedLevel
                ].name;

        }


        document
            .querySelectorAll(
                "[data-reading-level]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            selectedLevel =
                                button.dataset
                                    .readingLevel;


                            localStorage.setItem(
                                "mikal_reading_level_v3",
                                selectedLevel
                            );


                            renderSelectedLevel();


                            if (
                                currentReading &&
                                currentReading.level
                                !== selectedLevel
                            ) {

                                area.classList.add(
                                    "hidden"
                                );


                                loading.className =
                                    "reading-loading-v3 reading-info-v3";


                                loading.textContent =
                                    "Niv\u00e5n \u00e4r vald. Tryck p\u00e5 Skapa text + fr\u00e5gor.";

                            }

                        }
                    );

                }
            );



        /* ==================================================
           API
        ================================================== */

        async function postJSON(
            url,
            data
        ) {

            const response =
                await fetch(
                    url,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                data
                            )
                    }
                );


            const result =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    result.error
                    ||
                    "N\u00e5got gick fel."
                );

            }


            return result;

        }



        /* ==================================================
           SKAPA NY TEXT
        ================================================== */

        async function createReading() {


            createButton.disabled =
                true;


            newButton.disabled =
                true;


            area.classList.add(
                "hidden"
            );


            loading.className =
                "reading-loading-v3 reading-loading-active-v3";


            loading.textContent =
                "Skapar en ny text p\u00e5 niv\u00e5 " +
                LEVELS[
                    selectedLevel
                ].name +
                "...";


            overall.innerHTML =
                "";


            try {


                const seenTitles =
                    getArray(
                        seenTitleKey()
                    );


                const seenTexts =
                    getArray(
                        seenTextKey()
                    );


                let reading =
                    null;



                for (
                    let attempt = 0;
                    attempt < 4;
                    attempt++
                ) {


                    const candidate =
                        await postJSON(
                            "/api/reading/new-v3",
                            {
                                level:
                                    selectedLevel,

                                seen_titles:
                                    seenTitles,

                                seen_texts:
                                    seenTexts
                            }
                        );


                    if (
                        !candidate.text ||
                        !candidate.questions ||
                        !candidate.questions.length
                    ) {

                        continue;

                    }


                    const duplicate =
                        seenTexts.some(
                            oldText =>
                                normalize(oldText)
                                ===
                                normalize(
                                    candidate.text
                                )
                        );


                    if (!duplicate) {

                        reading =
                            candidate;

                        break;

                    }

                }



                if (!reading) {

                    throw new Error(
                        "Kunde inte skapa en helt ny text. F\u00f6rs\u00f6k igen."
                    );

                }



                reading.level =
                    selectedLevel;


                currentReading =
                    reading;



                const titles =
                    getArray(
                        seenTitleKey()
                    );


                titles.push(
                    reading.title
                );


                saveArray(
                    seenTitleKey(),
                    titles
                );



                const texts =
                    getArray(
                        seenTextKey()
                    );


                texts.push(
                    reading.text
                );


                saveArray(
                    seenTextKey(),
                    texts
                );



                localStorage.setItem(
                    "mikal_current_reading_v3",
                    JSON.stringify(
                        currentReading
                    )
                );



                renderReading();


                loading.textContent =
                    "";


                loading.className =
                    "reading-loading-v3";


                area.classList.remove(
                    "hidden"
                );


                area.scrollIntoView({
                    behavior:
                        "smooth",

                    block:
                        "start"
                });


            }

            catch (error) {


                console.error(
                    error
                );


                loading.className =
                    "reading-loading-v3 reading-error-v3";


                loading.textContent =
                    error.message
                    ||
                    "Kunde inte skapa texten. F\u00f6rs\u00f6k igen.";


            }

            finally {


                createButton.disabled =
                    false;


                newButton.disabled =
                    false;


            }

        }



        /* ==================================================
           RENDER TEXT
        ================================================== */

        function renderReading() {


            if (!currentReading) {
                return;
            }


            document
                .getElementById(
                    "readingTitleV3"
                )
                .textContent =
                currentReading.title;



            document
                .getElementById(
                    "readingTextV3"
                )
                .textContent =
                currentReading.text;



            document
                .getElementById(
                    "readingLevelBadgeV3"
                )
                .textContent =
                LEVELS[
                    currentReading.level
                    || selectedLevel
                ].badge;



            const count =
                currentReading
                    .questions
                    .length;


            document
                .getElementById(
                    "readingQuestionCountV3"
                )
                .textContent =
                count +
                (
                    count === 1
                    ? " fr\u00e5ga"
                    : " fr\u00e5gor"
                );



            const container =
                document.getElementById(
                    "readingQuestionsV3"
                );


            container.innerHTML =
                "";



            currentReading
                .questions
                .forEach(
                    (
                        item,
                        index
                    ) => {


                        const card =
                            document.createElement(
                                "div"
                            );


                        card.className =
                            "reading-open-question reading-question-v3";


                        const top =
                            document.createElement(
                                "div"
                            );


                        top.className =
                            "reading-question-top-v3";



                        const number =
                            document.createElement(
                                "span"
                            );


                        number.className =
                            "reading-number-v3";


                        number.textContent =
                            index + 1;



                        const label =
                            document.createElement(
                                "label"
                            );


                        label.textContent =
                            item.question;



                        top.appendChild(
                            number
                        );


                        top.appendChild(
                            label
                        );



                        const textarea =
                            document.createElement(
                                "textarea"
                            );


                        textarea.className =
                            "reading-answer reading-answer-v3";


                        textarea.dataset.index =
                            index;


                        textarea.placeholder =
                            "Skriv ditt svar h\u00e4r...";


                        textarea.spellcheck =
                            true;



                        const feedback =
                            document.createElement(
                                "div"
                            );


                        feedback.className =
                            "reading-answer-feedback";


                        feedback.dataset.feedback =
                            index;



                        card.appendChild(
                            top
                        );


                        card.appendChild(
                            textarea
                        );


                        card.appendChild(
                            feedback
                        );


                        container.appendChild(
                            card
                        );


                    }
                );



            overall.innerHTML =
                "";


            overall.className =
                "reading-overall-result-v3";

        }



        /* ==================================================
           RATTA
        ================================================== */

        async function checkReading() {


            if (!currentReading) {
                return;
            }



            const fields =
                Array.from(
                    document.querySelectorAll(
                        ".reading-answer-v3"
                    )
                );



            const empty =
                fields.find(
                    field =>
                        !field.value.trim()
                );



            if (empty) {


                overall.className =
                    "reading-overall-result-v3 warning";


                overall.textContent =
                    "Svara p\u00e5 alla fr\u00e5gor f\u00f6rst.";


                empty.focus();


                return;

            }



            const answers =
                fields.map(
                    field =>
                        field.value.trim()
                );



            checkButton.disabled =
                true;


            checkButton.textContent =
                "R\u00e4ttar...";


            overall.className =
                "reading-overall-result-v3 loading";


            overall.textContent =
                "Kontrollerar om svaren visar att texten \u00e4r f\u00f6rst\u00e5dd...";



            try {


                const data =
                    await postJSON(
                        "/api/reading/check-v3",
                        {
                            reading:
                                currentReading,

                            answers:
                                answers,

                            level:
                                currentReading.level
                                || selectedLevel
                        }
                    );


                showResults(
                    data.results
                );


            }

            catch (error) {


                console.error(
                    error
                );


                overall.className =
                    "reading-overall-result-v3 warning";


                overall.textContent =
                    error.message
                    ||
                    "R\u00e4ttningen fungerade inte. F\u00f6rs\u00f6k igen.";


            }

            finally {


                checkButton.disabled =
                    false;


                checkButton.textContent =
                    "\u2713 R\u00e4tta svaren";


            }

        }



        function showResults(
            results
        ) {


            let correctCount =
                0;



            const feedbackBoxes =
                document.querySelectorAll(
                    "[data-feedback]"
                );


            feedbackBoxes.forEach(
                box => {

                    box.className =
                        "reading-answer-feedback";

                    box.innerHTML =
                        "";

                }
            );



            results.forEach(
                item => {


                    const index =
                        Number(
                            item.index
                        );


                    const answer =
                        document.querySelector(
                            '.reading-answer-v3[data-index="' +
                            index +
                            '"]'
                        );


                    const feedback =
                        document.querySelector(
                            '[data-feedback="' +
                            index +
                            '"]'
                        );


                    if (
                        !answer ||
                        !feedback
                    ) {
                        return;
                    }



                    if (item.correct) {


                        correctCount++;


                        answer.classList.add(
                            "reading-correct"
                        );


                        answer.classList.remove(
                            "reading-wrong"
                        );


                        feedback.classList.add(
                            "is-correct"
                        );


                    }

                    else {


                        answer.classList.add(
                            "reading-wrong"
                        );


                        answer.classList.remove(
                            "reading-correct"
                        );


                        feedback.classList.add(
                            "is-wrong"
                        );


                    }



                    const status =
                        document.createElement(
                            "div"
                        );


                    status.className =
                        "reading-feedback-status";


                    status.textContent =
                        item.correct
                        ? "\u2705 R\u00e4tt"
                        : "\u274c Inte riktigt";



                    const comment =
                        document.createElement(
                            "p"
                        );


                    comment.textContent =
                        item.feedback
                        || "";



                    const exampleLabel =
                        document.createElement(
                            "strong"
                        );


                    exampleLabel.textContent =
                        "Exempelsvar:";



                    const example =
                        document.createElement(
                            "p"
                        );


                    example.className =
                        "reading-example-answer";


                    example.textContent =
                        item.example_answer
                        || "";



                    feedback.appendChild(
                        status
                    );


                    feedback.appendChild(
                        comment
                    );


                    feedback.appendChild(
                        exampleLabel
                    );


                    feedback.appendChild(
                        example
                    );


                }
            );



            const total =
                currentReading
                    .questions
                    .length;


            const percent =
                Math.round(
                    (
                        correctCount /
                        total
                    )
                    * 100
                );



            overall.className =
                "reading-overall-result-v3 " +
                (
                    percent >= 70
                    ? "success"
                    : "warning"
                );


            overall.textContent =
                correctCount +
                " av " +
                total +
                " r\u00e4tt \u2022 " +
                percent +
                "%";



            if (
                window.MikalLearn &&
                typeof window.MikalLearn
                    .recordAttempt
                === "function"
            ) {


                window.MikalLearn
                    .recordAttempt(
                        "lasa",
                        "lasforstaelse_" +
                        (
                            currentReading.level
                            || selectedLevel
                        ),
                        percent,
                        {
                            title:
                                currentReading.title,

                            questions:
                                total
                        }
                    );


            }

        }



        /* ==================================================
           BUTTON EVENTS
        ================================================== */

        createButton.addEventListener(
            "click",
            createReading
        );


        newButton.addEventListener(
            "click",
            createReading
        );


        checkButton.addEventListener(
            "click",
            checkReading
        );



        /* ==================================================
           START
        ================================================== */

        renderSelectedLevel();



        try {


            const saved =
                JSON.parse(
                    localStorage.getItem(
                        "mikal_current_reading_v3"
                    )
                    || "null"
                );


            if (
                saved &&
                saved.text &&
                Array.isArray(
                    saved.questions
                )
            ) {


                currentReading =
                    saved;


                selectedLevel =
                    saved.level
                    || selectedLevel;


                renderSelectedLevel();


                renderReading();


                area.classList.remove(
                    "hidden"
                );


            }


        }

        catch {
        }


    }
);
