import { createSeededRandom } from './chase-generator.js';
export function createTapThiefModel({seed=1,durationMs=12000}={}) {
 const random=createSeededRandom(seed);
 return {random,target:Math.floor(random()*9),elapsedMs:0,sinceMove:0,hits:0,misses:0,durationMs,result:null};
}
function moveTarget(model) { model.target=(model.target+1+Math.floor(model.random()*8))%9;model.sinceMove=0; }
export function tapTarget(model,target) {
 if(model.result)return model;
 if(target!==model.target){model.misses++;return model;}
 model.hits++;
 if(model.hits>=8)model.result={outcome:'caught',reason:'tapped-thief',elapsedMs:model.elapsedMs};
 else moveTarget(model);
 return model;
}
export function advanceTapThief(model,deltaMs) {
 if(model.result)return model;
 model.elapsedMs+=Math.max(0,deltaMs);model.sinceMove+=Math.max(0,deltaMs);
 if(model.elapsedMs>=model.durationMs)model.result={outcome:'escaped',reason:'time-up',elapsedMs:model.elapsedMs};
 else if(model.sinceMove>=Math.max(650,1200-model.hits*60))moveTarget(model);
 return model;
}
export function start({host,seed=1,reducedMotion=false}={}) {
 return new Promise(resolve=>{
 const model=createTapThiefModel({seed});
 const shell=document.createElement('section');shell.className='tap-thief';shell.setAttribute('role','dialog');shell.setAttribute('aria-label','Catch the thief');
 shell.innerHTML='<h2>CATCH THE THIEF</h2><p>Tap the masked thief 8 times before he escapes. Ignore the bystanders.</p><strong class="tap-thief-status" aria-live="polite"></strong><div class="tap-thief-grid"></div><button class="tap-thief-exit" type="button">Let him go</button>';
 host.replaceChildren(shell);
 const grid=shell.querySelector('.tap-thief-grid');const status=shell.querySelector('.tap-thief-status');
 const buttons=Array.from({length:9},(_,index)=>{const button=document.createElement('button');button.type='button';button.className='tap-thief-cell';button.addEventListener('click',()=>{tapTarget(model,index);paint();finish();});grid.append(button);return button;});
 let timer;let done=false;let previous=performance.now();
 function paint(){buttons.forEach((button,index)=>{const active=index===model.target;button.textContent=active?'🥷':'🧍';button.classList.toggle('is-thief',active);button.setAttribute('aria-label',active?'Tap the thief':'Bystander');});status.textContent=`Caught ${model.hits}/8 · ${Math.max(0,Math.ceil((model.durationMs-model.elapsedMs)/1000))}s · Misses ${model.misses}`;}
 function cleanup(){clearInterval(timer);document.removeEventListener('visibilitychange',visibility);}
 function finish(){if(!model.result||done)return;done=true;cleanup();buttons.forEach(button=>button.disabled=true);status.textContent=model.result.outcome==='caught'?'Caught! Your phone is safe.':'The thief got away.';setTimeout(()=>resolve({...model.result,seed}),reducedMotion?50:350);}
 function visibility(){previous=performance.now();}
 document.addEventListener('visibilitychange',visibility);
 shell.querySelector('.tap-thief-exit').addEventListener('click',()=>{model.result={outcome:'escaped',reason:'let-go',elapsedMs:model.elapsedMs};finish();});
 paint();buttons[model.target].focus({preventScroll:true});
 timer=setInterval(()=>{const now=performance.now();if(!document.hidden)advanceTapThief(model,now-previous);previous=now;paint();finish();},80);
 });
}
