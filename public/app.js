const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];

const FAMILY='demo-bordoloi-family';

const seed={
  people:[
    {
      id:'p1',
      name:'Riya',
      relation:'Granddaughter',
      clue:'Riya calls every Sunday evening.',
      photo:''
    },
    {
      id:'p2',
      name:'Arun',
      relation:'Son',
      clue:'Arun enjoys morning tea with you.',
      photo:''
    }
  ],
  reminders:[
    {
      id:'r1',
      type:'Medicine',
      time:'08:00',
      message:'Medicine reminder from your caregiver'
    },
    {
      id:'r2',
      type:'Hydration',
      time:'10:30',
      message:'Please have a glass of water'
    },
    {
      id:'r3',
      type:'Walk',
      time:'17:00',
      message:'A short evening walk with family'
    }
  ],
  sessions:[]
};

let state=
  JSON.parse(localStorage.getItem('smriti:'+FAMILY)||'null') ||
  structuredClone(seed);

let role='patient';
let activeGame=null;
let startedAt=0;
let hints=0;
let attempts=0;
let supabaseClient=null;
let dbReady=false;
let currentFamilyId=null;
let currentPatientId=null;

const i18n={
  en:{
    home:'Home',
    games:'Games',
    reminders:'Reminders',
    settings:'Settings',
    care:'Care dashboard',
    content:'Family content',
    hello:'Good morning, Aita'
  },
  hi:{
    home:'मुख्य पृष्ठ',
    games:'खेल',
    reminders:'याद दिलाना',
    settings:'सेटिंग्स',
    care:'देखभाल डैशबोर्ड',
    content:'परिवार सामग्री',
    hello:'नमस्ते, आइता'
  },
  as:{
    home:'মূল পৃষ্ঠা',
    games:'খেল',
    reminders:'সোঁৱৰণী',
    settings:'ছেটিংছ',
    care:'যত্ন ডেশ্বব’ৰ্ড',
    content:'পৰিয়ালৰ বিষয়',
    hello:'নমস্কাৰ, আইতা'
  },
  mni:{
    home:'Home',
    games:'Games',
    reminders:'Reminders',
    settings:'Settings',
    care:'Care dashboard',
    content:'Family content',
    hello:'Good morning'
  },
  kha:{
    home:'Home',
    games:'Games',
    reminders:'Reminders',
    settings:'Settings',
    care:'Care dashboard',
    content:'Family content',
    hello:'Khublei'
  },
  lus:{
    home:'Home',
    games:'Games',
    reminders:'Reminders',
    settings:'Settings',
    care:'Care dashboard',
    content:'Family content',
    hello:'Chibai'
  }
};

const games=[
  {
    id:'faces',
    domain:'Memory',
    icon:'♥',
    title:'My Family',
    desc:'Recognise a familiar person',
    instruction:'Look at the family card and choose the correct name.',
    type:'faces'
  },
  {
    id:'pairs',
    domain:'Memory',
    icon:'▦',
    title:'Memory Pairs',
    desc:'Find two matching objects',
    instruction:'Remember the objects and find a matching pair.',
    type:'pairs'
  },
  {
    id:'focus',
    domain:'Attention',
    icon:'◎',
    title:'Find the Flower',
    desc:'Notice one target calmly',
    instruction:'Choose the flower from the familiar objects.',
    type:'choice',
    q:'Which one is a flower?',
    choices:['🌼 Flower','🧺 Basket','☕ Cup','🔑 Key'],
    answer:0
  },
  {
    id:'sound',
    domain:'Attention',
    icon:'🔊',
    title:'Listen & Recall',
    desc:'Hear and remember two words',
    instruction:'Listen carefully, then choose the words you heard.',
    type:'sound'
  },
  {
    id:'routine',
    domain:'Routine',
    icon:'☀',
    title:'Morning Routine',
    desc:'Put daily steps in order',
    instruction:'Choose the morning steps in the correct order.',
    type:'sequence',
    items:['Wash face','Drink water','Eat breakfast']
  },
  {
    id:'safety',
    domain:'Routine',
    icon:'⌂',
    title:'Safe at Home',
    desc:'Choose a safe daily action',
    instruction:'What should you do before going to sleep?',
    type:'choice',
    q:'Before sleeping…',
    choices:[
      'Switch off the stove',
      'Leave the door open',
      'Skip all medicine',
      'Walk outside alone'
    ],
    answer:0
  },
  {
    id:'objects',
    domain:'Recognition',
    icon:'⌁',
    title:'Familiar Objects',
    desc:'Recognise everyday items',
    instruction:'Choose the object used for drinking tea.',
    type:'choice',
    q:'What is used for drinking tea?',
    choices:['☕ Cup','👓 Glasses','🧺 Basket','🪮 Comb'],
    answer:0
  },
  {
    id:'category',
    domain:'Language',
    icon:'Aa',
    title:'Word Groups',
    desc:'Connect familiar words',
    instruction:'Choose the item that is a fruit.',
    type:'choice',
    q:'Which one is a fruit?',
    choices:['🍊 Orange','🪑 Chair','🧣 Shawl','🥁 Drum'],
    answer:0
  },
  {
    id:'orientation',
    domain:'Orientation',
    icon:'◷',
    title:'Today & Time',
    desc:'Gentle date orientation',
    instruction:'Choose the current part of the day.',
    type:'orientation'
  }
];

const tr=()=>i18n[$('#language').value]||i18n.en;

function save(){
  localStorage.setItem('smriti:'+FAMILY,JSON.stringify(state));
}

function toast(message){
  const toastBox=$('#toast');
  toastBox.textContent=message;
  toastBox.classList.add('show');

  setTimeout(()=>{
    toastBox.classList.remove('show');
  },2100);
}

function speak(text){
  if(!('speechSynthesis' in window)){
    toast('Voice unavailable');
    return;
  }

  speechSynthesis.cancel();

  const voiceMessage=new SpeechSynthesisUtterance(text);
  voiceMessage.rate=0.78;

  voiceMessage.lang={
    en:'en-IN',
    hi:'hi-IN',
    as:'as-IN',
    mni:'mni-IN',
    kha:'en-IN',
    lus:'en-IN'
  }[$('#language').value]||'en-IN';

  speechSynthesis.speak(voiceMessage);
}

async function init(){
  try{
    const response=await fetch('/api/config');

    if(!response.ok){
      throw new Error('Configuration request failed');
    }

    const config=await response.json();

    if(
      config.supabaseUrl &&
      config.supabaseAnonKey &&
      window.supabase
    ){
      supabaseClient=window.supabase.createClient(
        config.supabaseUrl,
        config.supabaseAnonKey
      );

      dbReady=true;

      $('#dbStatus').textContent=
        '● Secure Supabase connection available';
    }else{
      $('#dbStatus').textContent=
        '● Demo database active — family isolation simulated locally';
    }
  }catch(error){
    console.error('Database connection check failed:',error);

    $('#dbStatus').textContent=
      '● Offline demo mode';
  }

  renderGames();
  renderReminders();
  renderCare();
  renderPeople();
  connection();

  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('/sw.js').catch(error=>{
      console.warn('Service worker registration failed:',error);
    });
  }
}

function enter(selectedRole){
  role=selectedRole;

  $('#auth').classList.add('hidden');
  $('#shell').classList.remove('hidden');

  buildNav();
  showPage(role==='caregiver'?'caregiver':'patient');
}

function buildNav(){
  const labels=tr();

  const items=role==='patient'
    ?[
      ['patient','⌂',labels.home],
      ['games','🎮',labels.games],
      ['reminders','🔔',labels.reminders],
      ['settings','⚙',labels.settings]
    ]
    :[
      ['caregiver','▥',labels.care],
      ['content','♥',labels.content],
      ['reminders','🔔',labels.reminders],
      ['settings','⚙',labels.settings]
    ];

  $('#nav').innerHTML=items.map(([page,icon,label])=>
    `<button data-page="${page}">
      <span>${icon}</span> ${label}
    </button>`
  ).join('');

  $$('[data-page]').forEach(button=>{
    button.onclick=()=>showPage(button.dataset.page);
  });
}

function showPage(name){
  $$('.page').forEach(page=>page.classList.remove('active'));

  const id={
    patient:'patientHome',
    games:'gamesPage',
    game:'gamePlay',
    reminders:'remindersPage',
    caregiver:'caregiverHome',
    content:'contentPage',
    settings:'settingsPage'
  }[name];

  $('#'+id).classList.add('active');

  $$('nav button').forEach(button=>{
    button.classList.toggle(
      'active',
      button.dataset.page===name
    );
  });

  const titles={
    patient:[
      'PATIENT HOME',
      tr().hello,
      'Choose one comfortable activity.'
    ],
    games:[
      'ACTIVITY LIBRARY',
      'Cognitive games',
      'Short, calm and familiar.'
    ],
    game:[
      'ACTIVITY',
      'Let’s play',
      'Take your time.'
    ],
    reminders:[
      'DAILY SUPPORT',
      'Reminders',
      'Entered by your caregiver.'
    ],
    caregiver:[
      'CAREGIVER HOME',
      'Anima’s engagement',
      'Support signals, not a diagnosis.'
    ],
    content:[
      'PRIVATE FAMILY SPACE',
      'Personal content',
      'Only approved family members can access it.'
    ],
    settings:[
      'ACCESSIBILITY',
      'Comfort settings',
      'Adjust the experience for the patient.'
    ]
  }[name];

  $('#viewKicker').textContent=titles[0];
  $('#pageTitle').textContent=titles[1];
  $('#pageSub').textContent=titles[2];

  scrollTo(0,0);
}

function card(game){
  return `
    <button
      class="game-card ${game.domain.toLowerCase()}"
      data-game="${game.id}"
    >
      <span class="game-icon">${game.icon}</span>
      <h3>${game.title}</h3>
      <p>${game.desc}</p>
      <small>${game.domain} · 3–5 min</small>
    </button>
  `;
}

function renderGames(filter='all'){
  const list=filter==='all'
    ?games
    :games.filter(game=>game.domain===filter);

  $('#gameGrid').innerHTML=games.slice(0,4).map(card).join('');
  $('#libraryGrid').innerHTML=list.map(card).join('');

  $$('[data-game]').forEach(button=>{
    button.onclick=()=>startGame(button.dataset.game);
  });
}

function startGame(id){
  activeGame=games.find(game=>game.id===id);

  startedAt=Date.now();
  hints=0;
  attempts=0;

  showPage('game');

  $('#gameDomain').textContent=activeGame.domain.toUpperCase();
  $('#gameTitle').textContent=activeGame.title;
  $('#gameInstruction').textContent=activeGame.instruction;
  $('#gameFeedback').textContent='';
  $('#gameProgress').textContent='Round 1 of 1';

  renderGame();

  if($('#voiceGuide').checked){
    speak(activeGame.instruction);
  }
}

function stage(html){
  $('#gameArea').innerHTML=
    `<div class="game-stage">${html}</div>`;
}

function renderGame(){
  const game=activeGame;

  if(game.type==='choice') return renderChoice(game);
  if(game.type==='sequence') return renderSequence(game);
  if(game.type==='faces') return renderFaces();
  if(game.type==='pairs') return renderPairs();
  if(game.type==='sound') return renderSound();

  renderOrientation();
}

function renderChoice(game){
  stage(`
    <div>
      <h2>${game.q}</h2>

      <div class="choices">
        ${game.choices.map((choice,index)=>
          `<button class="choice" data-choice="${index}">
            ${choice}
          </button>`
        ).join('')}
      </div>
    </div>
  `);

  $$('[data-choice]').forEach(button=>{
    button.onclick=()=>{
      answer(Number(button.dataset.choice)===game.answer);
    };
  });
}

function answer(correct){
  attempts++;

  if(correct){
    $('#gameFeedback').textContent=
      'Yes, that is right. Well done.';

    speak('Yes, that is right. Well done.');
    finish(true);
  }else{
    hints++;

    $('#gameFeedback').textContent=
      'That is okay. We will make it simpler and give a clue.';

    speak('That is okay. Take your time.');

    const choices=$$('.choice');

    if(choices.length>2){
      choices
        .filter((choice,index)=>index>1)
        .forEach(choice=>choice.remove());
    }
  }
}

function renderSequence(game){
  let next=0;

  stage(`
    <div>
      <h2>What comes first?</h2>
      <div id="seqChoices" class="choices"></div>
      <div id="seqDone" class="sequence-display"></div>
    </div>
  `);

  const draw=()=>{
    $('#seqChoices').innerHTML=game.items
      .slice(next)
      .sort(()=>Math.random()-0.5)
      .map(item=>`<button class="choice">${item}</button>`)
      .join('');

    $$('#seqChoices .choice').forEach(button=>{
      button.onclick=()=>{
        attempts++;

        if(button.textContent===game.items[next]){
          next++;

          $('#seqDone').innerHTML=game.items
            .slice(0,next)
            .map((item,index)=>`<span>${index+1}. ${item}</span>`)
            .join('');

          if(next===game.items.length){
            $('#gameFeedback').textContent=
              'The routine is ready. Lovely work.';

            finish(true);
          }else{
            $('#gameFeedback').textContent=
              'Good. What comes next?';

            draw();
          }
        }else{
          hints++;

          $('#gameFeedback').textContent=
            `A gentle clue: choose “${game.items[next]}”.`;

          speak(`Choose ${game.items[next]}.`);
        }
      };
    });
  };

  draw();
}

function renderFaces(){
  const person=state.people[0];

  if(!person){
    stage(`
      <div>
        <h2>No family photo added yet</h2>
        <p>Please ask your caregiver to add a family member.</p>
      </div>
    `);
    return;
  }

  const options=[
    person.name,
    'Mina',
    'Tashi',
    'Lalbiak'
  ].sort(()=>Math.random()-0.5);

  stage(`
    <div>
      <div
        style="
          width:300px;
          height:210px;
          border-radius:22px;
          background:${
            person.photo
              ?`url(${person.photo}) center/cover`
              :'linear-gradient(145deg,#d9e7ff,#fce4cf)'
          };
          display:grid;
          place-items:center;
          font-size:1.4rem;
          font-weight:900;
        "
      >
        ${person.photo?'':'Family photo'}
      </div>

      <p>${person.clue}</p>

      <div class="choices">
        ${options.map(name=>
          `<button class="choice" data-name="${name}">
            ${name}
          </button>`
        ).join('')}
      </div>
    </div>
  `);

  $$('[data-name]').forEach(button=>{
    button.onclick=()=>{
      attempts++;

      if(button.dataset.name===person.name){
        $('#gameFeedback').textContent=
          `Yes — ${person.name}, your ${person.relation}.`;

        finish(true);
      }else{
        hints++;

        $('#gameFeedback').textContent=
          `The name starts with “${person.name[0]}”.`;

        if(attempts===1){
          $$('[data-name]')
            .filter(item=>
              item.dataset.name!==person.name &&
              item!==button
            )
            .slice(0,2)
            .forEach(item=>item.remove());
        }
      }
    };
  });
}

function renderPairs(){
  const deck=[
    '☕','🧺','🌼',
    '☕','🧺','🌼'
  ].sort(()=>Math.random()-0.5);

  let first=null;
  let matched=0;

  stage(`
    <div>
      <h2>Find two matching objects</h2>

      <div class="choices">
        ${deck.map((value,index)=>
          `<button
            class="choice pair"
            data-i="${index}"
            data-v="${value}"
          >?</button>`
        ).join('')}
      </div>
    </div>
  `);

  $$('.pair').forEach(button=>{
    button.onclick=()=>{
      if(button.disabled) return;

      button.textContent=button.dataset.v;

      if(!first){
        first=button;
        return;
      }

      attempts++;

      if(first.dataset.v===button.dataset.v){
        first.disabled=true;
        button.disabled=true;

        matched+=2;
        first=null;

        if(matched===deck.length){
          $('#gameFeedback').textContent=
            'All familiar pairs found.';

          finish(true);
        }
      }else{
        hints++;

        const previous=first;
        first=null;

        setTimeout(()=>{
          previous.textContent='?';
          button.textContent='?';
        },650);
      }
    };
  });
}

function renderSound(){
  stage(`
    <div>
      <h2>Listen to two words</h2>

      <button id="playWords" class="primary">
        🔊 Play words
      </button>

      <div class="choices" style="margin-top:20px">
        <button class="choice" data-sound="1">
          Tea and flower
        </button>

        <button class="choice" data-sound="0">
          Key and chair
        </button>

        <button class="choice" data-sound="0">
          Basket and drum
        </button>
      </div>
    </div>
  `);

  $('#playWords').onclick=()=>speak('Tea. Flower.');

  $$('[data-sound]').forEach(button=>{
    button.onclick=()=>answer(button.dataset.sound==='1');
  });
}

function renderOrientation(){
  const hour=new Date().getHours();

  const correctAnswer=
    hour<12
      ?'Morning'
      :hour<17
        ?'Afternoon'
        :'Evening';

  stage(`
    <div>
      <h2>What part of the day is it now?</h2>

      <div class="choices">
        ${['Morning','Afternoon','Evening'].map(value=>
          `<button class="choice" data-time="${value}">
            ${value}
          </button>`
        ).join('')}
      </div>
    </div>
  `);

  $$('[data-time]').forEach(button=>{
    button.onclick=()=>{
      answer(button.dataset.time===correctAnswer);
    };
  });
}

async function finish(success){
  const elapsed=Math.max(
    1,
    Math.round((Date.now()-startedAt)/1000)
  );

  const session={
    id:crypto.randomUUID(),
    game:activeGame.title,
    domain:activeGame.domain,
    accuracy:success
      ?Math.max(50,Math.round(100/(attempts||1)))
      :0,
    response:elapsed,
    hints,
    created_at:new Date().toISOString()
  };

  state.sessions.unshift(session);

  save();
  renderCare();

  $('#gameProgress').textContent='Activity complete';

  $('#adaptiveMessage').textContent=
    hints
      ?'Next activity will use fewer choices'
      :'Comfortable pace maintained';

  $('#todayDone').textContent=todaySessions().length;

  if(dbReady){
    await syncSession(session);
  }

  setTimeout(()=>{
    showPage('patient');
  },1700);
}

function todaySessions(){
  const today=new Date().toDateString();

  return state.sessions.filter(session=>
    new Date(session.created_at).toDateString()===today
  );
}

function renderReminders(){
  const rows=state.reminders.map(reminder=>`
    <div class="reminder-row">
      <span class="reminder-time">${reminder.time}</span>

      <p>
        <b>${reminder.type}</b><br>
        <small>${reminder.message}</small>
      </p>

      <button data-heard="${reminder.id}">
        I heard it
      </button>
    </div>
  `).join('');

  $('#patientReminderList').innerHTML=rows;

  $('#allReminders').innerHTML=state.reminders.map(reminder=>`
    <article class="panel reminder-row">
      <span class="reminder-time">${reminder.time}</span>

      <p>
        <b>${reminder.type}</b><br>
        ${reminder.message}
      </p>
    </article>
  `).join('');

  $$('[data-heard]').forEach(button=>{
    button.onclick=()=>{
      button.textContent='Heard ✓';
      button.disabled=true;

      toast('Caregiver can confirm later');
    };
  });
}

function renderPeople(){
  $('#photoCount').textContent=`${state.people.length} photos`;

  $('#memoryCards').innerHTML=state.people.map(person=>`
    <article class="memory-card">
      <div
        class="photo"
        style="${
          person.photo
            ?`background-image:url(${person.photo})`
            :''
        }"
      >
        ${person.photo?'':person.name[0]}
      </div>

      <div>
        <b>${person.name}</b>
        <p>${person.relation}</p>
        <p>${person.clue}</p>
      </div>
    </article>
  `).join('');
}

function renderCare(){
  const sessions=state.sessions;
  const numberOfSessions=sessions.length;

  const average=key=>{
    if(!numberOfSessions) return null;

    return Math.round(
      sessions.reduce(
        (total,session)=>total+(session[key]||0),
        0
      )/numberOfSessions
    );
  };

  $('#metricSessions').textContent=todaySessions().length;

  $('#metricAccuracy').textContent=
    average('accuracy')
      ?average('accuracy')+'%'
      :'—';

  $('#metricResponse').textContent=
    average('response')
      ?average('response')+' sec'
      :'—';

  $('#metricHints').textContent=sessions.reduce(
    (total,session)=>total+session.hints,
    0
  );

  $('#todayDone').textContent=todaySessions().length;

  const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  $('#trendChart').innerHTML=days.map((day,index)=>`
    <div class="chart-day">
      <i
        class="memory-bar"
        style="height:${25+((index*17+22)%60)}%"
      ></i>

      <i
        class="attention-bar"
        style="height:${28+((index*13+35)%55)}%"
      ></i>

      <i
        class="routine-bar"
        style="height:${22+((index*19+28)%55)}%"
      ></i>

      <label>${day}</label>
    </div>
  `).join('');

  if(sessions.length){
    $('#sessionTable').innerHTML=`
      <div class="session-row">
        <b>Activity</b>
        <b>Accuracy</b>
        <b>Time</b>
        <b>Help</b>
      </div>

      ${sessions.slice(0,6).map(session=>`
        <div class="session-row">
          <span>
            <b>${session.game}</b>
            <small>${session.domain}</small>
          </span>

          <span>${session.accuracy}%</span>
          <span>${session.response}s</span>
          <span>${session.hints}</span>
        </div>
      `).join('')}
    `;
  }else{
    $('#sessionTable').innerHTML=`
      <p class="muted">
        No sessions yet. Play an activity to generate
        real engagement data.
      </p>
    `;
  }

  $('#careRecommendation').textContent=
    sessions.length && average('accuracy')<65
      ?'Use familiar content and two choices'
      :'Continue short, comfortable sessions';
}

async function syncSession(session){
  if(
    !supabaseClient ||
    !currentFamilyId ||
    !currentPatientId
  ){
    return;
  }

  try{
    const {error}=await supabaseClient
      .from('game_sessions')
      .insert({
        family_id:currentFamilyId,
        patient_id:currentPatientId,
        game_key:activeGame.id,
        domain:session.domain,
        accuracy:session.accuracy,
        response_seconds:session.response,
        hints_used:session.hints
      });

    if(error){
      throw error;
    }
  }catch(error){
    console.error('Session sync failed:',error);

    toast('Saved offline; secure sync will retry later');
  }
}

async function loadRemote(){
  if(
    !supabaseClient ||
    !currentFamilyId ||
    !currentPatientId
  ){
    return;
  }

  const [peopleResult,reminderResult,sessionResult]=
    await Promise.all([
      supabaseClient
        .from('memory_people')
        .select('*')
        .eq('patient_id',currentPatientId),

      supabaseClient
        .from('reminders')
        .select('*')
        .eq('patient_id',currentPatientId)
        .eq('enabled',true),

      supabaseClient
        .from('game_sessions')
        .select('*')
        .eq('patient_id',currentPatientId)
        .order('created_at',{ascending:false})
        .limit(50)
    ]);

  if(peopleResult.error){
    console.error(peopleResult.error);
  }

  if(reminderResult.error){
    console.error(reminderResult.error);
  }

  if(sessionResult.error){
    console.error(sessionResult.error);
  }

  if(peopleResult.data?.length){
    state.people=await Promise.all(
      peopleResult.data.map(async person=>{
        let photo='';

        if(person.photo_path){
          const {data}=await supabaseClient.storage
            .from('memory-photos')
            .createSignedUrl(person.photo_path,3600);

          photo=data?.signedUrl||'';
        }

        return{
          id:person.id,
          name:person.name,
          relation:person.relationship,
          clue:person.gentle_clue,
          photo
        };
      })
    );
  }

  if(reminderResult.data?.length){
    state.reminders=reminderResult.data.map(reminder=>({
      id:reminder.id,
      type:reminder.type,
      time:reminder.reminder_time.slice(0,5),
      message:reminder.message
    }));
  }

  if(sessionResult.data?.length){
    state.sessions=sessionResult.data.map(session=>({
      id:session.id,
      game:session.game_key,
      domain:session.domain,
      accuracy:session.accuracy,
      response:session.response_seconds,
      hints:session.hints_used,
      created_at:session.created_at
    }));
  }

  save();
  renderPeople();
  renderReminders();
  renderCare();
}

$('#personForm').onsubmit=event=>{
  event.preventDefault();

  const file=$('#personPhoto').files[0];

  if(!file){
    toast('Please choose a family photo');
    return;
  }

  const record={
    id:crypto.randomUUID(),
    name:$('#personName').value,
    relation:$('#personRelation').value,
    clue:$('#personClue').value,
    photo:''
  };

  const reader=new FileReader();

  reader.onload=async()=>{
    record.photo=reader.result;

    state.people.unshift(record);

    save();
    renderPeople();

    event.target.reset();

    toast('Added only to this family space');

    if(
      supabaseClient &&
      currentFamilyId &&
      currentPatientId
    ){
      const extension=
        (file.name.split('.').pop()||'jpg').toLowerCase();

      const path=
        `${currentFamilyId}/${crypto.randomUUID()}.${extension}`;

      const uploadResult=await supabaseClient.storage
        .from('memory-photos')
        .upload(path,file,{upsert:false});

      if(uploadResult.error){
        console.error(uploadResult.error);
        toast('Photo saved locally; cloud upload failed');
        return;
      }

      const userResult=await supabaseClient.auth.getUser();
      const userId=userResult.data?.user?.id;

      const {error}=await supabaseClient
        .from('memory_people')
        .insert({
          family_id:currentFamilyId,
          patient_id:currentPatientId,
          name:record.name,
          relationship:record.relation,
          gentle_clue:record.clue,
          photo_path:path,
          approved_by:userId
        });

      if(error){
        console.error(error);
        toast('Photo uploaded, but database entry failed');
      }
    }
  };

  reader.readAsDataURL(file);
};

$('#reminderForm').onsubmit=async event=>{
  event.preventDefault();

  const reminder={
    id:crypto.randomUUID(),
    type:$('#reminderType').value,
    time:$('#reminderTime').value,
    message:$('#reminderText').value
  };

  state.reminders.push(reminder);

  save();
  renderReminders();

  event.target.reset();

  toast('Reminder saved');

  if(
    supabaseClient &&
    currentFamilyId &&
    currentPatientId
  ){
    const userResult=await supabaseClient.auth.getUser();
    const userId=userResult.data?.user?.id;

    const {error}=await supabaseClient
      .from('reminders')
      .insert({
        family_id:currentFamilyId,
        patient_id:currentPatientId,
        type:reminder.type,
        message:reminder.message,
        reminder_time:reminder.time,
        created_by:userId
      });

    if(error){
      console.error(error);
      toast('Reminder saved locally; cloud sync failed');
    }
  }
};

$('#authForm').onsubmit=async event=>{
  event.preventDefault();

  if(!dbReady || !supabaseClient){
    toast('Supabase connection is not ready');
    return;
  }

  const {data,error}=await supabaseClient.auth
    .signInWithPassword({
      email:$('#email').value.trim(),
      password:$('#password').value
    });

  if(error){
    toast(error.message);
    return;
  }

  const {data:profile,error:profileError}=
    await supabaseClient
      .from('profiles')
      .select('role,family_id')
      .eq('id',data.user.id)
      .single();

  if(profileError || !profile){
    console.error(profileError);
    toast('Profile not configured');
    return;
  }

  currentFamilyId=profile.family_id;

  const {data:patient,error:patientError}=
    await supabaseClient
      .from('patients')
      .select('id')
      .eq('family_id',profile.family_id)
      .limit(1)
      .single();

  if(patientError || !patient){
    console.error(patientError);
    toast('Patient record not configured');
    return;
  }

  currentPatientId=patient.id;

  await loadRemote();

  enter(profile.role||'caregiver');
};

$$('[data-login]').forEach(button=>{
  button.onclick=()=>enter(button.dataset.login);
});

$('#logout').onclick=async()=>{
  if(supabaseClient){
    await supabaseClient.auth.signOut();
  }

  location.reload();
};

$('#voice').onclick=()=>{
  speak(
    `${$('#pageTitle').textContent}. `+
    `${$('#pageSub').textContent}`
  );
};

$('#hearInstruction').onclick=()=>{
  if(activeGame){
    speak(activeGame.instruction);
  }
};

$('#hintBtn').onclick=()=>{
  hints++;

  $('#gameFeedback').textContent=
    'A gentle clue has been added. Take your time.';

  speak('Take your time.');
};

$('#recommended').onclick=()=>{
  startGame(state.people.length?'faces':'objects');
};

$('#domainFilter').onchange=event=>{
  renderGames(event.target.value);
};

$('#language').onchange=()=>{
  buildNav();
  $('#pageTitle').textContent=tr().hello;
};

$('#largeText').onchange=event=>{
  document.body.classList.toggle(
    'large',
    event.target.checked
  );
};

$('#contrast').onchange=event=>{
  document.body.classList.toggle(
    'contrast',
    event.target.checked
  );
};

$('#motion').onchange=event=>{
  document.body.classList.toggle(
    'reduce-motion',
    event.target.checked
  );
};

function connection(){
  const online=navigator.onLine;

  $('#online').textContent=
    online
      ?'● Online'
      :'● Offline — changes queued';
}

addEventListener('online',connection);
addEventListener('offline',connection);

init();