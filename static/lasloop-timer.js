
document.addEventListener("DOMContentLoaded", () => {

    const STORAGE_KEY = "mikal_lasloop_timer_v1";
    const GOAL_SECONDS = 30 * 60;

    const display =
        document.getElementById("lasloopTimerDisplay");

    const status =
        document.getElementById("lasloopTimerStatus");

    const startButton =
        document.getElementById("lasloopTimerStart");

    const pauseButton =
        document.getElementById("lasloopTimerPause");

    const resetButton =
        document.getElementById("lasloopTimerReset");

    const progress =
        document.getElementById("lasloopTimerProgress");


    if (
        !display ||
        !status ||
        !startButton ||
        !pauseButton ||
        !resetButton ||
        !progress
    ) {
        return;
    }


    let state = {
        elapsed: 0,
        running: false,
        startedAt: null
    };


    function load() {

        try {

            const saved =
                JSON.parse(
                    localStorage.getItem(STORAGE_KEY)
                    || "null"
                );


            if (
                saved &&
                typeof saved === "object"
            ) {

                state.elapsed =
                    Number(saved.elapsed) || 0;

                state.running =
                    Boolean(saved.running);

                state.startedAt =
                    saved.startedAt
                    ? Number(saved.startedAt)
                    : null;


                /*
                    Om timern var igång när sidan
                    stängdes fortsätter tiden räknas.
                */

                if (
                    state.running &&
                    state.startedAt
                ) {

                    const extra =
                        Math.max(
                            0,
                            (
                                Date.now()
                                -
                                state.startedAt
                            )
                            / 1000
                        );


                    state.elapsed += extra;

                    state.startedAt =
                        Date.now();

                }

            }

        }

        catch {
        }

    }


    function save() {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(state)
        );

    }


    function currentElapsed() {

        let seconds =
            state.elapsed;


        if (
            state.running &&
            state.startedAt
        ) {

            seconds +=
                Math.max(
                    0,
                    (
                        Date.now()
                        -
                        state.startedAt
                    )
                    / 1000
                );

        }


        return seconds;

    }


    function formatTime(totalSeconds) {

        const seconds =
            Math.max(
                0,
                Math.floor(totalSeconds)
            );


        const hours =
            Math.floor(
                seconds / 3600
            );


        const minutes =
            Math.floor(
                (seconds % 3600) / 60
            );


        const secs =
            seconds % 60;


        if (hours > 0) {

            return (
                String(hours).padStart(2, "0")
                +
                ":"
                +
                String(minutes).padStart(2, "0")
                +
                ":"
                +
                String(secs).padStart(2, "0")
            );

        }


        return (
            String(minutes).padStart(2, "0")
            +
            ":"
            +
            String(secs).padStart(2, "0")
        );

    }


    function render() {

        const elapsed =
            currentElapsed();


        display.textContent =
            formatTime(elapsed);


        const percent =
            Math.min(
                100,
                (
                    elapsed
                    /
                    GOAL_SECONDS
                )
                *
                100
            );


        progress.style.width =
            percent + "%";


        if (
            elapsed >= GOAL_SECONDS
        ) {

            status.textContent =
                "✅ 30 min klara – fortsätt tills du är klar";

            status.classList.add(
                "goal-complete"
            );

        }

        else if (
            state.running
        ) {

            const left =
                Math.max(
                    0,
                    GOAL_SECONDS - elapsed
                );


            const minutesLeft =
                Math.ceil(
                    left / 60
                );


            status.textContent =
                minutesLeft
                +
                " min kvar till dagens mål";

            status.classList.remove(
                "goal-complete"
            );

        }

        else if (
            elapsed > 0
        ) {

            status.textContent =
                "Pausad";

            status.classList.remove(
                "goal-complete"
            );

        }

        else {

            status.textContent =
                "30 minuters träningsmål";

            status.classList.remove(
                "goal-complete"
            );

        }


        startButton.disabled =
            state.running;

        pauseButton.disabled =
            !state.running;

    }


    function start() {

        if (state.running) {
            return;
        }


        state.running = true;

        state.startedAt =
            Date.now();


        save();

        render();

    }


    function pause() {

        if (!state.running) {
            return;
        }


        state.elapsed =
            currentElapsed();

        state.running =
            false;

        state.startedAt =
            null;


        save();

        render();

    }


    function reset() {

        state.elapsed = 0;

        state.running = false;

        state.startedAt = null;


        save();

        render();

    }


    startButton.addEventListener(
        "click",
        start
    );


    pauseButton.addEventListener(
        "click",
        pause
    );


    resetButton.addEventListener(
        "click",
        reset
    );


    load();

    render();


    /*
        Uppdatera displayen varje 250 ms.

        VIKTIGT:
        Det finns INGEN kod här som stoppar
        LäsLoop när 30 minuter nås.

        30:00 blir 30:01, 30:02 osv.
    */

    setInterval(
        () => {

            render();


            if (state.running) {

                /*
                    Spara ibland så tiden inte
                    försvinner vid omladdning.
                */

                save();

            }

        },
        250
    );


    /*
        Spara innan sidan lämnas.
    */

    window.addEventListener(
        "beforeunload",
        () => {

            if (state.running) {

                state.elapsed =
                    currentElapsed();

                state.startedAt =
                    Date.now();

            }

            save();

        }
    );

});
