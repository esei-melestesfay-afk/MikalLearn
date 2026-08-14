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

        "Jag brukar Ã¤ta frukost innan jag gÃ¥r till skolan.",
        "I morse vaknade jag tidigare Ã¤n vanligt.",
        "Bussen kom fem minuter senare Ã¤n den brukar.",
        "Efter skolan gick jag direkt hem.",
        "Hon glÃ¶mde sin vattenflaska pÃ¥ kÃ¶ksbordet.",
        "Vi bÃ¶rjade lektionen klockan Ã¥tta.",
        "Han gjorde sina lÃ¤xor innan middagen.",
        "Jag behÃ¶ver kÃ¶pa mjÃ¶lk pÃ¥ vÃ¤gen hem.",
        "PÃ¥ fredag ska klassen skriva ett prov.",
        "Hon tog pÃ¥ sig jackan eftersom det var kallt.",

        "Jag missade bussen eftersom jag vaknade sent.",
        "Efter trÃ¤ningen var jag trÃ¶tt men nÃ¶jd.",
        "Vi gick till biblioteket fÃ¶r att studera tillsammans.",
        "Hon fÃ¶rsÃ¶ker fÃ¶rbÃ¤ttra sin svenska varje dag.",
        "Jag lÃ¤ste frÃ¥gan tvÃ¥ gÃ¥nger innan jag svarade.",
        "LÃ¤raren fÃ¶rklarade uppgiften innan vi bÃ¶rjade.",
        "Han sparar pengar fÃ¶r att kÃ¶pa en ny dator.",
        "PÃ¥ kvÃ¤llen brukar jag fÃ¶rbereda saker infÃ¶r nÃ¤sta dag.",
        "Det bÃ¶rjade regna nÃ¤r vi gick hem frÃ¥n skolan.",
        "Jag tycker att det Ã¤r lÃ¤ttare att arbeta nÃ¤r det Ã¤r lugnt.",

        "Sara trÃ¤nar fotboll flera gÃ¥nger i veckan.",
        "Hon vill bli bÃ¤ttre dÃ¤rfÃ¶r trÃ¤nar hon regelbundet.",
        "Vi stannade hemma eftersom vÃ¤dret var dÃ¥ligt.",
        "Min kompis hjÃ¤lpte mig nÃ¤r jag inte fÃ¶rstod uppgiften.",
        "Jag skrev ner de ord som jag inte fÃ¶rstod.",
        "Efter maten satte han sig och gjorde sina lÃ¤xor.",
        "Hon var nervÃ¶s innan provet men fÃ¶rsÃ¶kte hÃ¥lla sig lugn.",
        "Jag behÃ¶ver planera min tid bÃ¤ttre den hÃ¤r veckan.",
        "Vi jÃ¤mfÃ¶rde vÃ¥ra svar efter att uppgiften var klar.",
        "Han mÃ¤rkte att trÃ¤ningen gav bÃ¤ttre resultat.",

        "Det Ã¤r viktigt att fÃ¶rstÃ¥ frÃ¥gan innan man bÃ¶rjar skriva.",
        "Hon Ã¤ndrade sin plan eftersom den fÃ¶rsta inte fungerade.",
        "Jag fÃ¶rsÃ¶kte fÃ¶rklara problemet med mina egna ord.",
        "Efter nÃ¥gra veckor mÃ¤rkte hon en tydlig fÃ¶rbÃ¤ttring.",
        "Vi fick mÃ¶jlighet att gÃ¶ra om uppgiften.",
        "LÃ¤raren bad eleverna att arbeta i mindre grupper.",
        "Han kom fÃ¶r sent eftersom tÃ¥get var fÃ¶rsenat.",
        "Jag blev fÃ¶rvÃ¥nad nÃ¤r jag sÃ¥g resultatet.",
        "Hon fortsatte fÃ¶rsÃ¶ka trots att uppgiften var svÃ¥r.",
        "Vi behÃ¶ver ta reda pÃ¥ varfÃ¶r problemet uppstod.",

        "NÃ¤r jag kom hem mÃ¤rkte jag att mobilen lÃ¥g kvar i skolan.",
        "Hon bÃ¶rjade plugga tidigare fÃ¶r att slippa stressa pÃ¥ kvÃ¤llen.",
        "Eleverna diskuterade olika lÃ¶sningar pÃ¥ problemet.",
        "Jag fÃ¶rsÃ¶kte koncentrera mig trots att det var mycket ljud.",
        "Han fÃ¶rstod texten bÃ¤ttre efter att han hade lÃ¤st den igen.",
        "Hon skrev en kort sammanfattning med sina egna ord.",
        "Vi fick vÃ¤lja vilket Ã¤mne vi ville arbeta med.",
        "Jag frÃ¥gade lÃ¤raren eftersom jag inte fÃ¶rstod instruktionen.",
        "Efter lektionen gick vi igenom svaren tillsammans.",
        "Han bestÃ¤mde sig fÃ¶r att Ã¤ndra sina studievanor.",

        "SÃ¶mn kan pÃ¥verka hur lÃ¤tt det Ã¤r att koncentrera sig.",
        "Det finns flera anledningar till att mÃ¤nniskor trÃ¤nar.",
        "Hon jÃ¤mfÃ¶rde priser innan hon bestÃ¤mde vad hon skulle kÃ¶pa.",
        "Vi mÃ¥ste tÃ¤nka pÃ¥ konsekvenserna innan vi fattar ett beslut.",
        "Han fÃ¶rsÃ¶kte beskriva situationen sÃ¥ tydligt som mÃ¶jligt.",
        "Resultatet blev bÃ¤ttre Ã¤n hon hade fÃ¶rvÃ¤ntat sig.",
        "Jag tycker att det Ã¤r viktigt att lyssna pÃ¥ andra mÃ¤nniskor.",
        "Hon hade svÃ¥rt att komma igÃ¥ng men fortsatte Ã¤ndÃ¥.",
        "NÃ¤r uppgiften var klar kontrollerade han sitt svar en gÃ¥ng till.",
        "Vi anvÃ¤nde informationen i texten fÃ¶r att svara pÃ¥ frÃ¥gorna.",

        "PÃ¥ morgonen upptÃ¤ckte hon att cykeln hade fÃ¥tt punktering.",
        "Han tog en tidigare buss fÃ¶r att vara sÃ¤ker pÃ¥ att komma i tid.",
        "Efter presentationen fick gruppen frÃ¥gor frÃ¥n resten av klassen.",
        "Jag skrev en lista Ã¶ver det viktigaste jag behÃ¶vde gÃ¶ra.",
        "Hon fÃ¶rsÃ¶kte hitta en lÃ¶sning istÃ¤llet fÃ¶r att ge upp.",
        "NÃ¤r matchen bÃ¶rjade var bÃ¥da lagen vÃ¤ldigt fokuserade.",
        "Vi planerade arbetet innan vi bÃ¶rjade skriva rapporten.",
        "Han lÃ¤ste igenom texten och rÃ¤ttade flera stavfel.",
        "Jag fÃ¶rstod inte ordet fÃ¶rst men meningen hjÃ¤lpte mig.",
        "Hon blev klar tidigare eftersom hon hade planerat arbetet.",

        "Trots att han var trÃ¶tt bestÃ¤mde han sig fÃ¶r att gÃ¶ra klart uppgiften.",
        "NÃ¤r jag jÃ¤mfÃ¶rde de tvÃ¥ texterna sÃ¥g jag flera tydliga skillnader.",
        "Hon fÃ¶rklarade sin Ã¥sikt och gav ett exempel som stÃ¶d.",
        "Vi diskuterade varfÃ¶r samma problem kan ha flera olika lÃ¶sningar.",
        "Han bÃ¶rjade fÃ¶rstÃ¥ sambandet mellan sÃ¶mn och koncentration.",
        "Efter att hon hade lÃ¤st texten kunde hon sammanfatta huvudidÃ©n.",
        "Jag fÃ¶rsÃ¶kte anvÃ¤nda det nya ordet i en egen mening.",
        "LÃ¤raren ville att vi skulle motivera vÃ¥ra svar tydligare.",
        "Hon upptÃ¤ckte att smÃ¥ fÃ¶rÃ¤ndringar kunde gÃ¶ra stor skillnad.",
        "Vi behÃ¶vde anvÃ¤nda information frÃ¥n flera delar av texten."

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
       VÃ„LJ NY MENING UTAN REPETITION
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
       SVENSK RÃ–ST
    ===================================================== */

    function speak(rate = 0.9) {

        const mode =
            rate <= 0.75
                ? "slow"
                : "normal";


        if (
            window.MikalTTS
        ) {

            window.MikalTTS.play(
                sentences[currentIndex],
                mode
            );

        }

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
            " meningar i denna omgÃ¥ng";


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
       GÃ–R OM SAMMA
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
       NÃ„STA
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
