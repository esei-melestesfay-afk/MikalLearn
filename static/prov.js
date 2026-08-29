(() => {
  'use strict';

  const REQUIRED_WORDS = 300;
  const TOPIC_STATE_KEY = 'mikal_prov_topics_v2';

  const topics = [
    'Berätta om en dag som blev bättre än du trodde. Vad hände och varför blev dagen bra?',
    'Beskriv en plats där du känner dig lugn. Hur ser platsen ut och varför tycker du om den?',
    'Vad gör en person till en bra vän? Förklara och ge några exempel.',
    'Berätta om något du vill bli bättre på. Varför är det viktigt för dig och hur kan du träna?',
    'Hur skulle din perfekta lördag se ut från morgon till kväll?',
    'Berätta om en gång du hjälpte någon. Vad gjorde du och hur kändes det efteråt?',
    'Berätta om en gång någon hjälpte dig. Vad hände och varför betydde hjälpen något?',
    'Vad tycker du är viktigt för att trivas i skolan? Förklara med exempel.',
    'Om du fick lära dig en ny sak direkt, vad skulle du välja och varför?',
    'Beskriv en person du ser upp till. Vad tycker du om hos personen?',
    'Vad skulle du göra om du fick 1 000 kronor och ville använda pengarna klokt?',
    'Berätta om en gång du var stolt över dig själv. Vad hade du gjort?',
    'Är det bra eller dåligt att använda mobilen mycket? Skriv vad du tycker och varför.',
    'Hur kan man göra en dålig dag lite bättre? Ge flera egna idéer.',
    'Berätta om ett mål du har för framtiden. Vad behöver du göra för att nå det?',
    'Vilken årstid tycker du bäst om? Beskriv årstiden och förklara varför.',
    'Om du fick planera en klassutflykt, vart skulle ni åka och vad skulle ni göra?',
    'Beskriv något du tycker om att göra efter skolan. Varför tycker du om det?',
    'Varför är det viktigt att säga sanningen? Skriv vad du tycker och ge exempel.',
    'Vad gör ett hem till en bra plats att vara på? Beskriv med egna ord.',
    'Berätta om något nytt du lärde dig nyligen. Hur lärde du dig det?',
    'Beskriv en riktigt bra morgon. Vad händer från att du vaknar tills dagen börjar?',
    'Vad är viktigast: att vinna eller att göra sitt bästa? Förklara hur du tänker.',
    'Berätta om en måltid du tycker mycket om. Hur smakar den och när brukar du äta den?',
    'Om du fick resa någonstans i Sverige, vart skulle du åka och vad skulle du vilja göra där?',
    'Beskriv en person som får dig att skratta. Vad gör personen rolig?',
    'Vad kan man göra för att vara en bra klasskompis? Ge flera exempel.',
    'Berätta om en gång något inte gick som du tänkt. Vad gjorde du då?',
    'Om du fick ändra en sak i din skoldag, vad skulle du ändra och varför?',
    'Vad tycker du om att göra när det regnar ute? Beskriv en sådan dag.',
    'Berätta om ett minne från när du var yngre som du fortfarande kommer ihåg tydligt.',
    'Vad betyder det att vara modig? Skriv vad du tycker och ge ett exempel.',
    'Beskriv ditt drömrum. Hur skulle det se ut och vad skulle finnas där?',
    'Om du fick ha ett valfritt djur som husdjur, vilket skulle du välja och varför?',
    'Berätta om en aktivitet som gör dig glad. Vad brukar du göra och med vem?',
    'Vad tycker du är viktigt när man arbetar tillsammans i en grupp?',
    'Beskriv en dag då du hade mycket att göra. Hur löste du allt?',
    'Om du fick laga middag till hela familjen, vad skulle du laga och hur skulle du göra?',
    'Berätta om en gång du lärde dig något genom att göra ett misstag.',
    'Vad tycker du att man ska göra om två vänner börjar bråka?',
    'Beskriv din favoritplats utomhus. Vad kan man se, höra och göra där?',
    'Vad betyder respekt för dig? Skriv med egna ord och ge exempel.',
    'Berätta om något som var svårt i början men blev lättare efter att du tränat.',
    'Om du fick bestämma en helt ny skoldag, vilka lektioner och aktiviteter skulle finnas?',
    'Vad är bra med att läsa böcker? Skriv vad du tycker, även om du inte läser ofta.',
    'Beskriv hur man kan vara snäll mot någon som känner sig ensam.',
    'Berätta om en gång du väntade länge på något du verkligen ville ha.',
    'Vad gör en familjedag rolig? Beskriv vad ni skulle kunna göra tillsammans.',
    'Om du fick välja ett jobb att prova på under en dag, vilket skulle du välja och varför?',
    'Beskriv en kväll då du känner dig nöjd med dagen. Vad har hänt under dagen?',
    'Vad kan man göra för att bli bättre på svenska? Skriv flera idéer och förklara dem.',
    'Berätta om en gång du behövde fatta ett viktigt beslut. Hur tänkte du?',
    'Om du fick skapa en ny app för unga, vad skulle appen hjälpa till med?',
    'Vad tycker du är viktigast för att må bra i vardagen? Förklara hur du tänker.',
    'Beskriv en person som alltid får dig att känna dig välkommen.',
    'Berätta om en gång du vågade prova något nytt. Hur kändes det före och efter?',
    'Om du fick en helt ledig dag utan skola eller läxor, hur skulle du använda den?',
    'Vad betyder ansvar för dig? Ge exempel från skolan eller hemma.',
    'Beskriv en sak du använder nästan varje dag. Varför är den viktig för dig?',
    'Vad skulle du säga till en person som känner att den vill ge upp på något svårt?'
  ];

  const topicText = document.getElementById('topicText');
  const documentTopic = document.getElementById('documentTopic');
  const newTopicBtn = document.getElementById('newTopicBtn');
  const essayInput = document.getElementById('essayInput');
  const reviewSurface = document.getElementById('reviewSurface');
  const wordCount = document.getElementById('wordCount');
  const wordFill = document.getElementById('wordFill');
  const finishBtn = document.getElementById('finishBtn');
  const editBtn = document.getElementById('editBtn');
  const checkMessage = document.getElementById('checkMessage');
  const popover = document.getElementById('suggestPopover');

  let topicIndex = -1;
  let currentErrors = [];

  function readTopicState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(TOPIC_STATE_KEY) || '{}');
      return {
        used: Array.isArray(parsed.used) ? parsed.used.filter(Number.isInteger) : [],
        last: Number.isInteger(parsed.last) ? parsed.last : null
      };
    } catch {
      return {used: [], last: null};
    }
  }

  function saveTopicState(state) {
    localStorage.setItem(TOPIC_STATE_KEY, JSON.stringify(state));
  }

  function setTopic(index) {
    topicIndex = index;
    const topic = topics[index];
    topicText.textContent = topic;
    documentTopic.textContent = topic;
  }

  function chooseFreshTopic() {
    const state = readTopicState();
    let used = [...new Set(state.used)].filter(i => i >= 0 && i < topics.length);
    let available = topics.map((_, i) => i).filter(i => !used.includes(i));

    if (!available.length) {
      used = [];
      available = topics.map((_, i) => i);
      if (topics.length > 1 && state.last !== null) {
        available = available.filter(i => i !== state.last);
      }
    }

    const next = available[Math.floor(Math.random() * available.length)];
    used.push(next);
    saveTopicState({used, last: next});
    setTopic(next);
  }

  function countWords(text) {
    const parts = text.trim().match(/[A-Za-zÀ-ÖØ-öø-ÿÅÄÖåäö]+(?:[-'][A-Za-zÀ-ÖØ-öø-ÿÅÄÖåäö]+)*/g);
    return parts ? parts.length : 0;
  }

  function updateCount() {
    const count = countWords(essayInput.value);
    wordCount.textContent = `${count} ord`;
    wordFill.style.width = `${Math.min(100, (count / REQUIRED_WORDS) * 100)}%`;

    if (count < REQUIRED_WORDS) {
      finishBtn.disabled = true;
      finishBtn.textContent = `Skriv ${REQUIRED_WORDS - count} ord till`;
    } else {
      finishBtn.disabled = false;
      finishBtn.textContent = 'Klar • kontrollera';
    }
  }

  function textNode(value) {
    return document.createTextNode(value);
  }

  function renderReview(text, errors) {
    reviewSurface.innerHTML = '';
    let cursor = 0;
    const safeErrors = [...errors]
      .filter(e => Number.isInteger(e.offset) && Number.isInteger(e.length))
      .sort((a, b) => a.offset - b.offset);

    for (const error of safeErrors) {
      if (error.offset < cursor || error.offset > text.length) continue;
      reviewSurface.appendChild(textNode(text.slice(cursor, error.offset)));

      const span = document.createElement('span');
      span.className = 'spell-error';
      span.textContent = text.slice(error.offset, error.offset + error.length);
      span.dataset.offset = String(error.offset);
      span.dataset.length = String(error.length);
      span.dataset.suggestions = JSON.stringify(error.suggestions || []);
      reviewSurface.appendChild(span);
      cursor = error.offset + error.length;
    }

    reviewSurface.appendChild(textNode(text.slice(cursor)));
    essayInput.hidden = true;
    reviewSurface.hidden = false;
    editBtn.hidden = false;
  }

  async function checkText() {
    const text = essayInput.value;
    const words = countWords(text);
    if (words < REQUIRED_WORDS) return;

    finishBtn.disabled = true;
    finishBtn.textContent = 'Kontrollerar…';
    checkMessage.className = 'check-message';
    checkMessage.textContent = 'Kontrollerar stavningen…';
    hidePopover();

    try {
      const response = await fetch('/api/prov/check', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({text})
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Kontrollen misslyckades');

      currentErrors = Array.isArray(data.errors) ? data.errors : [];
      renderReview(text, currentErrors);

      if (currentErrors.length) {
        checkMessage.className = 'check-message warning';
        checkMessage.textContent = `${currentErrors.length} ord att kolla. Tryck direkt på ett rött ord i texten.`;
      } else {
        checkMessage.className = 'check-message success';
        checkMessage.textContent = 'Bra! Inga tydliga stavfel hittades.';
      }
    } catch (error) {
      essayInput.hidden = false;
      reviewSurface.hidden = true;
      editBtn.hidden = true;
      checkMessage.className = 'check-message error';
      checkMessage.textContent = 'Stavningskontrollen kunde inte nås just nu. Texten är kvar — försök igen om en stund.';
    } finally {
      updateCount();
    }
  }

  function hidePopover() {
    popover.hidden = true;
    popover.innerHTML = '';
  }

  function showSuggestions(span) {
    const suggestions = JSON.parse(span.dataset.suggestions || '[]');
    const offset = Number(span.dataset.offset);
    const length = Number(span.dataset.length);
    const wrong = span.textContent;

    popover.innerHTML = '';
    const title = document.createElement('div');
    title.className = 'suggest-title';
    title.textContent = `RÄTT STAVNING FÖR “${wrong}”`;
    popover.appendChild(title);

    const list = document.createElement('div');
    list.className = 'suggest-list';

    if (!suggestions.length) {
      const empty = document.createElement('div');
      empty.className = 'no-suggestion';
      empty.textContent = 'Inget säkert förslag hittades.';
      list.appendChild(empty);
    } else {
      suggestions.slice(0, 5).forEach(value => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'suggest-choice';
        button.textContent = value;
        button.addEventListener('click', async () => {
          const before = essayInput.value.slice(0, offset);
          const after = essayInput.value.slice(offset + length);
          essayInput.value = before + value + after;
          updateCount();
          hidePopover();
          await checkText();
        });
        list.appendChild(button);
      });
    }

    popover.appendChild(list);
    popover.hidden = false;

    const rect = span.getBoundingClientRect();
    const width = Math.min(310, window.innerWidth - 24);
    let left = rect.left + rect.width / 2 - width / 2;
    left = Math.max(12, Math.min(window.innerWidth - width - 12, left));
    popover.style.width = `${width}px`;
    popover.style.left = `${left}px`;
    popover.style.top = '0px';
    const h = popover.getBoundingClientRect().height;
    let top = rect.top - h - 10;
    if (top < 10) top = rect.bottom + 10;
    popover.style.top = `${top}px`;
  }

  function resetWritingForNewTopic() {
    essayInput.value = '';
    essayInput.hidden = false;
    reviewSurface.hidden = true;
    reviewSurface.innerHTML = '';
    editBtn.hidden = true;
    currentErrors = [];
    checkMessage.className = 'check-message';
    checkMessage.textContent = '';
    hidePopover();
    updateCount();
  }

  newTopicBtn.addEventListener('click', () => {
    const hasText = countWords(essayInput.value) > 0;
    if (hasText && !confirm('Vill du byta ämne? Texten du har skrivit rensas då.')) return;
    resetWritingForNewTopic();
    chooseFreshTopic();
    essayInput.focus();
  });

  essayInput.addEventListener('input', updateCount);
  finishBtn.addEventListener('click', checkText);

  editBtn.addEventListener('click', () => {
    hidePopover();
    reviewSurface.hidden = true;
    essayInput.hidden = false;
    editBtn.hidden = true;
    checkMessage.className = 'check-message';
    checkMessage.textContent = '';
    essayInput.focus();
  });

  reviewSurface.addEventListener('click', event => {
    const target = event.target.closest('.spell-error');
    if (target) showSuggestions(target);
  });

  document.addEventListener('click', event => {
    if (!popover.hidden && !popover.contains(event.target) && !event.target.closest('.spell-error')) hidePopover();
  });

  chooseFreshTopic();
  updateCount();
})();
