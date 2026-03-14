const SAVE_KEY='emmyRollover_v6';
const ARCHIVE_KEY='emmyArchive_v1';
const SETTINGS_KEY='emmySettings_v1';

let plans=[{id:1,name:'Plan A',days:[],currentDay:0,balance:4000,startAmt:4000,numDays:7,streak:0,streakType:null}];
let activePlan=0, chart=null, isDark=true;
let settings={quotes:true,reminderTime:null};
let archive=[];

const QUOTES=[
  {text:"The secret of getting ahead is getting started.",author:"Mark Twain"},
  {text:"Discipline is the bridge between goals and accomplishment.",author:"Jim Rohn"},
  {text:"Small daily improvements are the key to staggering long-term results.",author:"Robin Sharma"},
  {text:"Success is the sum of small efforts, repeated day in and day out.",author:"Robert Collier"},
  {text:"You don't have to be great to start, but you have to start to be great.",author:"Zig Ziglar"},
  {text:"Risk comes from not knowing what you're doing.",author:"Warren Buffett"},
  {text:"In investing, what is comfortable is rarely profitable.",author:"Robert Arnott"},
  {text:"Plan your trade and trade your plan.",author:"Trading Proverb"},
  {text:"Manage your risk first. Profits will follow.",author:"Trading Proverb"},
  {text:"The goal is not to predict the market, but to react to it.",author:"Unknown"},
];

const SPORT_ICONS={'⚽ Football':'⚽','🏀 Basketball':'🏀','🎾 Tennis':'🎾','🏈 American Football':'🏈','⚾ Baseball':'⚾','🏏 Cricket':'🏏','🥊 Boxing/MMA':'🥊','🏐 Volleyball':'🏐','🎱 Other':'🎱'};

function P(){return plans[activePlan];}
function get(id){return document.getElementById(id);}
function fmt(n){return '₦'+Math.round(n).toLocaleString();}

// ─── THEME ─────────────────────────────────────────────────
function toggleTheme(){
  isDark=!isDark;
  document.body.classList.toggle('light',!isDark);
  get('theme-btn').textContent=isDark?'☀ Light':'☾ Dark';
  saveState();
}

// ─── TABS ──────────────────────────────────────────────────
function switchTab(name){
  document.querySelectorAll('.nav-tab').forEach((t,i)=>t.classList.toggle('active',['tracker','summary','history','calculator','settings'][i]===name));
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  get('panel-'+name).classList.add('active');
  if(name==='summary') renderSummary();
  if(name==='history') renderHistory();
}

// ─── QUOTE ─────────────────────────────────────────────────
function renderQuote(){
  const wrap=get('quote-wrap');
  if(!settings.quotes){wrap.innerHTML='';return;}
  const q=QUOTES[Math.floor(Math.random()*QUOTES.length)];
  wrap.innerHTML=`<div class="quote-card"><div class="quote-icon">💬</div><div><div class="quote-text">"${q.text}"</div><div class="quote-author">— ${q.author}</div></div></div>`;
}

// ─── PLAN TABS ─────────────────────────────────────────────
function renderPlanTabs(){
  const wrap=get('plan-tabs'); wrap.innerHTML='';
  plans.forEach((p,i)=>{
    const btn=document.createElement('button');
    btn.className='plan-tab'+(i===activePlan?' active':'');
    btn.textContent=p.name;
    btn.onclick=()=>{activePlan=i;get('startStake').value=P().startAmt;get('numDays').value=P().numDays;renderPlanTabs();renderAll();};
    wrap.appendChild(btn);
  });
}

function addPlan(){
  const letters='ABCDEFGHIJ';
  const name='Plan '+(letters[plans.length]||(plans.length+1));
  const s=parseInt(get('startStake').value)||4000, n=parseInt(get('numDays').value)||7;
  plans.push({id:Date.now(),name,days:buildPlan(s,n),currentDay:0,balance:s,startAmt:s,numDays:n,streak:0,streakType:null});
  activePlan=plans.length-1; renderPlanTabs(); renderAll();
}

// ─── AUDIO ─────────────────────────────────────────────────
function playWinSound(){
  try{
    const ctx=new(window.AudioContext||window.webkitAudioContext)(), t=ctx.currentTime;
    [523,659,784,1047].forEach((f,i)=>{
      const o=ctx.createOscillator(),g=ctx.createGain();
      o.connect(g);g.connect(ctx.destination);o.type='sine';
      o.frequency.setValueAtTime(f,t+i*.1);
      g.gain.setValueAtTime(.28,t+i*.1);g.gain.exponentialRampToValueAtTime(.001,t+i*.1+.25);
      o.start(t+i*.1);o.stop(t+i*.1+.25);
    });
  }catch(e){}
}
function playLossSound(){
  try{
    const ctx=new(window.AudioContext||window.webkitAudioContext)(), t=ctx.currentTime;
    [330,277].forEach((f,i)=>{
      const o=ctx.createOscillator(),g=ctx.createGain();
      o.connect(g);g.connect(ctx.destination);o.type='sawtooth';
      o.frequency.setValueAtTime(f,t+i*.18);o.frequency.linearRampToValueAtTime(f*.7,t+i*.18+.35);
      g.gain.setValueAtTime(.22,t+i*.18);g.gain.exponentialRampToValueAtTime(.001,t+i*.18+.35);
      o.start(t+i*.18);o.stop(t+i*.18+.35);
    });
  }catch(e){}
}

// ─── CONFETTI ──────────────────────────────────────────────
function launchConfetti(){
  const canvas=get('confetti-canvas'); canvas.style.display='block';
  const ctx=canvas.getContext('2d'); canvas.width=window.innerWidth; canvas.height=window.innerHeight;
  const pieces=[], colors=['#c9a84c','#29d996','#4d9fff','#ff5f5f','#e8c97a','#fff'];
  for(let i=0;i<160;i++) pieces.push({x:Math.random()*canvas.width,y:-10,r:Math.random()*6+3,c:colors[Math.floor(Math.random()*colors.length)],vx:(Math.random()-.5)*4,vy:Math.random()*4+2,rot:Math.random()*360,vr:(Math.random()-.5)*6,op:1});
  let frame=0;
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    pieces.forEach(p=>{ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot*Math.PI/180);ctx.globalAlpha=p.op;ctx.fillStyle=p.c;ctx.fillRect(-p.r,-p.r/2,p.r*2,p.r);ctx.restore();p.x+=p.vx;p.y+=p.vy;p.rot+=p.vr;p.vy+=.05;if(frame>60)p.op=Math.max(0,p.op-.012);});
    frame++;
    if(frame<180)requestAnimationFrame(draw); else canvas.style.display='none';
  }
  draw();
}

// ─── BANKROLL GAUGE ────────────────────────────────────────
function renderGauge(){
  const p=P(); const pct=Math.round((p.balance/p.startAmt)*100);
  const fill=get('gauge-fill'), status=get('gauge-status'), pctEl=get('gauge-pct');
  const w=Math.min(pct,100), display=Math.max(w,2);
  fill.style.width=display+'%';
  if(pct>=80){fill.style.background='var(--green)';status.textContent='Healthy';status.style.color='var(--green)';}
  else if(pct>=50){fill.style.background='var(--amber)';status.textContent='Caution';status.style.color='var(--amber)';}
  else{fill.style.background='var(--red)';status.textContent='Danger zone';status.style.color='var(--red)';}
  pctEl.textContent=pct+'%';
}

// ─── PLAN LOGIC ────────────────────────────────────────────
function rndOdds(){return Math.round((1.3+Math.random()*.2)*100)/100;}
function getStakePct(afterLoss){
  const safe=get('safeMode').checked;
  if(safe&&afterLoss) return Math.round((.3+Math.random()*.2)*100)/100;
  return Math.round((.6+Math.random()*.35)*100)/100;
}
function buildPlan(start,n){
  let plan=[],bal=start;
  for(let i=0;i<n;i++){
    const odds=rndOdds(),pct=getStakePct(false),stake=Math.round(bal*pct),winAmt=Math.round(stake*odds);
    plan.push({day:i+1,stake,odds,actualOdds:odds,winAmt,balAfter:bal-stake+winAmt,status:'pending',note:'',sport:''});
    bal=bal-stake+winAmt;
  }
  return plan;
}

function recalcWin(){
  const p=P(),d=p.days[p.currentDay];if(!d)return;
  const odds=parseFloat(get('tc-odds-input').value)||d.odds;
  d.actualOdds=odds;d.winAmt=Math.round(d.stake*odds);d.balAfter=p.balance-d.stake+d.winAmt;
  get('tc-win').textContent=fmt(d.winAmt);get('tc-profit').textContent=fmt(d.winAmt-d.stake);
  renderTable();
}

function saveNote(){
  const p=P(),d=p.days[p.currentDay];if(!d)return;
  d.note=get('tc-note').value.trim();d.sport=get('tc-sport').value;
  saveState();renderTable();
  const el=get('note-saved');el.style.display='block';setTimeout(()=>{el.style.display='none';},1500);
}

function undoLast(){
  const p=P();if(p.currentDay===0)return;
  p.currentDay--;const d=p.days[p.currentDay];
  if(d.status==='win')p.balance=p.balance+d.stake-d.winAmt;
  d.status='pending';p.streak=p.streak>1?p.streak-1:0;if(p.streak===0)p.streakType=null;
  get('stoploss-alert').classList.remove('show');saveState();renderAll();
}

function markResult(result){
  const p=P();if(p.currentDay>=p.days.length)return;
  const d=p.days[p.currentDay];
  d.note=get('tc-note').value.trim();d.sport=get('tc-sport').value;
  d.actualOdds=parseFloat(get('tc-odds-input').value)||d.odds;
  d.winAmt=Math.round(d.stake*d.actualOdds);d.balAfter=p.balance-d.stake+d.winAmt;d.status=result;
  if(result==='win'){
    p.balance=p.balance-d.stake+d.winAmt;p.streak=p.streakType==='win'?p.streak+1:1;p.streakType='win';
    playWinSound();if(p.currentDay===p.days.length-1)setTimeout(launchConfetti,300);
  } else {
    p.streak=p.streakType==='loss'?p.streak+1:1;p.streakType='loss';playLossSound();
  }
  p.currentDay++;
  if(p.currentDay<p.days.length){
    const next=p.days[p.currentDay],pct=getStakePct(result==='loss');
    next.stake=Math.round(p.balance*pct);next.actualOdds=next.odds;
    next.winAmt=Math.round(next.stake*next.odds);next.balAfter=p.balance-next.stake+next.winAmt;
  }
  checkStopLoss();saveState();renderAll();
}

function checkStopLoss(){
  const pct=parseInt(get('stopLossPct').value)||0,p=P(),el=get('stoploss-alert');
  if(pct>0&&p.balance<p.startAmt*(pct/100))el.classList.add('show'); else el.classList.remove('show');
}

// ─── RENDER ────────────────────────────────────────────────
function renderCalendar(){
  const p=P(),wrap=get('cal-grid');wrap.innerHTML='';
  const days=p.days.length?p.days:Array.from({length:p.numDays},(_,i)=>({day:i+1,status:'upcoming',stake:0,winAmt:0}));
  days.forEach((d,i)=>{
    const cell=document.createElement('div');
    const isCur=i===p.currentDay&&d.status==='pending';
    cell.className='cal-cell '+(isCur?'today-cell':d.status==='pending'?'upcoming':d.status);
    const profit=d.status==='win'?'+'+fmt(d.winAmt-d.stake):d.status==='loss'?'-'+fmt(d.stake):'';
    cell.innerHTML=`<div class="cal-day">D${d.day}</div><div class="cal-amt">${profit||fmt(d.stake)}</div>`;
    wrap.appendChild(cell);
  });
}

function renderTable(){
  const p=P(),tbody=get('tbody');tbody.innerHTML='';
  p.days.forEach((d,i)=>{
    const isCur=i===p.currentDay&&d.status==='pending';
    const tr=document.createElement('tr');if(isCur)tr.className='current-row';
    const badge=d.status==='win'?'<span class="badge win">Won</span>':d.status==='loss'?'<span class="badge loss">Lost</span>':isCur?'<span class="badge today">Today</span>':'<span class="badge upcoming">Upcoming</span>';
    const noteHtml=d.note?`<span class="note-cell" title="${d.note}">${d.note}</span>`:'<span style="color:#2a2f42;">—</span>';
    const sportHtml=d.sport?`<span class="sport-tag">${d.sport.split(' ')[0]}</span>`:'<span style="color:#2a2f42;">—</span>';
    let profitHtml='<span style="color:#2a2f42;">—</span>';
    if(d.status==='win')profitHtml=`<span class="mono c-green">+${fmt(d.winAmt-d.stake)}</span>`;
    else if(d.status==='loss')profitHtml=`<span class="mono c-red">-${fmt(d.stake)}</span>`;
    tr.innerHTML=`<td style="font-weight:600;color:var(--text);">Day ${d.day}</td><td class="mono">${fmt(d.stake)}</td><td class="mono" style="color:var(--gold);">${d.actualOdds.toFixed(2)}</td><td class="mono">${fmt(d.winAmt)}</td><td class="mono c-green">${fmt(d.balAfter)}</td><td>${profitHtml}</td><td>${sportHtml}</td><td>${noteHtml}</td><td>${badge}</td>`;
    tbody.appendChild(tr);
  });
}

function renderMetrics(){
  const p=P();
  get('m-start').textContent=fmt(p.startAmt);get('m-balance').textContent=fmt(p.balance);
  const last=p.days[p.days.length-1];get('m-target').textContent=last?fmt(last.balAfter):'—';
  const profit=p.balance-p.startAmt;
  const pel=get('m-profit');pel.textContent=(profit>=0?'+':'')+fmt(profit);pel.className='m-val mono '+(profit>=0?'c-green':'c-red');
  get('m-day').textContent=Math.min(p.currentDay+1,p.numDays)+'/'+p.numDays;
  const sel=get('m-streak');
  if(!p.streak||!p.streakType){sel.textContent='—';sel.className='m-val c-blue';}
  else{sel.textContent=(p.streakType==='win'?'🔥 ':'❄️ ')+p.streak+(p.streakType==='win'?'W':'L');sel.className='m-val '+(p.streakType==='win'?'c-green':'c-red');}
}

function renderTodayCard(){
  const p=P(),d=p.days[p.currentDay];
  if(!d){get('today-card').innerHTML=`<div class="done-msg"><div class="done-amount">${fmt(p.balance)}</div><div class="done-sub">All days done! Check Summary or archive this plan.</div></div>`;return;}
  get('tc-day').textContent=d.day;get('tc-stake').textContent=fmt(d.stake);
  get('tc-odds-input').value=d.actualOdds.toFixed(2);get('tc-win').textContent=fmt(d.winAmt);get('tc-profit').textContent=fmt(d.winAmt-d.stake);
  get('tc-note').value=d.note||'';get('tc-sport').value=d.sport||'';
  const pct=Math.max(Math.round((d.day/p.numDays)*100),3);
  get('prog-fill').style.width=pct+'%';get('prog-label').textContent=`Day ${d.day} of ${p.numDays}`;get('prog-pct').textContent=pct+'%';
  const chip=get('streak-chip');
  if(p.streak>=2&&p.streakType){chip.style.display='inline-block';chip.className='streak-chip '+p.streakType;chip.textContent=p.streak+'-'+p.streakType+' streak';}
  else chip.style.display='none';
}

function renderChart(){
  const p=P(),labels=['Start'],data=[p.startAmt];let runBal=p.startAmt;
  p.days.forEach(d=>{
    labels.push('D'+d.day);
    if(d.status==='win'){runBal=runBal-d.stake+d.winAmt;data.push(runBal);}
    else if(d.status==='loss'){data.push(runBal);}
    else data.push(null);
  });
  const ptColors=data.map((_,i)=>{if(i===0)return'#c9a84c';const d=p.days[i-1];return d&&d.status==='loss'?'#ff5f5f':'#29d996';});
  const ctx=get('balChart').getContext('2d');
  if(chart)chart.destroy();
  chart=new Chart(ctx,{type:'line',data:{labels,datasets:[{data,borderColor:'#c9a84c',backgroundColor:'rgba(201,168,76,0.06)',borderWidth:2,pointBackgroundColor:ptColors,pointBorderColor:'transparent',pointRadius:5,fill:true,tension:.4,spanGaps:false}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{ticks:{callback:v=>'₦'+v.toLocaleString(),font:{size:11,family:'DM Mono'},color:'#4a5068'},grid:{color:'rgba(255,255,255,0.04)'},border:{color:'transparent'}},x:{ticks:{font:{size:11,family:'DM Mono'},color:'#4a5068'},grid:{display:false},border:{color:'transparent'}}}}});
}

// ─── SUMMARY ──────────────────────────────────────────────
function renderSummary(){
  const p=P();
  const done=p.days.filter(d=>d.status!=='pending');
  const wins=p.days.filter(d=>d.status==='win');
  const losses=p.days.filter(d=>d.status==='loss');
  const totalWagered=done.reduce((a,d)=>a+d.stake,0);
  const totalProfit=wins.reduce((a,d)=>a+(d.winAmt-d.stake),0)-losses.reduce((a,d)=>a+d.stake,0);
  const winRate=done.length?Math.round((wins.length/done.length)*100):0;
  const bestDay=wins.length?wins.reduce((a,b)=>(b.winAmt-b.stake)>(a.winAmt-a.stake)?b:a):null;
  get('report-grid').innerHTML=`
    <div class="report-card"><div class="r-lbl">Win rate</div><div class="r-val ${winRate>=50?'c-green':'c-red'}">${winRate}%</div><div class="r-sub">${wins.length}W / ${losses.length}L</div></div>
    <div class="report-card"><div class="r-lbl">Total wagered</div><div class="r-val">${fmt(totalWagered)}</div><div class="r-sub">${done.length} bets placed</div></div>
    <div class="report-card"><div class="r-lbl">Net profit</div><div class="r-val ${totalProfit>=0?'c-green':'c-red'}">${(totalProfit>=0?'+':'')+fmt(totalProfit)}</div><div class="r-sub">vs start ${fmt(p.startAmt)}</div></div>
    <div class="report-card"><div class="r-lbl">Best day</div><div class="r-val c-gold">${bestDay?'+'+fmt(bestDay.winAmt-bestDay.stake):'—'}</div><div class="r-sub">${bestDay?'Day '+bestDay.day+' · '+bestDay.actualOdds.toFixed(2)+'x':''}</div></div>`;
  let smartBal=p.startAmt,allinBal=p.startAmt;
  p.days.forEach(d=>{if(d.status==='win'){smartBal=smartBal-d.stake+d.winAmt;allinBal=allinBal*d.actualOdds;}else if(d.status==='loss'){allinBal=0;}});
  const maxB=Math.max(smartBal,allinBal,p.startAmt,1);
  get('comparison-bar').innerHTML=`
    <div class="comp-row"><span class="comp-label">Smart staking</span><div class="comp-track"><div class="comp-fill smart" style="width:${Math.round((smartBal/maxB)*100)}%"></div></div><span class="comp-amount">${fmt(smartBal)}</span></div>
    <div class="comp-row"><span class="comp-label">All-in every day</span><div class="comp-track"><div class="comp-fill allin" style="width:${Math.round((allinBal/maxB)*100)}%"></div></div><span class="comp-amount">${allinBal>0?fmt(allinBal):'₦0 (bust)'}</span></div>`;

  // Sport breakdown
  const sports={};
  done.forEach(d=>{
    const s=d.sport||'🎱 Other';
    if(!sports[s])sports[s]={wins:0,losses:0,profit:0};
    if(d.status==='win'){sports[s].wins++;sports[s].profit+=d.winAmt-d.stake;}
    else{sports[s].losses++;sports[s].profit-=d.stake;}
  });
  const sportKeys=Object.keys(sports);
  if(sportKeys.length){
    const cards=sportKeys.map(s=>{
      const data=sports[s],wr=Math.round((data.wins/(data.wins+data.losses))*100);
      const icon=SPORT_ICONS[s]||'🎱';
      return `<div class="sport-card"><div class="sport-icon">${icon}</div><div class="sport-name">${s.replace(/^[^ ]+ /,'')}</div><div class="sport-stat ${data.profit>=0?'c-green':'c-red'}">${data.profit>=0?'+':''}${fmt(data.profit)}</div><div style="font-size:10px;color:var(--text3);margin-top:2px;">${wr}% win rate</div></div>`;
    }).join('');
    get('sport-breakdown').innerHTML=`<div class="sport-grid">${cards}</div>`;
  } else get('sport-breakdown').innerHTML='<div style="font-size:13px;color:var(--text3);">Tag your bets with a sport to see the breakdown.</div>';

  // Odds history + suggestion
  if(done.length){
    const winOdds=wins.map(d=>d.actualOdds);
    const avgWinOdds=winOdds.length?winOdds.reduce((a,b)=>a+b,0)/winOdds.length:0;
    const suggestion=avgWinOdds>0?`Your sweet spot: around <strong style="color:var(--gold);">${avgWinOdds.toFixed(2)}x</strong> odds (your average winning odds).`:'Place more bets to get a suggestion.';
    const hist=done.map(d=>`<span class="oh-pill ${d.status}" title="${d.note||''}">${d.actualOdds.toFixed(2)}${d.sport?' '+d.sport.split(' ')[0]:''}</span>`).join('');
    get('odds-history-wrap').innerHTML=`<div style="font-size:12px;color:var(--text3);margin-bottom:8px;">${suggestion}</div><div class="odds-hist">${hist}</div>`;
  } else get('odds-history-wrap').innerHTML='<div style="font-size:13px;color:var(--text3);">No results yet.</div>';
}

function runSimulation(){
  const p=P();
  const done=p.days.filter(d=>d.status!=='pending');
  const winRate=done.length?done.filter(d=>d.status==='win').length/done.length:.6;
  const remaining=p.days.filter(d=>d.status==='pending');
  if(!remaining.length){get('sim-result').innerHTML='<span style="color:var(--text3);">All days completed.</span>';return;}
  let simBal=p.balance,details='';
  remaining.forEach(d=>{
    const win=Math.random()<winRate,stake=Math.round(simBal*.7);
    if(win){simBal=simBal-stake+Math.round(stake*d.actualOdds);details+=`<span class="oh-pill win">D${d.day} +${fmt(Math.round(stake*(d.actualOdds-1)))}</span>`;}
    else details+=`<span class="oh-pill loss">D${d.day} -${fmt(stake)}</span>`;
  });
  get('sim-result').innerHTML=`<div style="margin-bottom:8px;font-size:12px;color:var(--text3);">Based on ${Math.round(winRate*100)}% win rate:</div><div class="odds-hist">${details}</div><div style="margin-top:10px;font-size:14px;color:var(--text);">Projected balance: <strong style="color:var(--gold);font-family:'DM Mono',monospace;">${fmt(simBal)}</strong></div>`;
}

// ─── HISTORY ──────────────────────────────────────────────
function archiveCurrentPlan(){
  const p=P();
  if(!confirm(`Archive "${p.name}"? It will be saved to History and cleared from the tracker.`))return;
  const snap={...p,archivedAt:new Date().toLocaleDateString()};
  archive.push(snap);
  saveArchive();
  plans.splice(activePlan,1);
  if(!plans.length)plans=[{id:Date.now(),name:'Plan A',days:[],currentDay:0,balance:4000,startAmt:4000,numDays:7,streak:0,streakType:null}];
  activePlan=0; saveState(); renderAll(); renderHistory();
}

function renderHistory(){
  // All-time stats
  const allDays=archive.flatMap(a=>a.days.filter(d=>d.status!=='pending'));
  const allWins=allDays.filter(d=>d.status==='win');
  const allLosses=allDays.filter(d=>d.status==='loss');
  const allProfit=allWins.reduce((a,d)=>a+(d.winAmt-d.stake),0)-allLosses.reduce((a,d)=>a+d.stake,0);
  const allTime_wr=allDays.length?Math.round((allWins.length/allDays.length)*100):0;
  const biggestWin=allWins.length?Math.max(...allWins.map(d=>d.winAmt-d.stake)):0;
  const longestStreak=(()=>{let best=0,cur=0,type=null;[...archive.flatMap(a=>a.days)].forEach(d=>{if(d.status==='win'){cur=type==='win'?cur+1:1;type='win';}else if(d.status==='loss'){cur=type==='loss'?cur+1:1;type='loss';}best=Math.max(best,cur);});return best;})();
  get('alltime-stats').innerHTML=`
    <div class="report-card"><div class="r-lbl">All-time win rate</div><div class="r-val ${allTime_wr>=50?'c-green':'c-red'}">${allTime_wr}%</div><div class="r-sub">${allWins.length}W / ${allLosses.length}L</div></div>
    <div class="report-card"><div class="r-lbl">Total profit</div><div class="r-val ${allProfit>=0?'c-green':'c-red'}">${(allProfit>=0?'+':'')+fmt(allProfit)}</div><div class="r-sub">across ${archive.length} plans</div></div>
    <div class="report-card"><div class="r-lbl">Biggest win</div><div class="r-val c-gold">${biggestWin?'+'+fmt(biggestWin):'—'}</div><div class="r-sub">single day</div></div>
    <div class="report-card"><div class="r-lbl">Longest streak</div><div class="r-val c-blue">${longestStreak||'—'}</div><div class="r-sub">consecutive wins</div></div>`;

  if(!archive.length){get('archive-list').innerHTML='<div style="font-size:13px;color:var(--text3);padding:1rem 0;">No archived plans yet.</div>';return;}
  get('archive-list').innerHTML=archive.slice().reverse().map((a,ri)=>{
    const i=archive.length-1-ri;
    const ws=a.days.filter(d=>d.status==='win').length;
    const ls=a.days.filter(d=>d.status==='loss').length;
    const profit=a.balance-a.startAmt;
    const dots=a.days.map(d=>`<span class="history-day ${d.status==='pending'?'loss':d.status}">${d.status==='win'?'W':d.status==='loss'?'L':'—'}</span>`).join('');
    return `<div class="history-week">
      <div class="history-week-title">
        <span>${a.name} <span style="color:var(--text3);font-weight:400;">· Archived ${a.archivedAt}</span></span>
        <span style="font-family:'DM Mono',monospace;font-size:13px;color:${profit>=0?'var(--green)':'var(--red)'};">${profit>=0?'+':''}${fmt(profit)}</span>
      </div>
      <div style="font-size:12px;color:var(--text3);margin-bottom:8px;">${fmt(a.startAmt)} → ${fmt(a.balance)} &nbsp;·&nbsp; ${ws}W / ${ls}L &nbsp;·&nbsp; ${Math.round((ws/(ws+ls||1))*100)}% win rate</div>
      <div class="history-days">${dots}</div>
      <button class="btn btn-danger" style="margin-top:10px;font-size:11px;padding:5px 10px;" onclick="deleteArchive(${i})">Delete</button>
    </div>`;
  }).join('');
}

function deleteArchive(i){
  if(!confirm('Delete this archived plan?'))return;
  archive.splice(i,1); saveArchive(); renderHistory();
}

// ─── BRAG CARD ────────────────────────────────────────────
function showBragCard(){
  const p=P();
  const wins=p.days.filter(d=>d.status==='win').length;
  const losses=p.days.filter(d=>d.status==='loss').length;
  const profit=p.balance-p.startAmt;
  const wr=wins+losses?Math.round((wins/(wins+losses))*100):0;
  const dots=p.days.map(d=>`<div class="brag-dot ${d.status==='pending'?'pending':d.status}">${d.status==='win'?'W':d.status==='loss'?'L':'·'}</div>`).join('');
  get('brag-inner').innerHTML=`
    <div class="brag-title">Emmy Rollover</div>
    <div class="brag-sub">${p.name} · ${new Date().toLocaleDateString()}</div>
    <div class="brag-amount">${fmt(p.balance)}</div>
    <div style="font-size:13px;color:var(--text3);">${profit>=0?'+':''} ${fmt(profit)} profit</div>
    <div class="brag-row">
      <div class="brag-stat"><div class="brag-stat-val">${wins}W / ${losses}L</div><div class="brag-stat-lbl">Record</div></div>
      <div class="brag-stat"><div class="brag-stat-val">${wr}%</div><div class="brag-stat-lbl">Win rate</div></div>
      <div class="brag-stat"><div class="brag-stat-val">${fmt(p.startAmt)}</div><div class="brag-stat-lbl">Started with</div></div>
    </div>
    <div class="brag-days">${dots}</div>
    <div class="brag-footer">Built by paywithemmy · Rollover Tracker</div>`;
  get('brag-modal').style.display='flex';
}
function closeBrag(){get('brag-modal').style.display='none';}

// ─── REMINDER ─────────────────────────────────────────────
function setReminder(){
  const time=get('reminder-time').value;
  if(!('Notification' in window)){get('reminder-status').textContent='Browser notifications not supported.';return;}
  Notification.requestPermission().then(perm=>{
    if(perm==='granted'){
      settings.reminderTime=time; saveSettings();
      scheduleReminder(time);
      get('reminder-status').textContent=`✓ Reminder set for ${time} daily.`;
      get('reminder-status').style.color='var(--green)';
    } else {
      get('reminder-status').textContent='Permission denied. Enable notifications in browser settings.';
      get('reminder-status').style.color='var(--red)';
    }
  });
}
function clearReminder(){settings.reminderTime=null;saveSettings();get('reminder-status').textContent='Reminder cleared.';get('reminder-status').style.color='var(--text3)';}
function scheduleReminder(time){
  if(!time)return;
  const [h,m]=time.split(':').map(Number);
  const now=new Date(), target=new Date();
  target.setHours(h,m,0,0);
  if(target<=now)target.setDate(target.getDate()+1);
  const ms=target-now;
  setTimeout(()=>{
    if(Notification.permission==='granted') new Notification('Emmy Rollover Tracker',{body:"Time to place your bet! Good luck 🎯",icon:''});
    scheduleReminder(time);
  },ms);
}

// ─── CALCULATOR ───────────────────────────────────────────
function runCalc(){
  const start=parseInt(get('calc-start').value)||4000,target=parseInt(get('calc-target').value)||20000;
  const days=parseInt(get('calc-days').value)||7,odds=parseFloat(get('calc-odds').value)||1.35;
  const needed=Math.pow(target/start,1/days),stakePct=((needed-1)/(odds-1)*100);
  const el=get('calc-result'); el.style.display='block';
  if(stakePct>100||stakePct<=0){el.innerHTML=`<strong style="color:var(--red);">Not achievable</strong>Those odds can't reach that target in ${days} days. Try higher odds or more days.`;return;}
  let bal=start,breakdown='';
  for(let i=0;i<days;i++){const stake=Math.round(bal*(stakePct/100)),win=Math.round(stake*odds);breakdown+=`Day ${i+1}: stake ${fmt(stake)} → win ${fmt(win)}<br>`;bal=bal-stake+win;}
  el.innerHTML=`<strong>${fmt(Math.round(bal))}</strong>Stake <strong style="color:var(--gold);">${stakePct.toFixed(1)}%</strong> at <strong style="color:var(--gold);">${odds}x</strong> odds each day to reach ${fmt(target)} in ${days} days.<br><br><div style="font-size:12px;color:var(--text3);line-height:1.9;">${breakdown}</div>`;
}

// ─── PERSIST ──────────────────────────────────────────────
function saveSettings(){settings.quotes=get('quoteToggle').checked;try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));}catch(e){}}
function saveArchive(){try{localStorage.setItem(ARCHIVE_KEY,JSON.stringify(archive));}catch(e){}}
function saveState(){try{localStorage.setItem(SAVE_KEY,JSON.stringify({plans,activePlan,isDark}));}catch(e){}}

function loadAll(){
  try{const r=localStorage.getItem(SETTINGS_KEY);if(r){settings=JSON.parse(r);get('quoteToggle').checked=settings.quotes!==false;if(settings.reminderTime){get('reminder-time').value=settings.reminderTime;get('reminder-status').textContent=`✓ Reminder set for ${settings.reminderTime} daily.`;get('reminder-status').style.color='var(--green)';scheduleReminder(settings.reminderTime);}}}catch(e){}
  try{const r=localStorage.getItem(ARCHIVE_KEY);if(r)archive=JSON.parse(r);}catch(e){}
  try{
    const r=localStorage.getItem(SAVE_KEY);if(!r)return false;
    const s=JSON.parse(r);plans=s.plans;activePlan=s.activePlan||0;isDark=s.isDark!==false;
    document.body.classList.toggle('light',!isDark);get('theme-btn').textContent=isDark?'☀ Light':'☾ Dark';
    get('startStake').value=P().startAmt;get('numDays').value=P().numDays;
    return true;
  }catch(e){return false;}
}

function clearSave(){
  if(!confirm('Reset all saved progress and start fresh?'))return;
  try{localStorage.removeItem(SAVE_KEY);}catch(e){}
  plans=[{id:1,name:'Plan A',days:[],currentDay:0,balance:4000,startAmt:4000,numDays:7,streak:0,streakType:null}];
  activePlan=0;init();
}
function confirmInit(){
  const p=P();if(p.days.length>0&&p.currentDay>0){if(!confirm('Regenerate this plan? Progress will be lost.'))return;}
  init();
}
function init(){
  const p=P();p.startAmt=parseInt(get('startStake').value)||4000;p.numDays=parseInt(get('numDays').value)||7;
  p.balance=p.startAmt;p.currentDay=0;p.streak=0;p.streakType=null;p.days=buildPlan(p.startAmt,p.numDays);
  get('stoploss-alert').classList.remove('show');saveState();renderAll();
}

function exportCSV(){
  const p=P();
  const rows=[['Day','Stake','Odds','Win','Balance','Profit','Sport','Note','Result']];
  p.days.forEach(d=>{let pr='';if(d.status==='win')pr='+'+Math.round(d.winAmt-d.stake);else if(d.status==='loss')pr='-'+Math.round(d.stake);rows.push([d.day,Math.round(d.stake),d.actualOdds.toFixed(2),Math.round(d.winAmt),Math.round(d.balAfter),pr,d.sport||'',d.note||'',d.status]);});
  const csv=rows.map(r=>r.map(v=>`"${v}"`).join(',')).join('\n');
  const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);a.download='emmy-rollover.csv';a.click();
}

function renderAll(){renderPlanTabs();renderMetrics();renderTodayCard();renderCalendar();renderTable();renderChart();renderGauge();renderQuote();}

get('safeMode').addEventListener('change',function(){get('safeLabel').textContent=this.checked?'ON':'OFF';});

function closeModal(){get('gamble-modal').style.display='none';}
window.addEventListener('load',()=>{get('gamble-modal').style.display='flex';});

if(!loadAll()){init();}else{renderAll();}