
document.addEventListener("DOMContentLoaded", () => {

    if (
        window.location.pathname
        !== "/lasa"
    ) {
        return;
    }


    if (
        document.getElementById(
            "turboReadingEntry"
        )
    ) {
        return;
    }


    const style =
        document.createElement(
            "style"
        );


    style.textContent = `

        .turbo-reading-entry {
            position: relative;
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 20px;
            align-items: center;
            overflow: hidden;

            margin: 20px 0 24px;
            padding: 22px 24px;

            color: white;
            background:
                radial-gradient(
                    circle at 85% 20%,
                    rgba(111,113,255,.72),
                    transparent 180px
                ),
                linear-gradient(
                    135deg,
                    #1c1e2a,
                    #292c46
                );

            border-radius: 20px;

            box-shadow:
                0 16px 42px
                rgba(27,30,58,.13);
        }


        .turbo-reading-entry::after {
            content: "";

            position: absolute;

            width: 150px;
            height: 150px;

            right: -65px;
            bottom: -95px;

            border: 27px solid
                rgba(255,255,255,.05);

            border-radius: 999px;
        }


        .turbo-entry-label {
            margin: 0 0 5px;

            color: #c9caff;

            font-size: 9px;
            font-weight: 950;

            letter-spacing: 1.4px;
        }


        .turbo-reading-entry h3 {
            margin: 0;

            color: white;

            font-size: 22px;

            letter-spacing: -.5px;
        }


        .turbo-reading-entry p {
            max-width: 650px;

            margin: 7px 0 0;

            color: #c7c9d7;

            font-size: 11px;
            line-height: 1.55;
        }


        .turbo-entry-button {
            position: relative;
            z-index: 2;

            display: inline-flex;
            align-items: center;

            min-height: 45px;

            padding: 0 16px;

            color: #222431;
            background: white;

            border-radius: 13px;

            text-decoration: none;

            font-size: 11px;
            font-weight: 900;

            white-space: nowrap;
        }


        @media (
            max-width: 650px
        ) {

            .turbo-reading-entry {
                grid-template-columns: 1fr;
            }


            .turbo-entry-button {
                width: fit-content;
            }

        }

    `;


    document.head.appendChild(
        style
    );


    const card =
        document.createElement(
            "section"
        );


    card.id =
        "turboReadingEntry";


    card.className =
        "turbo-reading-entry";


    card.innerHTML = `

        <div>

            <p class="turbo-entry-label">
                ⚡ NY TRÄNING
            </p>

            <h3>
                TurboLäsning
            </h3>

            <p>
                Träna automatiska ord,
                läs i fraser och mät hur
                flytet förbättras över tre rundor.
            </p>

        </div>


        <a
            href="/turbolasa"
            class="turbo-entry-button">

            Starta TurboLäsning →

        </a>

    `;


    const main =
        document.querySelector(
            "main"
        )
        ||
        document.querySelector(
            ".page-shell"
        )
        ||
        document.body;


    const h1 =
        main.querySelector(
            "h1"
        );


    if (
        h1
        &&
        h1.parentElement
    ) {

        h1.parentElement
            .insertAdjacentElement(
                "afterend",
                card
            );

    }

    else {

        main.insertBefore(
            card,
            main.firstChild
        );

    }

});
