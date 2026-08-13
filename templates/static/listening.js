/* =========================================================
   MIKALLEARN - LYSSNA & SKRIV V2
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    if (window.location.pathname !== "/lyssna") {
        return;
    }


    /* =====================================================
       STOR MENINGSBANK
    ===================================================== */

    const sentences = [

        "Jag brukar äta frukost innan jag går till skolan.",
        "I morse vaknade jag tidigare än vanligt.",
        "Bussen kom fem minuter senare än den brukar.",
        "Efter skolan gick jag direkt hem.",
        "Hon glömde sin vattenflaska på köksbordet.",
        "Vi började lektionen klockan åtta.",
        "Han gjorde sina läxor innan middagen.",
        "Jag behöver köpa mjölk på vägen hem.",
        "På fredag ska klassen skriva ett prov.",
        "Hon tog på sig jackan eftersom det var kallt.",

        "Jag missade bussen eftersom jag vaknade sent.",
        "Efter träningen var jag trött men nöjd.",
        "Vi gick till biblioteket för att studera tillsammans.",
        "Hon försöker förbättra sin svenska varje dag.",
        "Jag läste frågan två gånger innan jag svarade.",
        "Läraren förklarade uppgiften innan vi började.",
        "Han sparar pengar för att köpa en ny dator.",
        "På kvällen brukar jag förbereda saker inför nästa dag.",
        "Det började regna när vi gick hem från skolan.",
        "Jag tycker att det är lättare att arbeta när det är lugnt.",

        "Sara tränar fotboll flera gånger i veckan.",
        "Hon vill bli bättre därför tränar hon regelbundet.",
        "Vi stannade hemma eftersom vädret var dåligt.",
        "Min kompis hjälpte mig när jag inte förstod uppgiften.",
        "Jag skrev ner de ord som jag inte förstod.",
        "Efter maten satte han sig och gjorde sina läxor.",
        "Hon var nervös innan provet men försökte hålla sig lugn.",
        "Jag behöver planera min tid bättre den här veckan.",
        "Vi jämförde våra svar efter att uppgiften var klar.",
        "Han märkte att träningen gav bättre resultat.",

        "Det är viktigt att förstå frågan innan man börjar skriva.",
        "Hon ändrade sin plan eftersom den första inte fungerade.",
        "Jag försökte förklara problemet med mina egna ord.",
        "Efter några veckor märkte hon en tydlig förbättring.",
        "Vi fick möjlighet att göra om uppgiften.",
        "Läraren bad eleverna att arbeta i mindre grupper.",
        "Han kom för sent eftersom tåget var försenat.",
        "Jag blev förvånad när jag såg resultatet.",
        "Hon fortsatte försöka trots att uppgiften var svår.",
        "Vi behöver ta reda på varför problemet uppstod.",

        "När jag kom hem märkte jag att mobilen låg kvar i skolan.",
        "Hon började plugga tidigare för att slippa stressa på kvällen.",
        "Eleverna diskuterade olika lösningar på problemet.",
        "Jag försökte koncentrera mig trots att det var mycket ljud.",
        "Han förstod texten bättre efter att han hade läst den igen.",
        "Hon skrev en kort sammanfattning med sina egna ord.",
        "Vi fick välja vilket ämne vi ville arbeta med.",
        "Jag frågade läraren eftersom jag inte förstod instruktionen.",
        "Efter lektionen gick vi igenom svaren tillsammans.",
        "Han bestämde sig för att ändra sina studievanor.",

        "Sömn kan påverka hur lätt det är att koncentrera sig.",
        "Det finns flera anledningar till att människor tränar.",
        "Hon jämförde priser innan hon bestämde vad hon skulle köpa.",
        "Vi måste tänka på konsekvenserna innan vi fattar ett beslut.",
        "Han försökte beskriva situationen så tydligt som möjligt.",
        "Resultatet blev bättre än hon hade förväntat sig.",
        "Jag tycker att det är viktigt att lyssna på andra människor.",
        "Hon hade svårt att komma igång men fortsatte ändå.",
        "När uppgiften var klar kontrollerade han sitt svar en gång till.",
        "Vi använde informationen i texten för att svara på frågorna.",

        "På morgonen upptäckte hon att cykeln hade fått punktering.",
        "Han tog en tidigare buss för att vara säker på att komma i tid.",
        "Efter presentationen fick gruppen frågor från resten av klassen.",
        "Jag skrev en lista över det viktigaste jag behövde göra.",
        "Hon försökte hitta en lösning istället för att ge upp.",
        "När matchen började var båda lagen väldigt fokuserade.",
        "Vi planerade arbetet innan vi började skriva rapporten.",
        "Han läste igenom texten och rättade flera stavfel.",
        "Jag förstod inte ordet först men meningen hjälpte mig.",
        "Hon blev klar tidigare eftersom hon hade planerat arbetet.",

        "Trots att han var trött bestämde han sig för att göra klart uppgiften.",
        "När jag jämförde de två texterna såg jag flera tydliga skillnader.",
        "Hon förklarade sin åsikt och gav ett exempel som stöd.",
        "Vi diskuterade varför samma problem kan ha flera olika lösningar.",
        "Han började förstå sambandet mellan sömn och koncentration.",
        "Efter att hon hade läst texten kunde hon sammanfatta huvudidén.",
        "Jag försökte använda det nya ordet i en egen mening.",
        "Läraren ville att vi skulle motivera våra svar tydligare.",
        "Hon upptäckte att små förändringar kunde göra stor skillnad.",
        "Vi behövde använda information från flera delar av texten."

    ];


    /* =====================================================
       ELEMENT
    ===================================================== */

    const answer =
        document.getElementById("listenAnswer");

    const result =
        document.getElementById("listenResult");

    const number =
        document.getElementById("listenNumber");

    const progress =
        document.getElementById("listenProgress");

    const nextButton =
        document.getElementById("nextSentence");

    const retryButton =
        document.getElementById("retrySentence");


    /* =====================================================
       STORAGE
    ===================================================== */

    const SEEN_KEY =
        "mikal_listening_seen";

    const CURRENT_KEY =
        "mikal_listening_current";


    function getSeen() {

        try {

            const saved =
                JSON.parse(
                    localStorage.getItem(SEEN_KEY) || "[]"
                );

            return Array.isArray(saved)
                ? saved
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


    function getCurrentIndex() {

        const saved =
            Number(
                localStorage.getItem(CURRENT_KEY)
            );

        if (
            Number.isInteger(saved) &&
            saved >= 0 &&
            saved < sentences.length
        ) {
            return saved;
        }

        return -1;

    }


    function saveCurrentIndex(index) {

        localStorage.setItem(
            CURRENT_KEY,
            index
        );

    }


    /* =====================================================
       VÄLJ NY MENING UTAN REPETITION
    ===================================================== */

    function chooseNewSentence() {

        let seen =
            getSeen();


        if (
            seen.length >=
            sentences.length
        ) {

            seen = [];

            saveSeen(seen);

        }


        let available =
            sentences
                .map((_, index) => index)
                .filter(
                    index =>
                        !seen.includes(index)
                );


        const current =
            getCurrentIndex();


        if (
            available.length > 1
        ) {

            available =
                available.filter(
                    index =>
                        index !== current
                );

        }


        const randomIndex =
            available[
                Math.floor(
                    Math.random() *
                    available.length
                )
            ];


        if (
            !seen.includes(
                randomIndex
            )
        ) {

            seen.push(
                randomIndex
            );

        }


        saveSeen(seen);

        saveCurrentIndex(
            randomIndex
        );


        return randomIndex;

    }


    let currentIndex =
        getCurrentIndex();


    if (
        currentIndex === -1
    ) {

        currentIndex =
            chooseNewSentence();

    }


    /* =====================================================
       NORMALISERING
    ===================================================== */

    function normalize(text) {

        return String(text || "")
            .toLowerCase()
            .replace(/[.,!?;:"]/g, "")
            .replace(/\s+/g, " ")
            .trim();

    }


    /* =====================================================
       LIKHET
    ===================================================== */

    function similarity(a, b) {

        a = normalize(a);
        b = normalize(b);


        if (!a || !b) {
            return 0;
        }


        const matrix = [];


        for (
            let i = 0;
            i <= b.length;
            i++
        ) {

            matrix[i] = [i];

        }


        for (
            let j = 0;
            j <= a.length;
            j++
        ) {

            matrix[0][j] = j;

        }


        for (
            let i = 1;
            i <= b.length;
            i++
        ) {

            for (
                let j = 1;
                j <= a.length;
                j++
            ) {

                if (
                    b[i - 1] ===
                    a[j - 1]
                ) {

                    matrix[i][j] =
                        matrix[i - 1][j - 1];

                }

                else {

                    matrix[i][j] =
                        Math.min(

                            matrix[i - 1][j - 1] + 1,

                            matrix[i][j - 1] + 1,

                            matrix[i - 1][j] + 1

                        );

                }

            }

        }


        const distance =
            matrix[b.length][a.length];


        const longest =
            Math.max(
                a.length,
                b.length
            );


        return Math.round(
            (
                1 -
                distance / longest
            )
            * 100
        );

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
                    voice.lang
                        .toLowerCase()
                        .startsWith("sv")
            )
            ||
            voices[0]
        );

    }


    function speak(rate = 0.9) {

        speechSynthesis.cancel();


        const utterance =
            new SpeechSynthesisUtterance(
                sentences[currentIndex]
            );


        utterance.lang =
            "sv-SE";


        utterance.rate =
            rate;


        const voice =
            getSwedishVoice();


        if (voice) {

            utterance.voice =
                voice;

        }


        speechSynthesis.speak(
            utterance
        );

    }


    /* =====================================================
       VISA AKTUELL MENING
    ===================================================== */

    function renderSentence() {

        const seen =
            getSeen();


        number.textContent =
            "MENING " +
            seen.length;


        progress.textContent =
            seen.length +
            " av " +
            sentences.length +
            " meningar i denna omgång";


        answer.value =
            "";


        result.innerHTML =
            "";


        result.className =
            "listen-result";


        nextButton.disabled =
            true;


        retryButton.disabled =
            true;


        answer.focus();

    }


    /* =====================================================
       KONTROLLERA
    ===================================================== */

    function checkAnswer() {

        const written =
            answer.value.trim();


        if (!written) {

            result.className =
                "listen-result listen-warning";


            result.innerHTML =
                "<strong>Skriv det du h\u00f6r f\u00f6rst.</strong>";

            return;

        }


        const correctSentence =
            sentences[currentIndex];


        const score =
            similarity(
                written,
                correctSentence
            );


        if (
            score >= 95
        ) {

            result.className =
                "listen-result listen-correct";


            result.innerHTML = `

                <div class="listen-result-title">
                    &#9989; R&auml;tt!
                </div>

                <p>
                    Bra jobbat. Du h&ouml;rde meningen r&auml;tt.
                </p>

                <div class="correct-sentence">
                    <span>R&auml;tt mening</span>
                    <strong>${correctSentence}</strong>
                </div>

            `;

        }

        else {

            result.className =
                "listen-result listen-wrong";


            result.innerHTML = `

                <div class="listen-result-title">
                    &#10060; Inte riktigt
                </div>

                <p>
                    J&auml;mf&ouml;r det du skrev med den r&auml;tta meningen.
                    Du kan trycka <strong>G&ouml;r om</strong> och f&ouml;rs&ouml;ka igen.
                </p>

                <div class="correct-sentence">
                    <span>R&auml;tt mening</span>
                    <strong>${correctSentence}</strong>
                </div>

            `;

        }


        nextButton.disabled =
            false;


        retryButton.disabled =
            false;


        if (
            typeof MikalLearn !==
            "undefined"
        ) {

            MikalLearn.recordAttempt(
                "lyssna",
                "lyssna_och_skriv",
                score,
                {
                    sentence:
                        correctSentence
                }
            );

        }

    }


    /* =====================================================
       GÖR OM SAMMA
    ===================================================== */

    function retrySentence() {

        answer.value =
            "";


        result.innerHTML =
            "";


        result.className =
            "listen-result";


        nextButton.disabled =
            true;


        retryButton.disabled =
            true;


        answer.focus();


        speak(0.9);

    }


    /* =====================================================
       NÄSTA
    ===================================================== */

    function nextSentence() {

        currentIndex =
            chooseNewSentence();


        renderSentence();


        window.scrollTo({
            top:
                document
                    .querySelector(
                        ".listening-panel"
                    )
                    .offsetTop - 50,

            behavior:
                "smooth"
        });

    }


    /* =====================================================
       EVENTS
    ===================================================== */

    document
        .getElementById(
            "playNormal"
        )
        .addEventListener(
            "click",
            () =>
                speak(0.9)
        );


    document
        .getElementById(
            "playSlow"
        )
        .addEventListener(
            "click",
            () =>
                speak(0.7)
        );


    document
        .getElementById(
            "checkListening"
        )
        .addEventListener(
            "click",
            checkAnswer
        );


    retryButton
        .addEventListener(
            "click",
            retrySentence
        );


    nextButton
        .addEventListener(
            "click",
            nextSentence
        );


    /* CTRL + ENTER = KONTROLLERA */

    answer.addEventListener(
        "keydown",
        event => {

            if (
                event.ctrlKey &&
                event.key === "Enter"
            ) {

                checkAnswer();

            }

        }
    );


    renderSentence();

});