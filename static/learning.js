/* =========================================================
   MIKALLEARN - LEARNING SYSTEM
   Skriva: ny text efter 100%
   Läsa: nya texter + 10 öppna frågor + AI-rättning
========================================================= */

const MikalLearning = (() => {

    let writingLoading = false;
    let readingLoading = false;
    let readingChecking = false;
    let currentReading = null;


    /* =====================================================
       HELPERS
    ===================================================== */

    function today() {

        const date = new Date();

        const y = date.getFullYear();

        const m = String(
            date.getMonth() + 1
        ).padStart(2, "0");

        const d = String(
            date.getDate()
        ).padStart(2, "0");

        return `${y}-${m}-${d}`;

    }


    function normalize(text) {

        return String(text || "")
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();

    }


    async function postJSON(url, data) {

        const response = await fetch(
            url,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(data)
            }
        );


        if (!response.ok) {

            throw new Error(
                "Serverfel: " +
                response.status
            );

        }


        return await response.json();

    }


    function getArray(key) {

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


    function saveArray(key, value) {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

    }


    /* =====================================================
       ✍️ SKRIVA
    ===================================================== */

    function initWriting() {

        if (
            window.location.pathname
            !== "/skriva"
        ) {
            return;
        }


        const textBox =
            document.getElementById(
                "copyText"
            );


        const answer =
            document.getElementById(
                "copyAnswer"
            );


        const result =
            document.getElementById(
                "copyResult"
            );


        const panel =
            document.getElementById(
                "copy"
            );


        if (
            !textBox ||
            !answer ||
            !result ||
            !panel
        ) {
            return;
        }


        saveWritingText(
            textBox.innerText
        );


        const button =
            panel.querySelector(
                ".check-button"
            );


        if (!button) {
            return;
        }


        /*
        Den gamla checkCopy() kör först.

        Efteråt kollar vi om resultatet
        blev 100%.
        */

        button.addEventListener(
            "click",
            () => {

                setTimeout(
                    async () => {

                        const resultText =
                            result.textContent;


                        if (
                            resultText.includes(
                                "100% rätt"
                            )
                        ) {

                            await writingSuccess(
                                textBox,
                                answer,
                                result,
                                button
                            );

                        }

                    },
                    80
                );

            }
        );

    }


    function saveWritingText(text) {

        if (!text) {
            return;
        }


        const key =
            "mikal_seen_writing_texts";


        let texts =
            getArray(key);


        if (
            !texts.some(
                old =>
                    normalize(old)
                    ===
                    normalize(text)
            )
        ) {

            texts.push(text);

        }


        texts =
            texts.slice(-300);


        saveArray(
            key,
            texts
        );

    }


    async function writingSuccess(
        textBox,
        answer,
        result,
        button
    ) {

        if (writingLoading) {
            return;
        }


        writingLoading = true;

        button.disabled = true;


        result.className =
            "result success";


        result.innerHTML = `
            <strong>
                Perfekt! 🎉
            </strong>
            <br>
            Hela texten är rätt.
            Ny text kommer...
        `;


        if (
            typeof MikalLearn
            !== "undefined"
        ) {

            MikalLearn.recordAttempt(
                "skriva",
                "kopiera_text",
                100
            );

        }


        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    1000
                )
        );


        try {

            const seen =
                getArray(
                    "mikal_seen_writing_texts"
                );


            let newText = null;


            /*
            Försök flera gånger om servern
            av någon anledning skickar en text
            hon redan gjort.
            */

            for (
                let attempt = 0;
                attempt < 5;
                attempt++
            ) {

                const data =
                    await postJSON(
                        "/api/writing/next",
                        {
                            seen_texts:
                                seen
                        }
                    );


                if (
                    data.text &&
                    !seen.some(
                        old =>
                            normalize(old)
                            ===
                            normalize(
                                data.text
                            )
                    )
                ) {

                    newText =
                        data.text.trim();

                    break;

                }

            }


            if (!newText) {

                result.className =
                    "result warning";


                result.innerHTML = `
                    Kunde inte skapa en helt
                    ny text just nu.
                    Försök igen om en stund.
                `;


                return;

            }


            saveWritingText(
                newText
            );


            textBox.innerText =
                newText;


            answer.value = "";


            result.innerHTML = "";


            answer.focus();


            textBox.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

        }

        catch (error) {

            console.error(error);


            result.className =
                "result warning";


            result.innerHTML = `
                Något gick fel när nästa
                text skulle hämtas.
                Försök igen.
            `;

        }

        finally {

            writingLoading = false;

            button.disabled = false;

        }

    }


    /* =====================================================
       📖 LÄSA
    ===================================================== */

    function initReading() {

        if (
            window.location.pathname
            !== "/lasa"
        ) {
            return;
        }


        createReadingButtons();


        const saved =
            getSavedReading();


        if (
            saved &&
            validReading(saved)
        ) {

            currentReading =
                saved;


            renderReading(
                saved
            );

        }

        else {

            loadNewReading(
                false
            );

        }

    }


    function validReading(reading) {

        return (
            reading &&
            reading.title &&
            reading.text &&
            Array.isArray(
                reading.questions
            ) &&
            reading.questions.length
            === 10
        );

    }


    function currentReadingKey() {

        return (
            "mikal_current_reading_" +
            today()
        );

    }


    function getSavedReading() {

        try {

            return JSON.parse(
                localStorage.getItem(
                    currentReadingKey()
                )
            );

        }

        catch {

            return null;

        }

    }


    function saveCurrentReading(
        reading
    ) {

        localStorage.setItem(
            currentReadingKey(),
            JSON.stringify(reading)
        );

    }


    function saveSeenReading(
        reading
    ) {

        let titles =
            getArray(
                "mikal_seen_reading_titles"
            );


        let texts =
            getArray(
                "mikal_seen_reading_texts"
            );


        if (
            !titles.some(
                title =>
                    normalize(title)
                    ===
                    normalize(
                        reading.title
                    )
            )
        ) {

            titles.push(
                reading.title
            );

        }


        if (
            !texts.some(
                text =>
                    normalize(text)
                    ===
                    normalize(
                        reading.text
                    )
            )
        ) {

            texts.push(
                reading.text
            );

        }


        saveArray(
            "mikal_seen_reading_titles",
            titles.slice(-300)
        );


        saveArray(
            "mikal_seen_reading_texts",
            texts.slice(-300)
        );

    }


    function readingAnswerKey() {

        if (!currentReading) {
            return null;
        }


        return (
            "mikal_reading_answers_" +
            today() +
            "_" +
            encodeURIComponent(
                currentReading.title
            )
        );

    }


    function getSavedAnswers() {

        const key =
            readingAnswerKey();


        if (!key) {
            return [];
        }


        return getArray(key);

    }


    function saveAnswers() {

        const key =
            readingAnswerKey();


        if (!key) {
            return;
        }


        const answers =
            Array.from(
                document.querySelectorAll(
                    "[data-reading-open-answer]"
                )
            )
            .map(
                field =>
                    field.value
            );


        saveArray(
            key,
            answers
        );


        const saved =
            document.getElementById(
                "readingSaved"
            );


        if (saved) {

            saved.textContent =
                "Sparat ✓";

        }

    }


    /* =====================================================
       SKAPA KNAPPAR
    ===================================================== */

    function createReadingButtons() {

        const practice =
            document.querySelector(
                ".reading-practice"
            );


        if (
            !practice ||
            document.getElementById(
                "readingActionsV3"
            )
        ) {
            return;
        }


        const actions =
            document.createElement(
                "div"
            );


        actions.id =
            "readingActionsV3";


        actions.className =
            "reading-actions-v3";


        actions.innerHTML = `

            <div class="reading-action-left">

                <button
                    type="button"
                    class="check-button"
                    id="checkReadingAnswers">

                    ✓ Rätta alla svar

                </button>


                <span
                    id="readingSaved"
                    class="reading-saved-v3">

                    Sparas automatiskt

                </span>

            </div>


            <button
                type="button"
                class="new-reading-button"
                id="newReadingButton">

                ↻ Ny text + nya frågor

            </button>

        `;


        practice.appendChild(
            actions
        );


        const overall =
            document.createElement(
                "div"
            );


        overall.id =
            "readingOverallResult";


        overall.className =
            "reading-overall-result";


        practice.appendChild(
            overall
        );


        document
            .getElementById(
                "checkReadingAnswers"
            )
            .addEventListener(
                "click",
                checkReadingAnswers
            );


        document
            .getElementById(
                "newReadingButton"
            )
            .addEventListener(
                "click",
                async () => {

                    const fields =
                        document.querySelectorAll(
                            "[data-reading-open-answer]"
                        );


                    const hasAnswers =
                        Array.from(fields)
                            .some(
                                field =>
                                    field.value.trim()
                            );


                    if (
                        hasAnswers &&
                        !confirm(
                            "Vill du byta text? Dina nuvarande svar ligger kvar sparade."
                        )
                    ) {

                        return;

                    }


                    await loadNewReading(
                        true
                    );

                }
            );

    }


    /* =====================================================
       HÄMTA NY TEXT
    ===================================================== */

    async function loadNewReading(
        forceNew
    ) {

        if (readingLoading) {
            return;
        }


        readingLoading = true;


        const button =
            document.getElementById(
                "newReadingButton"
            );


        if (button) {

            button.disabled = true;

            button.textContent =
                "Skapar ny text...";

        }


        setReadingLoadingState();


        try {

            const seenTitles =
                getArray(
                    "mikal_seen_reading_titles"
                );


            const seenTexts =
                getArray(
                    "mikal_seen_reading_texts"
                );


            let reading = null;


            /*
            Förhindrar EXAKT samma text
            från att visas igen.
            */

            for (
                let attempt = 0;
                attempt < 5;
                attempt++
            ) {

                const data =
                    await postJSON(
                        "/api/reading/new",
                        {
                            seen_titles:
                                seenTitles
                        }
                    );


                if (
                    validReading(data) &&
                    !seenTexts.some(
                        oldText =>
                            normalize(
                                oldText
                            )
                            ===
                            normalize(
                                data.text
                            )
                    )
                ) {

                    reading =
                        data;

                    break;

                }

            }


            /*
            Om det är första gången
            och servern bara har fallback:
            visa den ändå.
            */

            if (
                !reading &&
                !forceNew
            ) {

                const data =
                    await postJSON(
                        "/api/reading/new",
                        {
                            seen_titles: []
                        }
                    );


                if (
                    validReading(data)
                ) {

                    reading = data;

                }

            }


            if (!reading) {

                showReadingError(
                    "Kunde inte skapa en helt ny text. Kontrollera Claude API och försök igen."
                );

                return;

            }


            currentReading =
                reading;


            saveCurrentReading(
                reading
            );


            saveSeenReading(
                reading
            );


            renderReading(
                reading
            );

        }

        catch (error) {

            console.error(error);


            showReadingError(
                "Något gick fel när texten skulle hämtas."
            );

        }

        finally {

            readingLoading =
                false;


            if (button) {

                button.disabled =
                    false;


                button.textContent =
                    "↻ Ny text + nya frågor";

            }

        }

    }


    /* =====================================================
       RENDERA TEXT + 10 FRÅGOR
    ===================================================== */

    function renderReading(reading) {

        const title =
            document.querySelector(
                ".reading-header h2"
            );


        const text =
            document.querySelector(
                ".reading-text-compact"
            );


        const questions =
            document.querySelector(
                ".open-questions"
            );


        if (
            !title ||
            !text ||
            !questions
        ) {
            return;
        }


        title.textContent =
            reading.title;


        text.textContent =
            reading.text;


        questions.innerHTML = "";


        const savedAnswers =
            getSavedAnswers();


        reading.questions.forEach(
            (item, index) => {

                const box =
                    document.createElement(
                        "div"
                    );


                box.className =
                    "open-question";


                const number =
                    document.createElement(
                        "div"
                    );


                number.className =
                    "question-number";


                number.textContent =
                    index + 1;


                const content =
                    document.createElement(
                        "div"
                    );


                content.className =
                    "question-content";


                const label =
                    document.createElement(
                        "label"
                    );


                label.textContent =
                    item.question;


                const textarea =
                    document.createElement(
                        "textarea"
                    );


                textarea.className =
                    "reading-answer";


                textarea.dataset
                    .readingOpenAnswer =
                    index;


                textarea.placeholder =
                    "Skriv ditt svar här...";


                textarea.spellcheck =
                    true;


                textarea.value =
                    savedAnswers[index]
                    || "";


                textarea.addEventListener(
                    "input",
                    saveAnswers
                );


                const feedback =
                    document.createElement(
                        "div"
                    );


                feedback.className =
                    "reading-answer-feedback";


                feedback.dataset
                    .readingFeedback =
                    index;


                content.appendChild(
                    label
                );


                content.appendChild(
                    textarea
                );


                content.appendChild(
                    feedback
                );


                box.appendChild(
                    number
                );


                box.appendChild(
                    content
                );


                questions.appendChild(
                    box
                );

            }
        );


        const overall =
            document.getElementById(
                "readingOverallResult"
            );


        if (overall) {

            overall.innerHTML = "";

        }


        const saved =
            document.getElementById(
                "readingSaved"
            );


        if (saved) {

            saved.textContent =
                "Sparas automatiskt";

        }

    }


    /* =====================================================
       RÄTTA ALLA 10 MED CLAUDE
    ===================================================== */

    async function checkReadingAnswers() {

        if (
            readingChecking ||
            !currentReading
        ) {
            return;
        }


        const fields =
            Array.from(
                document.querySelectorAll(
                    "[data-reading-open-answer]"
                )
            );


        if (
            fields.length !== 10
        ) {
            return;
        }


        const firstEmpty =
            fields.find(
                field =>
                    !field.value.trim()
            );


        if (firstEmpty) {

            const overall =
                document.getElementById(
                    "readingOverallResult"
                );


            overall.className =
                "reading-overall-result warning";


            overall.textContent =
                "Svara på alla 10 frågor först 🙂";


            firstEmpty.focus();


            firstEmpty.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });


            return;

        }


        readingChecking = true;


        const button =
            document.getElementById(
                "checkReadingAnswers"
            );


        button.disabled = true;

        button.textContent =
            "Rättar dina svar...";


        const answers =
            fields.map(
                field =>
                    field.value.trim()
            );


        saveAnswers();


        try {

            const data =
                await postJSON(
                    "/api/reading/check",
                    {
                        reading:
                            currentReading,

                        answers:
                            answers
                    }
                );


            if (
                !Array.isArray(
                    data.results
                )
            ) {

                throw new Error(
                    "Felaktigt svar från servern."
                );

            }


            showReadingResults(
                data.results
            );

        }

        catch (error) {

            console.error(error);


            const overall =
                document.getElementById(
                    "readingOverallResult"
                );


            overall.className =
                "reading-overall-result warning";


            overall.textContent =
                "Rättningen fungerade inte. Försök igen.";

        }

        finally {

            readingChecking =
                false;


            button.disabled =
                false;


            button.textContent =
                "✓ Rätta alla svar";

        }

    }


    /* =====================================================
       VISA ✅ / ❌ + EXEMPELSVAR
    ===================================================== */

    function showReadingResults(
        results
    ) {

        let correctCount = 0;


        results.forEach(
            result => {

                const index =
                    Number(
                        result.index
                    );


                const box =
                    document.querySelector(
                        `[data-reading-feedback="${index}"]`
                    );


                const textarea =
                    document.querySelector(
                        `[data-reading-open-answer="${index}"]`
                    );


                if (
                    !box ||
                    !textarea
                ) {
                    return;
                }


                box.innerHTML = "";


                textarea.classList.remove(
                    "reading-correct",
                    "reading-wrong"
                );


                const status =
                    document.createElement(
                        "div"
                    );


                status.className =
                    "reading-feedback-status";


                if (
                    result.correct
                ) {

                    correctCount++;


                    textarea.classList.add(
                        "reading-correct"
                    );


                    box.classList.add(
                        "is-correct"
                    );


                    box.classList.remove(
                        "is-wrong"
                    );


                    status.textContent =
                        "✅ Rätt";

                }

                else {

                    textarea.classList.add(
                        "reading-wrong"
                    );


                    box.classList.add(
                        "is-wrong"
                    );


                    box.classList.remove(
                        "is-correct"
                    );


                    status.textContent =
                        "❌ Inte riktigt";

                }


                const feedback =
                    document.createElement(
                        "p"
                    );


                feedback.textContent =
                    result.feedback
                    || "";


                const answerTitle =
                    document.createElement(
                        "strong"
                    );


                answerTitle.textContent =
                    "Exempelsvar:";


                const example =
                    document.createElement(
                        "p"
                    );


                example.className =
                    "reading-example-answer";


                example.textContent =
                    result.example_answer
                    || "";


                box.appendChild(
                    status
                );


                box.appendChild(
                    feedback
                );


                box.appendChild(
                    answerTitle
                );


                box.appendChild(
                    example
                );

            }
        );


        const score =
            Math.round(
                correctCount /
                results.length *
                100
            );


        const overall =
            document.getElementById(
                "readingOverallResult"
            );


        overall.className =
            "reading-overall-result success";


        overall.textContent =
            `${correctCount} av 10 rätt • ${score}%`;


        if (
            typeof MikalLearn
            !== "undefined"
        ) {

            MikalLearn.recordAttempt(
                "lasa",
                "lasforstaelse_10_fragor",
                score,
                {
                    title:
                        currentReading.title
                }
            );

        }

    }


    /* =====================================================
       LOADING / ERROR
    ===================================================== */

    function setReadingLoadingState() {

        const title =
            document.querySelector(
                ".reading-header h2"
            );


        const text =
            document.querySelector(
                ".reading-text-compact"
            );


        const questions =
            document.querySelector(
                ".open-questions"
            );


        if (title) {

            title.textContent =
                "Skapar dagens text...";

        }


        if (text) {

            text.textContent =
                "Vänta lite medan en ny text och nya frågor skapas.";

        }


        if (questions) {

            questions.innerHTML = "";

        }

    }


    function showReadingError(message) {

        const text =
            document.querySelector(
                ".reading-text-compact"
            );


        if (text) {

            text.textContent =
                message;

        }

    }


    /* =====================================================
       START
    ===================================================== */

    function init() {

        initWriting();

        initReading();

    }


    return {
        init
    };

})();


document.addEventListener(
    "DOMContentLoaded",
    MikalLearning.init
);