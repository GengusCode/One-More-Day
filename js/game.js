(() => {
  "use strict";
  const SAVE_KEY = "one-more-day-v01";
  const $ = (id) => document.getElementById(id);
  const clamp = (n) => Math.max(0, Math.min(100, n));
  const money = (n) => `${n < 0 ? "-" : ""}R${Math.abs(Math.round(n)).toLocaleString("en-ZA")}`;

  const hustles = [
    { id:"wash", icon:"🪣", name:"Wash cars", detail:"Reliable, honest work", energy:-16, cash:[90,150], rep:3 },
    { id:"move", icon:"📦", name:"Help someone move", detail:"Heavy work, better pay", energy:-24, cash:[140,220], health:-3, social:2 },
    { id:"resell", icon:"📱", name:"Buy & resell", detail:"Risk R80 for a flip", energy:-10, cost:80, cash:[80,270], knowledge:4, rep:-1 }
  ];
  const events = {
    2:{icon:"👟",kicker:"WANT vs WEALTH",title:"The fresh-drop temptation",text:"Those limited sneakers are calling your name. They cost R180—but that money could keep working for you.",choices:[
      {text:"Buy the sneakers",sub:"Happiness +14 • Cash −R180",need:180,effect:{cash:-180,happiness:14},result:"Fresh on your feet. Your wallet, however, needs a lie-down."},
      {text:"Keep the cash working",sub:"Knowledge +7 • Reputation +2",effect:{knowledge:7,reputation:2,happiness:-3},result:"Not flashy, but future-you sends their regards."}
    ]},
    3:{icon:"🏪",kicker:"OPPORTUNITY KNOCKS",title:"A tiny business idea",text:"A neighbour sells vetkoek near the taxi rank. R200 could buy ingredients and a brighter sign. Split tomorrow's profit?",choices:[
      {text:"Invest R200",sub:"Unlock a return tomorrow • Risk included",need:200,effect:{cash:-200,invested:true,knowledge:4},result:"Deal done. Now you wait to see if the lunch rush delivers."},
      {text:"Pass this time",sub:"Keep your cash • Happiness −2",effect:{happiness:-2},result:"You keep your money safe and your options open."}
    ]},
    5:{icon:"📱",kicker:"CHAOS EVENT",title:"Hey! That's my phone!",text:"A hand snatches your phone at the taxi rank. They're running. Your health and energy affect the chase.",choices:[
      {text:"Give chase!",sub:"Outcome uses health, energy & luck",action:"chase"},
      {text:"Let it go",sub:"Stay safe • Cash −R150 • Happiness −8",effect:{cash:-150,happiness:-8},result:"It hurts, but no phone is worth your life."}
    ]},
    6:{icon:"🤝",kicker:"SOCIAL CAPITAL",title:"A friend needs a favour",text:"Lerato needs help preparing for an interview. It costs your evening, but people remember who showed up.",choices:[
      {text:"Help prepare",sub:"Energy −10 • Social +10 • Reputation +5",effect:{energy:-10,social:10,reputation:5,happiness:3},result:"Lerato walks in confident. That's a different kind of profit."},
      {text:"Focus on yourself",sub:"Energy +4 • Social −5",effect:{energy:4,social:-5},result:"You protect your time. Lerato understands—mostly."}
    ]}
  };
  let state;

  function freshState(name="Thando") { return {name:name.trim()||"Thando",day:1,age:18,cash:250,startCash:250,health:76,energy:82,knowledge:42,social:55,happiness:68,reputation:35,assets:0,debt:0,hustlesDone:0,eventDone:false,workedToday:false,invested:false,businessReturn:0,phoneSaved:null,log:[]}; }
  function save(){localStorage.setItem(SAVE_KEY,JSON.stringify(state));}
  function load(){try{return JSON.parse(localStorage.getItem(SAVE_KEY));}catch{return null;}}
  function netWorth(){return state.cash+state.assets-state.debt;}
  function randomBetween([a,b]){return Math.floor(Math.random()*(b-a+1))+a;}
  function apply(effect={}){
    ["cash","assets","debt"].forEach(k=>{if(typeof effect[k]==="number") state[k]+=effect[k];});
    ["health","energy","knowledge","social","happiness","reputation"].forEach(k=>{if(typeof effect[k]==="number") state[k]=clamp(state[k]+effect[k]);});
    if(effect.invested){state.invested=true;state.assets+=200;}
  }
  function statMarkup(k,label,icon){const value=Math.round(state[k]);return `<div class="stat"><div class="stat-label"><span>${icon} ${label}</span><b>${value}</b></div><div class="bar"><i style="width:${value}%"></i></div></div>`;}
  function render(){
    $("dayValue").textContent=`${state.day} / 7`; $("ageValue").textContent=state.age; $("cashValue").textContent=money(state.cash); $("netWorthValue").textContent=money(netWorth());
    $("statGrid").innerHTML=statMarkup("health","Health","♥")+statMarkup("energy","Energy","⚡")+statMarkup("knowledge","Know.","◆")+statMarkup("social","Social","●")+statMarkup("happiness","Happy","☀")+statMarkup("reputation","Rep.","★");
    renderStory(); renderHustles(); save();
  }
  function renderStory(){
    const ev=events[state.day];
    if(ev&&!state.eventDone){$("storyIcon").textContent=ev.icon;$("storyKicker").textContent=ev.kicker;$("storyTitle").textContent=ev.title;$("storyText").textContent=ev.text;$("choiceList").innerHTML=ev.choices.map((c,i)=>`<button class="choice" data-choice="${i}" ${c.need>state.cash?"disabled":""}>${c.text}<small>${c.need>state.cash?`Need ${money(c.need)}`:c.sub}</small></button>`).join("");return;}
    $("storyIcon").textContent=state.workedToday?"✅":"🌅";$("storyKicker").textContent=state.workedToday?"TODAY'S RESULT":`DAY ${state.day}`;$("storyTitle").textContent=state.workedToday?"Good work.":`A new day, ${state.name}.`;$("storyText").textContent=state.workedToday?"Your move is made. Take a breath, then see what tomorrow brings.":dayPrompt();$("choiceList").innerHTML="";
  }
  function dayPrompt(){return ["Your wallet is light, but your ambition isn't. Pick a hustle.","Small choices become big directions.","Opportunity rarely arrives wearing a suit.","Consistency is a superpower nobody posts about.","Keep your eyes open. The city is unpredictable.","Who you know matters—but so does who knows they can count on you.","One last push before you count the week's wins."][state.day-1];}
  function renderHustles(){
    $("hustleList").innerHTML=hustles.map(h=>`<button class="hustle ${state.workedToday?"done":""}" data-hustle="${h.id}" ${state.workedToday||h.energy*-1>state.energy||h.cost>state.cash?"disabled":""}><span class="hustle-icon">${h.icon}</span><span><strong>${h.name}</strong><small>${h.cost?`Costs ${money(h.cost)} • `:""}${h.detail}</small></span><span class="reward">${money(h.cash[0])}+</span></button>`).join("");
    $("nextDayButton").disabled=!state.workedToday||!!(events[state.day]&&!state.eventDone);$("nextDayButton").textContent=state.workedToday?state.day===7?"SEE WEEK 1 SUMMARY →":"NEXT DAY →":"CHOOSE A HUSTLE FIRST";
  }
  function doHustle(id){
    if(state.workedToday)return;const h=hustles.find(x=>x.id===id);let earned=randomBetween(h.cash);if(h.cost)state.cash-=h.cost;apply({cash:earned,energy:h.energy,health:h.health||0,knowledge:h.knowledge||0,social:h.social||0,reputation:h.rep||0,happiness:2});state.workedToday=true;state.hustlesDone++;state.log.push(`${h.name}: +${money(earned-(h.cost||0))}`);toast(`${h.icon} ${h.name} earned ${money(earned)}${h.cost?" before costs":""}.`);render();
  }
  function choose(i){
    const c=events[state.day].choices[i];if(c.need>state.cash)return;
    if(c.action==="chase"){const chance=.25+(state.health+state.energy)/300;const won=Math.random()<chance;if(won){apply({energy:-18,health:-5,reputation:7,happiness:8});state.phoneSaved=true;c.result="You cut through the crowd and get your phone back. Main-character energy!";}else{apply({energy:-20,health:-8,cash:-150,happiness:-8});state.phoneSaved=false;c.result="You lose them in the crowd. Bruised pride, bruised wallet—but you're safe.";}}
    else apply(c.effect);
    state.eventDone=true;state.log.push(events[state.day].title+": "+c.text);toast(c.result);render();
  }
  function nextDay(){
    if(!state.workedToday||events[state.day]&&!state.eventDone)return;
    if(state.day===7){showSummary();return;}
    state.day++;state.workedToday=false;state.eventDone=!events[state.day];apply({energy:22,health:3,happiness:-1});
    if(state.day===4&&state.invested){const profit=randomBetween([40,180]);state.cash+=200+profit;state.assets-=200;state.businessReturn=profit;toast(`🏪 The vetkoek stand returned your R200 plus ${money(profit)} profit!`);}
    render();window.scrollTo({top:0,behavior:"smooth"});
  }
  function showSummary(){
    save();$("gameScreen").classList.add("hidden");$("summaryScreen").classList.remove("hidden");$("resetButton").classList.add("hidden");
    const gain=netWorth()-state.startCash;const score=Math.max(0,Math.round(netWorth()+state.knowledge*3+state.reputation*3+state.happiness*2));
    $("summaryTitle").textContent=`You made it, ${state.name}.`;$("summaryMessage").textContent=gain>=0?"Seven days of choices, hustle, and a little chaos. You ended stronger than you started.":"It was a rough week—but every comeback begins with surviving the first chapter.";
    $("summaryScore").innerHTML=`${score}<small>LIFE SCORE</small>`;$("summaryGrid").innerHTML=`<div class="summary-item"><span>FINAL CASH</span><strong>${money(state.cash)}</strong></div><div class="summary-item"><span>NET WORTH</span><strong>${money(netWorth())}</strong></div><div class="summary-item"><span>WEEK'S GROWTH</span><strong class="${gain>=0?"positive":"negative"}">${gain>=0?"+":""}${money(gain)}</strong></div><div class="summary-item"><span>HUSTLES DONE</span><strong>${state.hustlesDone}</strong></div>`;
    $("summaryQuote").textContent=netWorth()>=700?"You didn't just chase money—you gave it a job. Week two is watching.":state.happiness>=75?"A rich life is more than a rich wallet. You kept your spark.":"The lesson is free. The retry is one button away.";
  }
  function showGame(){$("startScreen").classList.add("hidden");$("summaryScreen").classList.add("hidden");$("gameScreen").classList.remove("hidden");$("resetButton").classList.remove("hidden");render();}
  function start(name){state=freshState(name);showGame();}
  function reset(){if(confirm("Start over? Your current week will be replaced.")){localStorage.removeItem(SAVE_KEY);state=freshState();$("gameScreen").classList.add("hidden");$("summaryScreen").classList.add("hidden");$("startScreen").classList.remove("hidden");$("resetButton").classList.add("hidden");updateContinue();}}
  let toastTimer;function toast(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),3200);}
  function updateContinue(){const saved=load();$("continueButton").classList.toggle("hidden",!saved);if(saved)$("continueButton").textContent=`Continue ${saved.name}'s life • Day ${saved.day}`;}
  $("newLifeForm").addEventListener("submit",e=>{e.preventDefault();start($("playerName").value);});
  $("continueButton").addEventListener("click",()=>{state=load();showGame();});$("resetButton").addEventListener("click",reset);$("replayButton").addEventListener("click",()=>{localStorage.removeItem(SAVE_KEY);state=freshState();showGame();});$("nextDayButton").addEventListener("click",nextDay);
  $("hustleList").addEventListener("click",e=>{const b=e.target.closest("[data-hustle]");if(b)doHustle(b.dataset.hustle);});$("choiceList").addEventListener("click",e=>{const b=e.target.closest("[data-choice]");if(b)choose(Number(b.dataset.choice));});updateContinue();
})();
