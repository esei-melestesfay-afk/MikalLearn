(() => {
  'use strict';
  const REQUIRED_WORDS = 200;
  const TOPIC_STATE_KEY = 'mikal_prov_topics_v3';
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
  const topicText=document.getElementById('topicText');
  const documentTopic=document.getElementById('documentTopic');
  const newTopicBtn=document.getElementById('newTopicBtn');
  const essayInput=document.getElementById('essayInput');
  const wordCount=document.getElementById('wordCount');
  const wordFill=document.getElementById('wordFill');
  const finishBtn=document.getElementById('finishBtn');
  const doneMessage=document.getElementById('doneMessage');
  let topicIndex=-1;
  function readState(){try{const p=JSON.parse(localStorage.getItem(TOPIC_STATE_KEY)||'{}');return{used:Array.isArray(p.used)?p.used.filter(Number.isInteger):[],last:Number.isInteger(p.last)?p.last:null};}catch{return{used:[],last:null};}}
  function saveState(state){localStorage.setItem(TOPIC_STATE_KEY,JSON.stringify(state));}
  function setTopic(i){topicIndex=i;topicText.textContent=topics[i];documentTopic.textContent=topics[i];doneMessage.textContent='';doneMessage.className='done-message';}
  function chooseFreshTopic(){const state=readState();let used=[...new Set(state.used)].filter(i=>i>=0&&i<topics.length);let available=topics.map((_,i)=>i).filter(i=>!used.includes(i));if(!available.length){used=[];available=topics.map((_,i)=>i);if(topics.length>1&&state.last!==null)available=available.filter(i=>i!==state.last);}const next=available[Math.floor(Math.random()*available.length)];used.push(next);saveState({used,last:next});setTopic(next);}
  function countWords(text){const parts=text.trim().match(/[A-Za-zÀ-ÖØ-öø-ÿÅÄÖåäö]+(?:[-'][A-Za-zÀ-ÖØ-öø-ÿÅÄÖåäö]+)*/g);return parts?parts.length:0;}
  function updateCount(){const count=countWords(essayInput.value);wordCount.textContent=`${count} ord`;wordFill.style.width=`${Math.min(100,(count/REQUIRED_WORDS)*100)}%`;if(count<REQUIRED_WORDS){finishBtn.disabled=true;finishBtn.textContent=`Skriv ${REQUIRED_WORDS-count} ord till`;doneMessage.textContent='';doneMessage.className='done-message';}else{finishBtn.disabled=false;finishBtn.textContent='Klar';}}
  newTopicBtn.addEventListener('click',()=>{chooseFreshTopic();essayInput.focus();});
  essayInput.addEventListener('input',updateCount);
  finishBtn.addEventListener('click',()=>{if(countWords(essayInput.value)<REQUIRED_WORDS)return;doneMessage.className='done-message success';doneMessage.textContent='Klar ✓ Bra jobbat. Läs gärna igenom texten en gång själv.';finishBtn.textContent='Klar ✓';});
  chooseFreshTopic();updateCount();
})();
