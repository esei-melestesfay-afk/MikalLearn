
document.addEventListener(
    "DOMContentLoaded",
    () => {

        if (
            window.location.pathname
            !== "/lasa"
        ) {

            return;

        }


        if (
            document.getElementById(
                "lasLoopEntry"
            )
        ) {

            return;

        }


        const style =
            document.createElement(
                "style"
            );


        style.textContent = `

            .lasloop-entry {
                position: relative;

                display: grid;

                grid-template-columns:
                    1fr auto;

                align-items: center;

                gap: 20px;

                overflow: hidden;

                margin:
                    18px 0
                    23px;

                padding:
                    21px 23px;

                color: white;

                background:
                    radial-gradient(
                        circle at 86% 12%,
                        rgba(105,107,255,.76),
                        transparent 170px
                    ),
                    linear-gradient(
                        135deg,
                        #1c1e29,
                        #292c44
                    );

                border-radius: 19px;

                box-shadow:
                    0 15px 40px
                    rgba(30,33,61,.12);
            }


            .lasloop-entry-label {
                margin:
                    0 0 4px;

                color:
                    #cbccff;

                font-size: 9px;

                font-weight: 950;

                letter-spacing:
                    1.4px;
            }


            .lasloop-entry h3 {
                margin: 0;

                color: white;

                font-size: 21px;

                letter-spacing:
                    -.5px;
            }


            .lasloop-entry p {
                max-width: 570px;

                margin:
                    6px 0 0;

                color:
                    #c9cad7;

                font-size: 10px;

                line-height: 1.55;
            }


            .lasloop-entry a {
                position: relative;

                z-index: 2;

                display: inline-flex;

                align-items: center;

                min-height: 44px;

                padding:
                    0 16px;

                color:
                    #232531;

                background:
                    white;

                border-radius:
                    12px;

                text-decoration:
                    none;

                white-space:
                    nowrap;

                font-size:
                    10px;

                font-weight:
                    900;
            }


            @media (
                max-width: 650px
            ) {

                .lasloop-entry {
                    grid-template-columns:
                        1fr;
                }


                .lasloop-entry a {
                    width:
                        fit-content;
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
            "lasLoopEntry";


        card.className =
            "lasloop-entry";


        card.innerHTML = `

            <div>

                <p class="lasloop-entry-label">
                    ⚡ SNABBLÄSNING
                </p>

                <h3>
                    LäsLoop
                </h3>

                <p>
                    Läs ett ord, klicka och få nästa direkt.
                    Svåra ord kommer tillbaka tills de känns automatiska.
                </p>

            </div>


            <a href="/lasloop">
                Starta LäsLoop →
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


        const heading =
            main.querySelector(
                "h1"
            );


        if (
            heading
            &&
            heading.parentElement
        ) {

            heading.parentElement
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

    }
);
