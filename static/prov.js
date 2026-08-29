(() => {
  'use strict';

  const topics = [
    'Berätta om en dag som blev bättre än du trodde.',
    'Beskriv en plats där du känner dig lugn och varför du tycker om den.',
    'Vad gör en person till en bra vän? Förklara med exempel.',
    'Berätta om något du vill bli bättre på och varför.',
    'Hur skulle din perfekta lördag se ut från morgon till kväll?',
    'Berätta om en gång du hjälpte någon eller någon hjälpte dig.',
    'Vad tycker du är viktigt för att trivas i skolan?',
    'Om du fick lära dig en ny sak direkt, vad skulle du välja och varför?',
    'Beskriv en person du ser upp till och vad du gillar med personen.',
    'Vad skulle du göra om du fick 1 000 kronor och ville använda dem klokt?',
    'Berätta om en gång du var stolt över dig själv.',
    'Är det bra att använda mobilen mycket? Skriv vad du tycker och varför.',
    'Hur kan man göra en dålig dag lite bättre?',
    'Berätta om ett mål du har för framtiden och hur du kan nå det.',
    'Vilken årstid tycker du bäst om? Beskriv och förklara varför.',
    'Om du fick planera en klassutflykt, vart skulle ni åka och vad skulle ni göra?',
    'Beskriv något du tycker om att göra efter skolan.',
    'Varför är det viktigt att säga sanningen? Skriv vad du tycker.',
    'Vad gör ett hem till en bra plats att vara på?',
    'Berätta om något nytt du lärde dig nyligen.'
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

  let topicIndex = Math.floor(Math.random() * topics.length);
  let currentErrors = [];

  function setTopic(index) {
    topicIndex = (index + topics.length) % topics.length;
    const topic = topics[topicIndex];
    topicText.textContent = topic;
    documentTopic.textContent = topic;
  }

  function countWords(text) {
    const parts = text.trim().match(/[A-Za-zÀ-ÖØ-öø-ÿÅÄÖåäö]+(?:[-'][A-Za-zÀ-ÖØ-öø-ÿÅÄÖåäö]+)*/g);
    return parts ? parts.length : 0;
  }

  function updateCount() {
    const count = countWords(essayInput.value);
    wordCount.textContent = `${count} ord`;
    wordFill.style.width = `${Math.min(100, (count / 150) * 100)}%`;

    if (count < 100) {
      finishBtn.disabled = true;
      finishBtn.textContent = `Skriv ${100 - count} ord till`;
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
      .filter(e => Number.isInteger(e.offset) && Number.isInteger(e.length) && e.offset >= cursor)
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
    if (words < 100) return;

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
        checkMessage.textContent = `${currentErrors.length} ord att kolla. Tryck på ett rött ord för att se rätt stavning.`;
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
    title.textContent = `FÖRSLAG FÖR “${wrong}”`;
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
    const width = Math.min(280, window.innerWidth - 24);
    let left = rect.left + rect.width / 2 - width / 2;
    left = Math.max(12, Math.min(window.innerWidth - width - 12, left));
    let top = rect.top - 12;
    popover.style.width = `${width}px`;
    popover.style.left = `${left}px`;
    popover.style.top = '0px';
    const h = popover.getBoundingClientRect().height;
    top = rect.top - h - 10;
    if (top < 10) top = rect.bottom + 10;
    popover.style.top = `${top}px`;
  }

  newTopicBtn.addEventListener('click', () => {
    let next = topicIndex;
    while (next === topicIndex && topics.length > 1) next = Math.floor(Math.random() * topics.length);
    setTopic(next);
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

  setTopic(topicIndex);
  updateCount();
})();
