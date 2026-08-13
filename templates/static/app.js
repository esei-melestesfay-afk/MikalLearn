/* ============================================
   MIKALLEARN
   30 MIN TIMER FÖR:
   SKRIVA / LÄSA / LYSSNA
============================================ */

const MikalLearn = (() => {

    const LIMIT = 30 * 60;

    let interval = null;


    /* ========================================
       DATUM
    ======================================== */

    function today() {

        const date = new Date();

        const year = date.getFullYear();

        const month =
            String(date.getMonth() + 1)
                .padStart(2, "0");

        const day =
            String(date.getDate())
                .padStart(2, "0");

        return `${year}-${month}-${day}`;

    }


    /* ========================================
       VILKEN DEL?
    ======================================== */

    function getSkill() {

        let path =
            window.location.pathname
                .replace(/\/+$/, "");


        if (!path) {
            path = "/";
        }


        if (path === "/skriva") {
            return "skriva";
        }


        if (path === "/lasa") {
            return "lasa";
        }


        if (path === "/lyssna") {
            return "lyssna";
        }


        return null;

    }


    function getSkillName(skill) {

        const names = {
            skriva: "Skriva",
            lasa: "Läsa",
            lyssna: "Lyssna"
        };

        return names[skill] || "";
    }


    function getSkillIcon(skill) {

        const icons = {
            skriva: "✍️",
            lasa: "📖",
            lyssna: "🎧"
        };

        return icons[skill] || "⏱️";
    }


    /* ========================================
       STORAGE
    ======================================== */

    function storageKey(skill) {

        return (
            "mikal_skill_timer_" +
            skill +
            "_" +
            today()
        );

    }


    function getData(skill) {

        if (!skill) {

            return {
                seconds: 0,
                running: false
            };

        }


        const saved =
            JSON.parse(
                localStorage.getItem(
                    storageKey(skill)
                ) || "{}"
            );


        return {

            seconds:
                Number(saved.seconds) || 0,

            running:
                saved.running === true

        };

    }


    function saveData(
        skill,
        seconds,
        running
    ) {

        localStorage.setItem(

            storageKey(skill),

            JSON.stringify({

                seconds:
                    Math.min(
                        Math.max(seconds, 0),
                        LIMIT
                    ),

                running

            })

        );

    }


    /* ========================================
       TID
    ======================================== */

    function formatTime(seconds) {

        const minutes =
            Math.floor(
                seconds / 60
            );


        const secs =
            seconds % 60;


        return (
            String(minutes)
                .padStart(2, "0")
            +
            ":"
            +
            String(secs)
                .padStart(2, "0")
        );

    }


    /* ========================================
       START
    ======================================== */

    function startTimer() {

        const skill =
            getSkill();


        if (!skill) {
            return;
        }


        const data =
            getData(skill);


        if (
            data.seconds >=
            LIMIT
        ) {

            showFinished(skill);
            return;

        }


        saveData(
            skill,
            data.seconds,
            true
        );


        startInterval();

        updatePageTimer();

    }


    /* ========================================
       PAUS
    ======================================== */

    function pauseTimer() {

        const skill =
            getSkill();


        if (!skill) {
            return;
        }


        const data =
            getData(skill);


        saveData(
            skill,
            data.seconds,
            false
        );


        stopInterval();

        updatePageTimer();

    }


    /* ========================================
       RESTART 00:00
    ======================================== */

    function resetTimer() {

        const skill =
            getSkill();


        if (!skill) {
            return;
        }


        const ok =
            confirm(
                "Vill du börja om timern från 00:00?"
            );


        if (!ok) {
            return;
        }


        stopInterval();


        saveData(
            skill,
            0,
            false
        );


        const overlay =
            document.getElementById(
                "skillFinished"
            );


        if (overlay) {
            overlay.remove();
        }


        updatePageTimer();

    }


    /* ========================================
       TIMER MOTOR
    ======================================== */

    function startInterval() {

        if (interval) {
            return;
        }


        interval =
            setInterval(() => {

                const skill =
                    getSkill();


                if (!skill) {

                    stopInterval();

                    return;

                }


                const data =
                    getData(skill);


                if (!data.running) {

                    stopInterval();

                    return;

                }


                let seconds =
                    data.seconds + 1;


                if (
                    seconds >=
                    LIMIT
                ) {

                    seconds =
                        LIMIT;


                    saveData(
                        skill,
                        seconds,
                        false
                    );


                    stopInterval();

                    updatePageTimer();

                    showFinished(skill);

                    return;

                }


                saveData(
                    skill,
                    seconds,
                    true
                );


                updatePageTimer();

            }, 1000);

    }


    function stopInterval() {

        if (interval) {

            clearInterval(interval);

            interval = null;

        }

    }


    /* ========================================
       SKAPA TIMERKORT
    ======================================== */

    function createTimerCard() {

        const skill =
            getSkill();


        if (!skill) {
            return;
        }


        if (
            document.querySelector(
                ".skill-timer-card"
            )
        ) {
            return;
        }


        const subtitle =
            document.querySelector(
                ".subtitle"
            );


        if (!subtitle) {
            return;
        }


        const card =
            document.createElement(
                "div"
            );


        card.className =
            "skill-timer-card";


        card.innerHTML = `

            <div class="skill-timer-left">

                <div class="skill-timer-icon">
                    ${getSkillIcon(skill)}
                </div>


                <div>

                    <span class="skill-timer-label">
                        DAGENS ${getSkillName(skill).toUpperCase()}
                    </span>

                    <h3>
                        30 minuters träning
                    </h3>

                    <p>
                        Starta när du är redo.
                        Pausa när du vill.
                    </p>

                </div>

            </div>


            <div class="skill-timer-right">

                <div class="skill-clock">

                    <span data-skill-status>
                        Redo
                    </span>

                    <strong data-skill-time>
                        00:00
                    </strong>

                    <small>
                        av 30:00
                    </small>

                </div>


                <div class="skill-timer-buttons">

                    <button
                        type="button"
                        class="skill-start"
                        data-skill-start>
                        ▶ Starta
                    </button>


                    <button
                        type="button"
                        class="skill-pause"
                        data-skill-pause>
                        ⏸ Pausa
                    </button>


                    <button
                        type="button"
                        class="skill-reset"
                        data-skill-reset>
                        ↻ Börja om
                    </button>

                </div>

            </div>


            <div class="skill-progress-track">

                <div
                    class="skill-progress-fill"
                    data-skill-progress>
                </div>

            </div>

        `;


        subtitle.insertAdjacentElement(
            "afterend",
            card
        );


        card
            .querySelector(
                "[data-skill-start]"
            )
            .addEventListener(
                "click",
                startTimer
            );


        card
            .querySelector(
                "[data-skill-pause]"
            )
            .addEventListener(
                "click",
                pauseTimer
            );


        card
            .querySelector(
                "[data-skill-reset]"
            )
            .addEventListener(
                "click",
                resetTimer
            );

    }


    /* ========================================
       UPPDATERA TIMER
    ======================================== */

    function updatePageTimer() {

        const skill =
            getSkill();


        if (!skill) {
            return;
        }


        const data =
            getData(skill);


        const percent =
            Math.min(
                100,
                data.seconds /
                LIMIT *
                100
            );


        const time =
            document.querySelector(
                "[data-skill-time]"
            );


        if (time) {

            time.textContent =
                formatTime(
                    data.seconds
                );

        }


        const status =
            document.querySelector(
                "[data-skill-status]"
            );


        if (status) {

            if (
                data.seconds >=
                LIMIT
            ) {

                status.textContent =
                    "Klar ✓";

            }

            else if (
                data.running
            ) {

                status.textContent =
                    "Träning pågår";

            }

            else if (
                data.seconds > 0
            ) {

                status.textContent =
                    "Pausad";

            }

            else {

                status.textContent =
                    "Redo";

            }

        }


        const progress =
            document.querySelector(
                "[data-skill-progress]"
            );


        if (progress) {

            progress.style.width =
                percent + "%";

        }


        const start =
            document.querySelector(
                "[data-skill-start]"
            );


        const pause =
            document.querySelector(
                "[data-skill-pause]"
            );


        if (start) {

            start.disabled =
                data.running ||
                data.seconds >=
                LIMIT;

        }


        if (pause) {

            pause.disabled =
                !data.running;

        }

    }


    /* ========================================
       STARTSIDANS PROGRESS
    ======================================== */

    function updateHomeStatus() {

        document
            .querySelectorAll(
                "[data-home-skill]"
            )
            .forEach(element => {

                const skill =
                    element.dataset
                        .homeSkill;


                const data =
                    getData(skill);


                const minutes =
                    Math.floor(
                        data.seconds / 60
                    );


                const value =
                    element.querySelector(
                        "[data-home-skill-time]"
                    );


                if (value) {

                    if (
                        data.seconds >=
                        LIMIT
                    ) {

                        value.textContent =
                            "30 / 30 min ✓";

                    }

                    else {

                        value.textContent =
                            `${minutes} / 30 min`;

                    }

                }


                const bar =
                    element.querySelector(
                        "[data-home-skill-progress]"
                    );


                if (bar) {

                    bar.style.width =
                        Math.min(
                            100,
                            data.seconds /
                            LIMIT *
                            100
                        ) + "%";

                }

            });

    }


    /* ========================================
       PASS KLART
    ======================================== */

    function showFinished(skill) {

        if (
            document.getElementById(
                "skillFinished"
            )
        ) {
            return;
        }


        const overlay =
            document.createElement(
                "div"
            );


        overlay.id =
            "skillFinished";


        overlay.className =
            "skill-finished-overlay";


        overlay.innerHTML = `

            <div class="skill-finished-card">

                <div class="finished-icon">
                    ${getSkillIcon(skill)}
                </div>

                <p class="practice-label">
                    ${getSkillName(skill).toUpperCase()}
                    KLAR
                </p>

                <h2>
                    30 minuter klara!
                </h2>

                <p>
                    Bra jobbat med
                    <strong>
                        ${getSkillName(skill)}
                    </strong>.
                </p>

                <a
                    href="/"
                    class="limit-home">
                    Till startsidan
                </a>

            </div>

        `;


        document.body.appendChild(
            overlay
        );

    }


    /* ========================================
       RESULTAT - FÖR SENARE AI
    ======================================== */

    function recordAttempt(
        category,
        exercise,
        score,
        extra = {}
    ) {

        let attempts =
            JSON.parse(
                localStorage.getItem(
                    "mikal_attempts"
                ) || "[]"
            );


        attempts.push({

            date: today(),

            category,

            exercise,

            score,

            created_at:
                new Date()
                    .toISOString(),

            ...extra

        });


        attempts =
            attempts.slice(-1000);


        localStorage.setItem(
            "mikal_attempts",
            JSON.stringify(
                attempts
            )
        );

    }


    /* ========================================
       INIT
    ======================================== */

    function init() {

        const skill =
            getSkill();


        if (skill) {

            createTimerCard();

            updatePageTimer();


            const data =
                getData(skill);


            if (
                data.running &&
                data.seconds <
                LIMIT
            ) {

                startInterval();

            }

        }


        updateHomeStatus();

    }


    return {

        init,

        startTimer,

        pauseTimer,

        resetTimer,

        recordAttempt

    };

})();


document.addEventListener(
    "DOMContentLoaded",
    MikalLearn.init
);