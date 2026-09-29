(()=>{"use strict";
const KEY="one-more-day-v06",$=x=>document.getElementById(x),cap=n=>Math.max(0,Math.min(100,n)),rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a,money=n=>`${n<0?"-":""}R${Math.abs(Math.round(n)).toLocaleString("en-ZA")}`;
const localNames=["Anele","Ayesha","Blessing","Caitlin","Dineo","Ethan","Fatima","Hlumelo","Imraan","Jessica","Kabelo","Keegan","Lerato","Liam","Minenhle","Naledi","Neo","Priya","Refilwe","Ryan","Sipho","Thando","Tshepiso","Wikus","Zinhle"];
const jobs=[
 {id:"wash",icon:"🪣",name:"Start a car wash",type:"BUSINESS",desc:"Begin with a bucket. Hire a crew, open sites, build a national brand.",pay:[85,135],energy:-13,unlock:0,gear:"Pressure washer kit",cost:240,expansions:["Roadside wash bay","Permanent wash site","Second branch","Franchise office"],titles:["Solo Washer","Mobile Operator","Crew Boss","Site Owner","Wash Group Founder"]},
 {id:"food",icon:"🍔",name:"Open a kota stand",type:"BUSINESS",desc:"Sell one kota at a time, then grow into kitchens, shops and a chain.",pay:[95,155],energy:-16,unlock:0,gear:"Grill and prep station",cost:280,expansions:["Street stall","Container kitchen","Takeaway shop","Second location"],titles:["Home Cook","Street Vendor","Kitchen Boss","Takeaway Owner","Food Group Founder"]},
 {id:"office",icon:"💼",name:"Join a corporate office",type:"CAREER",desc:"Start as a junior, navigate office politics and climb toward the boardroom.",pay:[120,175],energy:-12,unlock:0,gear:"Professional course",cost:350,expansions:["Industry certificate","Management diploma","Executive programme","Equity partnership"],titles:["Office Junior","Administrator","Team Coordinator","Department Manager","Executive Director"]}
];
const people={lerato:["Lerato","Best friend","👩🏾"],gogo:["Gogo","Family","👵🏾"],sizwe:["Sizwe","Neighbour","🧑🏾"]};
const events=[
 {icon:"🚐",tag:"EKASI MORNING",title:"Getting across town",text:"Your first job is across town and the morning queue is growing. How do you get there?",c:[{t:"Take a minibus taxi",s:"Cash −R25 • Social +3",need:25,fx:{cash:-25,energy:3,social:3,rel:{sizwe:3}},r:"A packed ride, a lively debate, and two useful contacts."},{t:"Walk and save",s:"Energy −8 • Health +4",fx:{energy:-8,health:4,knowledge:2},r:"The walk is long, but the city teaches you something."},{t:"Ask Sizwe for a lift",s:"Sizwe +9 • Reputation −1",fx:{reputation:-1,rel:{sizwe:9}},r:"Sizwe helps, but reminds you that favours travel both ways."}]},
 {icon:"👟",tag:"WANT vs WEALTH",title:"The fresh-drop temptation",text:"Limited sneakers cost R180, but that money could keep working.",c:[{t:"Buy the sneakers",s:"Cash −R180 • Happiness +14",need:180,fx:{cash:-180,happiness:14,reputation:2},r:"Sharp on your feet. Your wallet needs a lie-down."},{t:"Keep the cash working",s:"Knowledge +7 • Happiness −3",fx:{knowledge:7,happiness:-3},r:"Future-you sends their regards."},{t:"Find a second-hand pair",s:"Cash −R70 • Happiness +7",need:70,fx:{cash:-70,happiness:7,rel:{lerato:3}},r:"Lerato finds you a clean pair. Style without the damage."}]},
 {icon:"🥘",tag:"KASI OPPORTUNITY",title:"The vetkoek stand",text:"A neighbour at the taxi rank needs R200 for ingredients and a sign.",c:[{t:"Invest R200",s:"Business return tomorrow",need:200,fx:{cash:-200,assets:200,invested:1,knowledge:4,rel:{sizwe:4}},r:"Deal done. Now you wait for the lunch rush."},{t:"Help with marketing",s:"Energy −7 • Reputation +7",fx:{energy:-7,reputation:7,social:4,rel:{sizwe:6}},r:"Your handwritten special brings a queue."},{t:"Pass politely",s:"Keep cash • Happiness −1",fx:{happiness:-1,rel:{gogo:2}},r:"You keep your options open and buy lunch there."}]},
 {icon:"💡",tag:"LOAD SHEDDING",title:"The lights go out",text:"Power cuts hit during the busiest hour. Customers are waiting.",c:[{t:"Make a backup plan",s:"Cash −R80 • Knowledge +8",need:80,fx:{cash:-80,knowledge:8,reputation:6},r:"A borrowed battery and clever workaround save the day."},{t:"Help nearby businesses",s:"Energy −10 • Social +10",fx:{energy:-10,social:10,reputation:7,rel:{sizwe:7}},r:"Ubuntu in action: the whole row works together."},{t:"Close early",s:"Energy +8 • Reputation −4",fx:{energy:8,reputation:-4,happiness:2},r:"You rest, but disappointed customers remember."}]},
 {icon:"📱",tag:"CHAOS AT THE RANK",title:"Hey! That's my phone!",text:"Someone snatches your phone. Health, energy, and community may help.",c:[{t:"Give chase!",s:"Health, energy and luck decide",chase:1},{t:"Call for help",s:"Social affects the outcome",help:1},{t:"Let it go",s:"Stay safe • Cash −R150",fx:{cash:-150,happiness:-8,rel:{gogo:3}},r:"Gogo is relieved that you came home safely."}]},
 {icon:"🤝",tag:"UBUNTU",title:"Lerato needs a favour",text:"Lerato has a big interview tomorrow and needs help preparing.",c:[{t:"Practise with her",s:"Energy −10 • Lerato +14",fx:{energy:-10,social:8,reputation:4,happiness:3,rel:{lerato:14}},r:"She walks in confident. You showed up."},{t:"Send useful notes",s:"Knowledge +3 • Lerato +6",fx:{knowledge:3,rel:{lerato:6}},r:"The notes genuinely help."},{t:"Say you're too busy",s:"Energy +5 • Lerato −12",fx:{energy:5,happiness:-2,rel:{lerato:-12}},r:"She says she understands, but the silence says more."}]},
 {icon:"🔥",tag:"WEEK-END BRAAI",title:"How do you end the week?",text:"The music is playing and the braai is ready, but ambition is calling too.",c:[{t:"Bring meat and celebrate",s:"Cash −R100 • Everyone closer",need:100,fx:{cash:-100,social:10,happiness:12,rel:{lerato:5,gogo:5,sizwe:5}},r:"Good food, laughter, and stories worth keeping."},{t:"Plan, then join",s:"Knowledge +6 • Happiness +5",fx:{knowledge:6,happiness:5,rel:{lerato:3,gogo:2}},r:"You make time for the future and your people."},{t:"Work through the evening",s:"Cash +R120 • Relationships −5",fx:{cash:120,energy:-10,happiness:-6,rel:{lerato:-5,gogo:-5,sizwe:-5}},r:"The money feels good. The unread messages do not."}]}
];
const work=[
 ["The rushed customer","A customer wants special treatment while others wait.",[["Explain the queue fairly","Performance +2",2,{reputation:2,social:2}], ["Take a secret tip","Cash +R50 • Warning",-2,{cash:50,reputation:-5},1], ["Ask for advice","Performance +1 • Knowledge +2",1,{knowledge:2}]]],
 ["A mistake slips through","You notice your mistake before the customer leaves.",[["Own it and fix it","Performance +3 • Energy −5",3,{energy:-5,reputation:4}], ["Hope nobody notices","Performance −2 • Warning",-2,{happiness:-2},1], ["Blame the new person","Performance −1 • Reputation −5",-1,{reputation:-5,rel:{sizwe:-4}}]]],
 ["The queue keeps growing","Demand is high, but rushing lowers quality.",[["Set a steady pace","Performance +2",2,{reputation:2}], ["Rush every order","Cash +R40 • Performance −1",-1,{cash:40,energy:-5}], ["Organise the workflow","Performance +3 • Knowledge +5",3,{knowledge:5,energy:-3}]]],
 ["The boss is away","Nobody is watching and the afternoon is quiet.",[["Find useful work","",3,{reputation:3}], ["Compliment the boss and agree with every idea","",1,{social:-2},0,3], ["Leave early without asking","",-3,{happiness:4,reputation:-4},1]]],
 ["A difficult customer","A customer speaks rudely while coworkers watch.",[["Stay calm and solve it","Performance +3",3,{social:4,reputation:3}], ["Match their energy","Performance −3 • Warning",-3,{happiness:3,reputation:-6},1], ["Call a supervisor","Performance +1",1,{knowledge:2}]]],
 ["A coworker struggles","Helping may slow your own target.",[["Teach them properly","Performance +2",2,{energy:-5,reputation:4,rel:{sizwe:3}}], ["Focus on your target","Performance +1 • Social −3",1,{social:-3}], ["Do it, then complain","Energy −8 • Performance 0",0,{energy:-8,reputation:-2}]]],
 ["The promotion conversation","Your manager asks what you contributed this week.",[["Show honest results","Performance +3",3,{reputation:3}], ["Take all the credit","Performance −2 • Warning",-2,{social:-6},1], ["Credit the team","Performance +2 • Social +6",2,{social:6,reputation:4}]]]
];
let s,timer,chaseTimer,chaseTick,chaseMoveTick,uiTimer;const fresh=name=>({name:name.trim()||localNames[rnd(0,localNames.length-1)],day:1,age:18,cash:250,startCash:250,health:76,energy:82,knowledge:42,social:55,happiness:68,reputation:35,assets:0,debt:0,relationships:{lerato:55,gogo:68,sizwe:42},job:null,history:[],level:0,xp:0,performance:0,bossFavor:0,warnings:0,equipment:false,workers:0,expansions:0,worked:false,workDone:false,eventDone:false,eventBranch:null,lastOutcome:"",choiceOrders:{},invested:false,fired:null});
const save=()=>localStorage.setItem(KEY,JSON.stringify(s)),load=()=>{try{return JSON.parse(localStorage.getItem(KEY))}catch{return null}},worth=()=>s.cash+s.assets-s.debt;
function apply(x={}){["cash","assets","debt"].forEach(k=>s[k]+=x[k]||0);["health","energy","knowledge","social","happiness","reputation"].forEach(k=>s[k]=cap(s[k]+(x[k]||0)));if(x.invested)s.invested=true;if(x.rel)Object.entries(x.rel).forEach(([k,v])=>s.relationships[k]=cap(s.relationships[k]+v))}
function toast(x){$("toast").textContent=x;$("toast").classList.add("show");clearTimeout(timer);timer=setTimeout(()=>$("toast").classList.remove("show"),3200)}
function stat(k,n,i){return `<div class="stat"><div class="stat-label"><span>${i} ${n}</span><b>${s[k]}</b></div><div class="bar"><i style="width:${s[k]}%"></i></div></div>`}
function render(){["dayValue","ageValue","cashValue","netWorthValue"].forEach((id,i)=>$(id).textContent=[`${s.day} / 7`,s.age,money(s.cash),money(worth())][i]);$("statGrid").innerHTML=stat("health","Health","♥")+stat("energy","Energy","⚡")+stat("knowledge","Know.","◆")+stat("social","Social","●")+stat("happiness","Happy","☀")+stat("reputation","Rep.","★");$("relationshipGrid").innerHTML=Object.entries(people).map(([k,p])=>`<div class="person"><span class="person-avatar">${p[2]}</span><strong>${p[0]}</strong><small>${p[1]} • ${s.relationships[k]}</small><div class="bond"><i style="width:${s.relationships[k]}%"></i></div></div>`).join("");story();career();save()}
function story(){let e=events[s.day-1];if(!s.eventDone){$("storyIcon").textContent=e.icon;$("storyKicker").textContent=e.tag;$("storyTitle").textContent=e.title;$("storyText").textContent=e.text;$("choiceList").innerHTML=e.c.map((c,i)=>`<button class="choice" data-event="${i}" ${c.need>s.cash?"disabled":""}>${c.t}<small>${c.need>s.cash?`Need ${money(c.need)}`:c.s}</small></button>`).join("")}else{$("storyIcon").textContent="✓";$("storyKicker").textContent=`DAY ${s.day} CHOICE MADE`;$("storyTitle").textContent="Your choice is remembered.";$("storyText").textContent=s.workDone?"Today's decisions are complete.":"There is still a situation waiting at work below.";$("choiceList").innerHTML=""}}
function workBox(){let w=work[s.day-1];return `<div class="work-situation"><strong>Work situation: ${w[0]}</strong><p>${w[1]}</p><div class="work-options">${w[2].map((o,i)=>`<button class="work-option" data-work="${i}">${o[0]}<small>Choose your response</small></button>`).join("")}</div><p class="hidden-stakes">The boss notices patterns. Outcomes are revealed after you decide.</p></div>`}
function career(){if(!s.job){$("workTitle").textContent=s.fired?"Find a new opportunity":"Choose a career path";$("hustleList").innerHTML=(s.fired?`<div class="fired-card"><strong>Employment ended</strong><p>${s.fired}</p></div>`:"")+jobs.filter(j=>!s.history.includes(j.id)).map(j=>{let open=s.fired||j.unlock===0||s.knowledge>=j.unlock||s.reputation>=j.unlock;return `<button class="hustle" data-job="${j.id}" ${open?"":"disabled"}><span class="hustle-icon">${j.icon}</span><span><strong>${j.name}</strong><small>${open?"Start this career":`Unlock at ${j.unlock} knowledge or reputation`}</small></span><span class="reward">${open?`${money(j.pay[0])}+`:"🔒"}</span></button>`}).join("")}else{let j=jobs.find(x=>x.id===s.job),next=[2,5,9,14][s.level]||20,wc=350+s.workers*300,newJob=jobs.find(x=>!s.history.includes(x.id)&&(s.knowledge>=x.unlock||s.reputation>=x.unlock));$("workTitle").textContent=j.titles[s.level];$("hustleList").innerHTML=`<div class="career-card"><div class="career-top"><span class="hustle-icon">${j.icon}</span><div><strong>${j.titles[s.level]}</strong><small>${j.name} • Automatic income</small></div><span class="reward">~${money(estimate(j))}/day</span></div><div class="career-progress"><i style="width:${Math.min(100,s.xp/next*100)}%"></i></div><div class="career-meta"><span>${s.xp} experience</span><span>${s.xp>=next?`Review needs +${s.level+2} performance`:`${next-s.xp} days to review`}</span></div><div class="performance"><span>WORK RECORD</span><b>${s.performance>=0?"+":""}${s.performance}</b><span class="${s.warnings?"warning":""}">${s.warnings}/2 warnings</span></div><div class="upgrade-list"><button class="upgrade" data-up="gear" ${s.equipment||s.cash<j.cost?"disabled":""}><strong>🧰 ${s.equipment?"Equipment owned":j.gear}</strong><small>${s.equipment?"Permanent +35% income":`${money(j.cost)} • Buy once`}</small></button><button class="upgrade" data-up="worker" ${s.level<2||s.cash<wc?"disabled":""}><strong>👥 Hire worker</strong><small>${s.level<2?"Unlock at team leader":`${money(wc)} • +R55 daily`}</small></button></div>${s.workDone?"":workBox()}${newJob?`<button class="opportunity" data-switch="${newJob.id}">✨ New opportunity: ${newJob.name}</button>`:""}</div>`}let ready=s.job&&s.worked&&s.workDone&&s.eventDone;$("nextDayButton").disabled=!ready;$("nextDayButton").textContent=ready?(s.day===7?"SEE WEEK 1 SUMMARY →":"NEXT DAY →"):!s.job?"CHOOSE A CAREER FIRST":!s.eventDone?"MAKE TODAY'S LIFE CHOICE":"HANDLE THE WORK SITUATION"}
function estimate(j){return Math.round((j.pay[0]+j.pay[1])/2*(s.equipment?1.35:1)+s.workers*55)}
function earn(first=false){let j=jobs.find(x=>x.id===s.job);if(!j)return;let amount=Math.round(rnd(...j.pay)*(s.equipment?1.35:1)+s.workers*55);apply({cash:amount,energy:j.energy,reputation:3,happiness:2});s.xp++;s.worked=true;if(!first)toast(`${j.icon} Automatic income: +${money(amount)}. A work decision is waiting.`)}
function takeJob(id){if(s.history.includes(id))return;s.job=id;s.history.push(id);s.fired=null;s.level=s.xp=s.performance=s.bossFavor=s.warnings=s.workers=0;s.equipment=false;earn(true);toast("Career started. Income is automatic; choices control your future.");render()}
function workChoice(i){if(!s.job||s.workDone)return;let o=work[s.day-1][2][i],newWarning=o[4]||0;apply(o[3]);s.performance+=o[2];s.warnings+=newWarning;s.bossFavor+=o[5]||0;s.workDone=true;let j=jobs.find(x=>x.id===s.job),next=[2,5,9,14][s.level],need=s.level+2,effective=s.performance+s.bossFavor;if(s.warnings>=2||s.performance<=-5){s.fired=`You were fired from ${j.name} after repeated poor decisions.`;s.job=null;toast("Your manager calls you in: you have been dismissed.");return render()}if(s.level<4&&s.xp>=next&&effective>=need){s.level++;let bonus=s.level*100;s.cash+=bonus;s.reputation=cap(s.reputation+5);s.warnings=Math.max(0,s.warnings-1);toast(`🎉 Promoted to ${j.titles[s.level]} with a ${money(bonus)} bonus!`)}else if(newWarning)toast("That decision backfired. Your manager gives you a formal warning.");else if(o[5])toast("The boss seems pleased. That personal favour may help at review time.");else if(s.level<4&&s.xp>=next)toast("Your promotion review is delayed. The boss wants to see better judgement.");else toast(o[2]>1?"Good call. Your manager noticed.":o[2]<0?"That choice hurt your standing at work.":"The shift moves on.");render()}
function eventChoice(i){let c=events[s.day-1].c[i];if(c.need>s.cash)return;if(c.chase){let win=Math.random()<.25+(s.health+s.energy)/300;apply(win?{energy:-18,health:-5,reputation:7,happiness:8}:{energy:-20,health:-8,cash:-150,happiness:-8});c.r=win?"You recover your phone. Main-character energy!":"You lose them, but you are safe."}else if(c.help){let win=Math.random()<.25+s.social/120;apply(win?{social:4,reputation:8,happiness:6}:{cash:-150,happiness:-5});c.r=win?"The community blocks the escape route!":"The crowd reacts too late, but stays to help."}else apply(c.fx);s.eventDone=true;toast(c.r);render()}
function upgrade(t){let j=jobs.find(x=>x.id===s.job);if(t==="gear"){if(s.equipment||s.cash<j.cost)return;s.cash-=j.cost;s.assets+=j.cost*.65;s.equipment=true;toast(`${j.gear} purchased permanently.`)}else{let c=350+s.workers*300;if(s.level<2||s.cash<c)return;s.cash-=c;s.workers++;toast("Worker hired: +R55 daily income.")}render()}
function switchJob(id){if(s.history.includes(id))return;s.job=id;s.history.push(id);s.level=s.xp=s.performance=s.bossFavor=s.warnings=s.workers=0;s.equipment=false;s.worked=false;s.workDone=false;earn(true);toast("New career started. Your old career remains in your history.");render()}
function next(){if(!s.job||!s.eventDone||!s.workDone)return;if(s.day===7)return summary();s.day++;s.eventDone=s.workDone=s.worked=false;apply({energy:25,health:3,happiness:-1});if(s.day===4&&s.invested){let p=rnd(40,180);s.cash+=200+p;s.assets-=200;toast(`Vetkoek investment returned ${money(200+p)}!`)}earn();render();scrollTo({top:0,behavior:"smooth"})}
function summary(){$("gameScreen").classList.add("hidden");$("summaryScreen").classList.remove("hidden");$("resetButton").classList.add("hidden");let closest=Object.entries(s.relationships).sort((a,b)=>b[1]-a[1])[0],j=s.job&&jobs.find(x=>x.id===s.job),score=Math.max(0,Math.round(worth()+s.knowledge*3+s.reputation*3+s.happiness*2+s.performance*20));$("summaryTitle").textContent=`What a week, ${s.name}.`;$("summaryMessage").textContent="Your money, work record, and relationships all tell your story.";$("summaryScore").innerHTML=`${score}<small>LIFE SCORE</small>`;$("summaryGrid").innerHTML=`<div class="summary-item"><span>CAREER</span><strong>${j?j.titles[s.level]:"Between jobs"}</strong></div><div class="summary-item"><span>NET WORTH</span><strong>${money(worth())}</strong></div><div class="summary-item"><span>WORK RECORD</span><strong>${s.performance>=0?"+":""}${s.performance}</strong></div><div class="summary-item"><span>CLOSEST PERSON</span><strong>${people[closest[0]][0]}</strong></div>`;$("summaryQuote").textContent="Success means more when your work, choices, and people grow together."}
function show(){$("startScreen").classList.add("hidden");$("summaryScreen").classList.add("hidden");$("gameScreen").classList.remove("hidden");$("resetButton").classList.remove("hidden");render()}function reset(){if(confirm("Start over?")){localStorage.removeItem(KEY);location.reload()}}
$("newLifeForm").addEventListener("submit",e=>{e.preventDefault();s=fresh($("playerName").value);show()});$("continueButton").onclick=()=>{s=load();show()};$("resetButton").onclick=reset;$("replayButton").onclick=()=>{localStorage.removeItem(KEY);s=fresh("");show()};$("nextDayButton").onclick=next;$("hustleList").onclick=e=>{let a=e.target.closest("[data-job]"),b=e.target.closest("[data-up]"),c=e.target.closest("[data-switch]"),d=e.target.closest("[data-work]");if(a)takeJob(a.dataset.job);if(b)upgrade(b.dataset.up);if(c)switchJob(c.dataset.switch);if(d)workChoice(+d.dataset.work)};$("choiceList").onclick=e=>{let b=e.target.closest("[data-event]");if(b)eventChoice(+b.dataset.event)};let old=load();$("continueButton").classList.toggle("hidden",!old);if(old)$("continueButton").textContent=`Continue ${old.name}'s life • Day ${old.day}`;
function empireValue(j){return Math.round(worth()+s.workers*1200+s.expansions*8500+s.level*3000+(s.equipment?j.cost:0))}
career=function(){if(!s.job){$("workTitle").textContent=s.fired?"Choose your next path":"Choose how you will start";$("hustleList").innerHTML=(s.fired?`<div class="fired-card"><strong>That chapter ended</strong><p>${s.fired}</p></div>`:"")+jobs.filter(j=>!s.history.includes(j.id)).map(j=>`<button class="hustle" data-job="${j.id}"><span class="hustle-icon">${j.icon}</span><span><strong>${j.name}</strong><small>${j.type} • ${j.desc}</small></span><span class="reward">${money(j.pay[0])}+</span></button>`).join("")}else{let j=jobs.find(x=>x.id===s.job),next=[2,5,9,14][s.level]||20,wc=350+s.workers*300,siteCost=800+s.expansions*1200,value=empireValue(j),newJob=jobs.find(x=>!s.history.includes(x.id));$("workTitle").textContent=j.titles[s.level];$("hustleList").innerHTML=`<div class="career-card"><div class="career-top"><span class="hustle-icon">${j.icon}</span><div><strong>${j.titles[s.level]}</strong><small>${j.name} • ${j.type}</small></div><span class="reward">~${money(estimate(j))}/day</span></div><p class="path-note">${j.desc}</p><div class="empire-progress"><div><span>${j.type==="BUSINESS"?"BUSINESS VALUE":"CAREER WEALTH"}</span><strong>${money(value)} / R1,000,000</strong></div><div class="bar"><i style="width:${Math.min(100,value/10000)}%"></i></div></div><div class="career-progress"><i style="width:${Math.min(100,s.xp/next*100)}%"></i></div><div class="career-meta"><span>${s.xp} experience</span><span>${s.xp>=next?"Promotion review ready":`${next-s.xp} days to review`}</span></div><div class="performance"><span>WORK RECORD</span><b>${s.performance>=0?"+":""}${s.performance}</b><span class="${s.warnings?"warning":""}">${s.warnings}/2 warnings</span></div><div class="upgrade-list"><button class="upgrade" data-up="gear" ${s.equipment||s.cash<j.cost?"disabled":""}><strong>🧰 ${s.equipment?"Owned":j.gear}</strong><small>${s.equipment?"Permanent +35%":`${money(j.cost)} • Buy once`}</small></button><button class="upgrade" data-up="worker" ${s.level<2||s.cash<wc?"disabled":""}><strong>👥 ${j.type==="BUSINESS"?"Hire employee":"Build your team"}</strong><small>${s.level<2?"Unlock after promotion":`${money(wc)} • +R55 daily`}</small></button><button class="expansion-button" data-up="site" ${s.level<2||s.cash<siteCost||s.expansions>=4?"disabled":""}><strong>🏢 ${s.expansions>=4?"Growth path completed":j.expansions[s.expansions]}</strong><small>${s.expansions>=4?"Next goal: national scale":s.level<2?"Unlock after reaching leadership":`${money(siteCost)} • Major income boost`}</small></button></div>${s.workDone?"":workBox()}${newJob?`<button class="opportunity" data-switch="${newJob.id}">Explore another path: ${newJob.name}</button>`:""}</div>`}let ready=s.job&&s.worked&&s.workDone&&s.eventDone;$("nextDayButton").disabled=!ready;$("nextDayButton").textContent=ready?(s.day===7?"SEE WEEK 1 SUMMARY →":"NEXT DAY →"):!s.job?"CHOOSE YOUR STARTING PATH":!s.eventDone?"MAKE TODAY'S LIFE CHOICE":"HANDLE THE WORK SITUATION"}
estimate=function(j){return Math.round((j.pay[0]+j.pay[1])/2*(s.equipment?1.35:1)+s.workers*55+s.expansions*180)};
earn=function(first=false){let j=jobs.find(x=>x.id===s.job);if(!j)return;let amount=Math.round(rnd(...j.pay)*(s.equipment?1.35:1)+s.workers*55+s.expansions*180);apply({cash:amount,energy:j.energy,reputation:3,happiness:2});s.xp++;s.worked=true;if(!first)toast(`${j.icon} Automatic income: +${money(amount)}. A decision is waiting.`)};
takeJob=function(id){if(s.history.includes(id))return;s.job=id;s.history.push(id);s.fired=null;s.level=s.xp=s.performance=s.bossFavor=s.warnings=s.workers=s.expansions=0;s.equipment=false;earn(true);toast(`${jobs.find(x=>x.id===id).name} started. This can grow far beyond Week 1.`);render()};
switchJob=function(id){if(s.history.includes(id))return;s.job=id;s.history.push(id);s.level=s.xp=s.performance=s.bossFavor=s.warnings=s.workers=s.expansions=0;s.equipment=false;s.worked=false;s.workDone=false;earn(true);toast("New path started. Your earlier work stays in your history.");render()};
upgrade=function(t){let j=jobs.find(x=>x.id===s.job);if(t==="gear"){if(s.equipment||s.cash<j.cost)return;s.cash-=j.cost;s.assets+=j.cost*.65;s.equipment=true;toast(`${j.gear} purchased permanently.`)}else if(t==="worker"){let c=350+s.workers*300;if(s.level<2||s.cash<c)return;s.cash-=c;s.workers++;toast(j.type==="BUSINESS"?"Employee hired. Your business earns more without you.":"Your team grew. Delegation improves daily earning power.")}else{let c=800+s.expansions*1200;if(s.level<2||s.cash<c||s.expansions>=4)return;s.cash-=c;s.assets+=c;s.expansions++;toast(`${j.expansions[s.expansions-1]} secured. Your long-term income jumped.`)}render()};
function moveThief(){let b=$("thiefButton");b.style.left=`${rnd(4,78)}%`;b.style.top=`${rnd(5,76)}%`}
function finishChase(won){clearInterval(chaseTick);clearTimeout(chaseTimer);$("chaseGame").classList.add("hidden");apply(won?{energy:-15,health:-4,reputation:8,happiness:9}:{energy:-18,health:-5,cash:-150,happiness:-8});s.eventDone=true;toast(won?"You caught the thief and recovered your phone!":"The thief escaped into the crowd. You are shaken, but safe.");render()}
function startChase(){let hits=0,required=3,time=Math.max(4.5,6+(s.energy-50)/50);$("chaseGame").classList.remove("hidden");$("chaseHits").textContent=`0 / ${required} catches`;moveThief();let end=Date.now()+time*1000;clearInterval(chaseTick);clearTimeout(chaseTimer);chaseTick=setInterval(()=>{$("chaseTime").textContent=`${Math.max(0,(end-Date.now())/1000).toFixed(1)}s`},100);chaseTimer=setTimeout(()=>finishChase(false),time*1000);$("thiefButton").onclick=()=>{hits++;$("chaseHits").textContent=`${hits} / ${required} catches`;if(hits>=required)finishChase(true);else moveThief()}}
story=function(){let e=events[(s.day-1)%events.length];if(!s.eventDone){$("storyIcon").textContent=e.icon;$("storyKicker").textContent=`WEEK ${Math.ceil(s.day/7)} • ${e.tag}`;$("storyTitle").textContent=e.title;$("storyText").textContent=e.text;$("choiceList").innerHTML=e.c.map((c,i)=>`<button class="choice" data-event="${i}" ${c.need>s.cash?"disabled":""}>${c.t}<small>${c.need>s.cash?`Need ${money(c.need)}`:c.s}</small></button>`).join("")}else{$("storyIcon").textContent="✓";$("storyKicker").textContent=`DAY ${s.day} CHOICE MADE`;$("storyTitle").textContent="Your choice is remembered.";$("storyText").textContent=s.workDone?"Today's decisions are complete.":"There is still a situation waiting at work below.";$("choiceList").innerHTML=""}};
workBox=function(){let w=work[(s.day-1)%work.length];return `<div class="work-situation"><strong>Work situation: ${w[0]}</strong><p>${w[1]}</p><div class="work-options">${w[2].map((o,i)=>`<button class="work-option" data-work="${i}">${o[0]}<small>Choose your response</small></button>`).join("")}</div><p class="hidden-stakes">The boss notices patterns. Outcomes are revealed after you decide.</p></div>`};
workChoice=function(i){if(!s.job||s.workDone)return;let o=work[(s.day-1)%work.length][2][i],newWarning=o[4]||0;apply(o[3]);s.performance+=o[2];s.warnings+=newWarning;s.bossFavor+=o[5]||0;s.workDone=true;let j=jobs.find(x=>x.id===s.job),next=[2,5,9,14][s.level],need=s.level+2,effective=s.performance+s.bossFavor;if(s.warnings>=2||s.performance<=-5){s.fired=`You were fired from ${j.name} after repeated poor decisions.`;s.job=null;toast("Your manager calls you in: you have been dismissed.");return render()}if(s.level<4&&s.xp>=next&&effective>=need){s.level++;let bonus=s.level*100;s.cash+=bonus;s.reputation=cap(s.reputation+5);s.warnings=Math.max(0,s.warnings-1);toast(`🎉 Promoted to ${j.titles[s.level]} with a ${money(bonus)} bonus!`)}else if(newWarning)toast("That decision backfired. Your manager gives you a formal warning.");else if(o[5])toast("The boss seems pleased. That personal favour may help at review time.");else if(s.level<4&&s.xp>=next)toast("Your promotion review is delayed. The boss wants better judgement.");else toast(o[2]>1?"Good call. Your manager noticed.":o[2]<0?"That choice hurt your standing at work.":"The shift moves on.");render()};
eventChoice=function(i){let c=events[(s.day-1)%events.length].c[i];if(c.need>s.cash)return;if(c.chase)return startChase();if(c.help){let win=Math.random()<.25+s.social/120;apply(win?{social:4,reputation:8,happiness:6}:{cash:-150,happiness:-5});c.r=win?"The community blocks the escape route!":"The crowd reacts too late, but stays to help."}else apply(c.fx);s.eventDone=true;toast(c.r);render()};
next=function(){if(!s.job||!s.eventDone||!s.workDone)return;if(s.day%7===0)return summary();s.day++;s.eventDone=s.workDone=s.worked=false;apply({energy:25,health:3,happiness:-1});if(s.day===4&&s.invested){let p=rnd(40,180);s.cash+=200+p;s.assets-=200;toast(`Vetkoek investment returned ${money(200+p)}!`)}earn();render();scrollTo({top:0,behavior:"smooth"})};
const renderV5=render;render=function(){renderV5();$("dayValue").textContent=s.day};
$("continueWeekButton").onclick=()=>{s.day++;s.eventDone=s.workDone=s.worked=false;apply({energy:35,health:5,happiness:4});earn();$("summaryScreen").classList.add("hidden");$("gameScreen").classList.remove("hidden");$("resetButton").classList.remove("hidden");render();scrollTo({top:0,behavior:"smooth"})};
$("nextDayButton").onclick=next;

// V0.7: a more playful presentation, stable shuffled choices, branching
// situations, and a chase that behaves like a short game rather than a prompt.
const branchScenes={
  "event-0-choice-0":{
    tag:"INSIDE THE TAXI",title:"Where do you squeeze in?",text:"The taxi is almost full. Every open seat comes with a different kind of morning.",
    c:[
      {id:"taxi-front",t:"Ride up front with the driver",s:"Knowledge +4 • Reputation +2",need:25,fx:{cash:-25,knowledge:4,reputation:2,energy:1},r:"The driver shares a sharp lesson about running routes and running a business."},
      {id:"taxi-back",t:"Join the loud back-seat debate",s:"Social +7 • Energy −2",need:25,fx:{cash:-25,social:7,energy:-2,rel:{sizwe:3}},r:"You arrive with three new jokes and one useful contact."},
      {id:"taxi-wait",t:"Wait for a quieter taxi",s:"Energy −4 • Happiness +3",need:25,fx:{cash:-25,energy:-4,happiness:3},r:"You lose time, but gain a rare peaceful ride."}
    ]
  },
  "event-1-choice-2":{
    tag:"MARKETPLACE DMS",title:"The seller replies…",text:"Two pairs look clean in the photos. The seller says there are other buyers waiting.",
    c:[
      {id:"shoe-check",t:"Inspect them properly first",s:"Cash −R70 • Knowledge +4",need:70,fx:{cash:-70,happiness:6,knowledge:4,rel:{lerato:3}},r:"You spot a small flaw, negotiate honestly, and still leave looking sharp."},
      {id:"shoe-bargain",t:"Send a cheeky R50 offer",s:"Cash −R50 • Social +3",need:50,fx:{cash:-50,happiness:5,social:3},r:"After three voice notes and a dramatic pause, the seller accepts."},
      {id:"shoe-walk",t:"Mute the chat and keep saving",s:"Knowledge +5 • Happiness −2",fx:{knowledge:5,happiness:-2},r:"The temptation passes. Your savings survive the group chat."}
    ]
  },
  "event-2-choice-1":{
    tag:"THE LUNCH RUSH",title:"Your advert brings a crowd",text:"The queue is growing fast. The neighbour looks at you: what is the move?",
    c:[
      {id:"stand-orders",t:"Organise orders with numbered slips",s:"Knowledge +6 • Reputation +6",fx:{energy:-7,knowledge:6,reputation:6,social:3,rel:{sizwe:6}},r:"The line starts moving. People notice that you can turn chaos into a system."},
      {id:"stand-hype",t:"Hype the special like a street promoter",s:"Social +9 • Happiness +4",fx:{energy:-9,social:9,happiness:4,reputation:4,rel:{sizwe:5}},r:"Your voice is gone, but the stand sells out before two."},
      {id:"stand-delivery",t:"Offer quick deliveries nearby",s:"Energy −12 • Reputation +9",fx:{energy:-12,reputation:9,knowledge:3,rel:{sizwe:7}},r:"You sprint between shops and unlock a whole new kind of customer."}
    ]
  },
  "event-4-choice-1":{
    tag:"THE CROWD TURNS",title:"Who do you call to?",text:"People heard you shout. You only have a second to point them in the right direction.",
    c:[
      {id:"help-marshal",t:"Signal the taxi marshal",s:"Reputation +9 • Energy −4",fx:{energy:-4,reputation:9,social:5,happiness:5},r:"The marshal closes the gap and your phone makes it back to your hand."},
      {id:"help-vendors",t:"Ask the nearby vendors to block the lane",s:"Social +10 • Happiness +5",fx:{social:10,happiness:5,reputation:6,rel:{sizwe:4}},r:"A crate, a cooler box, and perfect teamwork stop the escape."},
      {id:"help-security",t:"Run toward station security",s:"Health −3 • Knowledge +3",fx:{health:-3,energy:-7,knowledge:3,reputation:4},r:"Security spots the runner. You recover the phone, breathless but safe."}
    ]
  },
  "event-5-choice-0":{
    tag:"INTERVIEW PREP",title:"How tough should you be?",text:"Lerato wants honest practice—not empty encouragement.",
    c:[
      {id:"lerato-roleplay",t:"Role-play the strict interviewer",s:"Lerato +15 • Knowledge +4",fx:{energy:-10,knowledge:4,social:5,reputation:4,happiness:3,rel:{lerato:15}},r:"The real interview feels easy after your ruthless practice round."},
      {id:"lerato-story",t:"Help her sharpen her best story",s:"Lerato +12 • Social +7",fx:{energy:-8,social:7,reputation:3,happiness:4,rel:{lerato:12}},r:"She finally tells her story with confidence instead of apologising."},
      {id:"lerato-research",t:"Research the company together",s:"Knowledge +8 • Lerato +9",fx:{energy:-7,knowledge:8,rel:{lerato:9}},r:"You find the one detail that makes her answer stand out."}
    ]
  }
};

events.forEach((event,eventIndex)=>{
  event.c.forEach((choice,choiceIndex)=>{
    choice.id=choice.id||`event-${eventIndex}-choice-${choiceIndex}`;
    if(branchScenes[choice.id])choice.followUp=branchScenes[choice.id];
  });
});

const sceneKinds=["scene-ticket","scene-money","scene-money","scene-alert","scene-alert","scene-chat","scene-social"];
const choiceLetters=["A","B","C","D"];
let lastHudText={},chaseLane=-1,chaseFinishing=false;

function ensureV7State(){
  s.choiceOrders=s.choiceOrders&&typeof s.choiceOrders==="object"?s.choiceOrders:{};
  if(!("eventBranch" in s))s.eventBranch=null;
  if(!("lastOutcome" in s))s.lastOutcome="";
}

function orderedForScene(key,items){
  ensureV7State();
  const result=GameSystems.orderChoices(items,s.choiceOrders[key]);
  s.choiceOrders[key]=result.ids;
  return result.items;
}

function choiceMarkup(choice,index,attribute){
  const locked=choice.need>s.cash;
  return `<button class="choice" ${attribute}="${choice.id}" ${locked?"disabled":""}><span class="choice-marker">${choiceLetters[index]||"•"}</span><span class="choice-copy">${choice.t}<small>${locked?`Need ${money(choice.need)}`:choice.s}</small></span></button>`;
}

story=function(){
  ensureV7State();
  const eventIndex=(s.day-1)%events.length,event=events[eventIndex],card=$("storyCard");
  const branchState=s.eventBranch&&s.eventBranch.eventIndex===eventIndex?s.eventBranch:null;
  const parent=branchState&&event.c.find(choice=>choice.id===branchState.parentId);
  const branch=parent&&GameSystems.branchForChoice(event.c,parent.id);
  card.className=`story-card scene-${eventIndex%7} ${sceneKinds[eventIndex%sceneKinds.length]}${branch?" branching":""}`;

  if(!s.eventDone){
    const scene=branch||event;
    const key=branch?`day-${s.day}-branch-${parent.id}`:`day-${s.day}-event`;
    const ordered=orderedForScene(key,scene.c);
    $("storyIcon").textContent=branch?"↳":event.icon;
    $("storyKicker").textContent=branch?`${scene.tag} • SECOND MOVE`:`WEEK ${Math.ceil(s.day/7)} • ${event.tag}`;
    $("storyTitle").textContent=scene.title;
    $("storyText").textContent=scene.text;
    $("choiceList").innerHTML=(branch?`<span class="branch-label">Your first choice opened this moment</span>`:"")+ordered.map((choice,index)=>choiceMarkup(choice,index,"data-choice-id")).join("");
  }else{
    $("storyIcon").textContent="✓";
    $("storyKicker").textContent=`DAY ${s.day} • CONSEQUENCE`;
    $("storyTitle").textContent="That choice changed the day.";
    $("storyText").textContent=s.lastOutcome||(s.workDone?"Today's decisions are complete.":"There is still a situation waiting at work below.");
    $("choiceList").innerHTML="";
  }
};

workBox=function(){
  const workIndex=(s.day-1)%work.length,w=work[workIndex];
  const choices=w[2].map((option,index)=>({id:`work-${workIndex}-choice-${index}`,option,index}));
  const ordered=orderedForScene(`day-${s.day}-work`,choices);
  return `<div class="work-situation"><strong>${w[0]}</strong><p>${w[1]}</p><div class="work-options">${ordered.map(item=>`<button class="work-option" data-work="${item.index}">${item.option[0]}<small>Choose your response</small></button>`).join("")}</div><p class="hidden-stakes">No labels. No spoilers. Your record will reveal whether that was smart.</p></div>`;
};

eventChoice=function(choiceId){
  ensureV7State();
  const eventIndex=(s.day-1)%events.length,event=events[eventIndex];
  const branchState=s.eventBranch&&s.eventBranch.eventIndex===eventIndex?s.eventBranch:null;
  const parent=branchState&&event.c.find(choice=>choice.id===branchState.parentId);
  const branch=parent&&GameSystems.branchForChoice(event.c,parent.id);
  const choices=branch?branch.c:event.c;
  const choice=choices.find(item=>item.id===choiceId);
  if(!choice||choice.need>s.cash)return;

  const followUp=!branch&&GameSystems.branchForChoice(event.c,choice.id);
  if(followUp){
    s.eventBranch={eventIndex,parentId:choice.id};
    save();
    story();
    $("storyCard").scrollIntoView({behavior:"smooth",block:"center"});
    return;
  }
  if(choice.chase)return startChase();
  if(choice.help){
    const win=Math.random()<.25+s.social/120;
    apply(win?{social:4,reputation:8,happiness:6}:{cash:-150,happiness:-5});
    choice.r=win?"The community blocks the escape route!":"The crowd reacts too late, but stays to help.";
  }else apply(choice.fx);
  s.eventDone=true;
  s.eventBranch=null;
  s.lastOutcome=choice.r;
  toast(choice.r);
  render();
};

const renderV7Base=render;
render=function(){
  ensureV7State();
  renderV7Base();
  $("energyHint").textContent=s.job?`DAY ${s.day} • INCOME RUNS AUTOMATICALLY`:"PICK YOUR FIRST MOVE";
  const currentHud={cash:$("cashValue").textContent,worth:$("netWorthValue").textContent,day:$("dayValue").textContent};
  Object.entries({cash:"cashValue",worth:"netWorthValue",day:"dayValue"}).forEach(([key,id])=>{
    if(lastHudText[key]&&lastHudText[key]!==currentHud[key]){
      const element=$(id);
      element.classList.remove("value-bump");
      requestAnimationFrame(()=>element.classList.add("value-bump"));
    }
  });
  lastHudText=currentHud;
  clearTimeout(uiTimer);
  uiTimer=setTimeout(()=>document.querySelectorAll(".value-bump").forEach(element=>element.classList.remove("value-bump")),650);
};

$("choiceList").onclick=event=>{
  const button=event.target.closest("[data-choice-id]");
  if(button)eventChoice(button.dataset.choiceId);
};

const nextV7Base=next;
next=function(){
  if(s&&s.eventDone&&s.workDone)s.eventBranch=null;
  nextV7Base();
};
$("nextDayButton").onclick=next;

moveThief=function(stage=0){
  const target=GameSystems.nextChaseTarget(Math.random,chaseLane);
  chaseLane=target.lane;
  const button=$("thiefButton");
  button.style.transitionDuration=`${Math.max(240,target.duration-stage*45)}ms`;
  button.style.left=`${target.x}%`;
  button.style.top=`${target.y}%`;
};

finishChase=function(won){
  if(chaseFinishing)return;
  chaseFinishing=true;
  clearInterval(chaseTick);
  clearInterval(chaseMoveTick);
  clearTimeout(chaseTimer);
  const track=$("chaseTrack");
  track.classList.remove("urgent");
  track.classList.add(won?"caught":"escaped");
  $("chaseCallout").textContent=won?"PHONE RECOVERED! The whole rank erupts.":"They disappear into the crowd. You chose safety over a blind corner.";
  setTimeout(()=>{
    $("chaseGame").classList.add("hidden");
    document.body.classList.remove("chase-open");
    apply(won?{energy:-15,health:-4,reputation:8,happiness:9}:{energy:-18,health:-5,cash:-150,happiness:-8});
    s.eventDone=true;
    s.eventBranch=null;
    s.lastOutcome=won?"You caught the thief and recovered your phone. The taxi rank celebrates with you.":"The thief escaped, but you stopped before the chase became more dangerous.";
    toast(s.lastOutcome);
    render();
  },620);
};

startChase=function(){
  let hits=0;
  const required=4,time=Math.max(6.3,Math.min(8,7.1+(s.energy-50)/55));
  chaseLane=-1;
  chaseFinishing=false;
  $("chaseGame").classList.remove("hidden");
  document.body.classList.add("chase-open");
  $("chaseTrack").className="chase-track";
  $("thiefButton").disabled=false;
  $("chaseHits").textContent=`0 / ${required} catches`;
  $("chaseTime").textContent=`${time.toFixed(1)}s`;
  $("chaseMeterFill").style.width="0%";
  $("chaseCallout").textContent="Tap the runner four times. They keep changing lanes.";
  moveThief(0);

  const end=Date.now()+time*1000;
  clearInterval(chaseTick);
  clearInterval(chaseMoveTick);
  clearTimeout(chaseTimer);
  chaseTick=setInterval(()=>{
    const left=Math.max(0,(end-Date.now())/1000);
    $("chaseTime").textContent=`${left.toFixed(1)}s`;
    $("chaseTrack").classList.toggle("urgent",left<2.4);
    if(left<2.4&&hits<required)$("chaseCallout").textContent="MOVE! They’re nearly out of sight!";
  },100);
  chaseMoveTick=setInterval(()=>moveThief(hits),720);
  chaseTimer=setTimeout(()=>finishChase(false),time*1000);

  $("thiefButton").onclick=()=>{
    if(chaseFinishing)return;
    hits++;
    clearInterval(chaseMoveTick);
    $("chaseHits").textContent=`${hits} / ${required} catches`;
    $("chaseMeterFill").style.width=`${hits/required*100}%`;
    $("chaseCallout").textContent=["Good spot—keep moving!","Two hits! The crowd is shouting directions!","One more! Don’t lose them!","GOT THEM!"][hits-1];
    $("thiefButton").classList.remove("hit");
    requestAnimationFrame(()=>$("thiefButton").classList.add("hit"));
    const burst=$("chaseBurst");
    burst.style.left=$("thiefButton").style.left;
    burst.style.top=$("thiefButton").style.top;
    burst.innerHTML=Array.from({length:8},(_,index)=>{
      const angle=index*Math.PI/4;
      return `<i style="--dx:${Math.cos(angle)*52}px;--dy:${Math.sin(angle)*52}px"></i>`;
    }).join("");
    $("chaseGame").querySelector(".chase-card").classList.add("combo");
    setTimeout(()=>$("chaseGame").querySelector(".chase-card").classList.remove("combo"),260);
    if(hits>=required){
      $("thiefButton").disabled=true;
      finishChase(true);
    }else{
      moveThief(hits);
      chaseMoveTick=setInterval(()=>moveThief(hits),Math.max(420,720-hits*65));
    }
  };
};
})();
