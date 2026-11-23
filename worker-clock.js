function clockAvatar(url,name,cls='clock-profile-photo'){
 const base=KBRCloud.config.url+'/storage/v1/object/public/kbr-employee-photos/';
 const trusted=typeof url==='string'&&url.startsWith(base)&&!/[<>"'\s]/.test(url);
 const initials=String(name||'?').trim().split(/\s+/).slice(0,2).map(part=>part[0]||'').join('').toUpperCase();
 return '<span class="'+cls+'">'+(trusted?'<img src="'+escapeHtml(url)+'" alt="Photo of '+escapeHtml(name)+'" loading="lazy" referrerpolicy="no-referrer">':'<span aria-hidden="true">'+escapeHtml(initials)+'</span>')+'</span>';
}
function mountWorkerLoginPin(form){
 const input=form.elements.pin;
 input.type='hidden';input.readOnly=true;input.inputMode='none';
 const display=form.querySelector('.worker-pin-screen');
 const pad=form.querySelector('.worker-pin-pad');
 const error=form.querySelector('[data-clock-error]');
 const action=form.querySelector('button[type=submit]');
 function show(){display.textContent='•'.repeat(input.value.length);}
 for(const key of ['1','2','3','4','5','6','7','8','9','⌫','0']){
  const button=document.createElement('button');
  button.type='button';button.textContent=key;
  button.setAttribute('aria-label',key==='⌫'?'Delete PIN digit':key);
  button.onclick=()=>{
   if(action.disabled)return;
   input.value=key==='⌫'?input.value.slice(0,-1):input.value.length<10?input.value+key:input.value;
   error.textContent='';display.classList.remove('invalid');show();
  };
  pad.append(button);
 }
 pad.append(action);
 form.addEventListener('submit',event=>{
  if(!/^\d{4,10}$/.test(input.value)){
   event.preventDefault();event.stopImmediatePropagation();
   error.textContent='Enter your Drink PIN to continue.';
   display.classList.add('invalid');
  }
 },true);
 new MutationObserver(()=>{display.classList.toggle('invalid',!!error.textContent);show();})
  .observe(error,{childList:true,characterData:true,subtree:true});
 show();
}
(()=>{'use strict';
const host=document.getElementById('workerClockView'),status=document.getElementById('clockStatus'),signOut=document.getElementById('signOutBarista');
let workers=[],records=[],selected='',profile=null,sessionPin='',busy=false,refreshing=false,signature='',started=false,attendanceReady=false,elapsedTicker=null;
// A selected username is not authentication. Worker login is held in memory only.
try{localStorage.removeItem('kbr_clock_profile_v1');}catch{}
const active=()=>profile?records.find(r=>r.barista_id===profile.id&&!r.clocked_out_at):null;
const latestClosed=()=>records.find(r=>r.barista_id===profile?.id&&r.clocked_out_at);
const formatTime=value=>new Date(value).toLocaleString('en-PH',{timeZone:'Asia/Manila'});
function timer(){const el=document.getElementById('workerElapsed');if(!el||!profile)return;
const record=active()||latestClosed();if(!record){el.textContent='Not clocked in';return;}
const start=Date.parse(record.clocked_in_at);
const end=record.clocked_out_at?Date.parse(record.clocked_out_at):Date.now();
if(!Number.isFinite(start)||!Number.isFinite(end)){el.textContent='Time unavailable';return;}
const seconds=Math.max(0,Math.floor((end-start)/1000));
el.textContent=[Math.floor(seconds/3600),Math.floor(seconds/60)%60,seconds%60].map(n=>String(n).padStart(2,'0')).join(':');
}
// Only animate locally while the logged-in worker is viewing an active shift.
// The server records timestamps on Clock In / Clock Out; ticking makes NO requests.
function syncElapsedTicker(){
const shouldRun=!!profile&&!!active()&&!document.hidden;
if(!shouldRun&&elapsedTicker!==null){clearInterval(elapsedTicker);elapsedTicker=null;}
if(shouldRun&&elapsedTicker===null){elapsedTicker=setInterval(timer,1000);}
timer();
}
function render(){signOut.hidden=!profile;signOut.disabled=busy;
if(!profile){renderLogin();return;}
const record=active(),closed=latestClosed();host.innerHTML=`<div class="clock-panes"><section class="barista-order-card clock-worker-profile">${clockAvatar(profile.photo_url,profile.name)}<h2>${escapeHtml(profile.name)}</h2><p>@${escapeHtml(profile.username)}</p><p>${escapeHtml(profile.position||'Barista')}</p><p class="worker-status">${record?'Clocked in':'Logged in · not clocked in'}</p><p>${record?'Your shift continues while you are signed out of this screen.':'Press Clock In when you are ready to start working.'}</p></section><section class="barista-order-card"><p>${record?'Current shift · started '+escapeHtml(formatTime(record.clocked_in_at)):closed?'Last shift · ended '+escapeHtml(formatTime(closed.clocked_out_at)):'Ready to start your shift'}</p><h1 id="workerElapsed"></h1><button type="button" id="attendanceAction" class="${record?'clock-red':'clock-green'}" ${busy||!attendanceReady?'disabled':''}>${attendanceReady?(record?'Clock Out':'Clock In'):'Loading attendance…'}</button><p class="clock-action-message" id="attendanceMessage" role="status"></p></section></div>`;
document.getElementById('attendanceAction').onclick=()=>changeAttendance(record?'out':'in');syncElapsedTicker();}
function clockGalleryName(name){
 return String(name||'').trim().toLowerCase()==='kurty'?'Kurt':name;
}
function orderedClockWorkers(){
 const order=['james','mark','jv','khenn','kurt','kurty'];
 const rank=w=>{const n=String(w.name||'').trim().toLowerCase();const i=order.indexOf(n);return i<0?order.length:i;};
 return [...workers].sort((a,b)=>rank(a)-rank(b)||String(a.name||'').localeCompare(String(b.name||'')));
}
function renderLogin(){
 const worker=workers.find(w=>w.username===selected);
 if(!worker){
  selected='';
  host.innerHTML='<section class="clock-worker-selection"><div class="clock-worker-gallery">'
   +orderedClockWorkers().map(w=>'<button type="button" class="clock-worker-card" data-worker-id="'+escapeHtml(w.id)+'" aria-label="Select '+escapeHtml(clockGalleryName(w.name))+', '+escapeHtml(w.position||'Barista')+'">'
     +clockAvatar(w.photo_url,clockGalleryName(w.name),'clock-profile-photo clock-gallery-avatar')
     +'<strong>'+escapeHtml(clockGalleryName(w.name))+'</strong>'
     +'<small class="clock-worker-position">'+escapeHtml(w.position||'Barista')+'</small>'
     +'</button>').join('')
   +'</div></section>';
  for(const button of host.querySelectorAll('[data-worker-id]')){
   button.onclick=()=>{
    if(busy)return;
    const found=workers.find(w=>w.id===button.dataset.workerId);
    if(!found)return;
    selected=found.username;status.textContent='';render();
   };
  }
  return;
 }
 host.innerHTML='<section class="clock-pin-stage"><button type="button" class="clock-choose-back" id="changeClockWorker">← Back to Baristas</button>'
  +'<div class="clock-pin-identity">'+clockAvatar(worker.photo_url,worker.name,'clock-profile-photo clock-pin-avatar')
  +'<div><h2>'+escapeHtml(clockGalleryName(worker.name))+'</h2><p>'+escapeHtml(worker.position||'Barista')+'</p></div></div>'
  +'<form id="workerClockForm" class="worker-pin-form">'
  +'<input type="hidden" name="username" value="'+escapeHtml(worker.username)+'">'
  +'<input name="pin" type="hidden" autocomplete="off" value="">'
  +'<output class="worker-pin-screen" aria-label="Drink PIN digits entered"></output>'
  +'<div class="worker-pin-pad"></div><p data-clock-error role="alert"></p>'
  +'<button type="submit" class="clock-pin-submit" '+(busy?'disabled':'')+'>✓</button></form></section>';
 document.getElementById('changeClockWorker').onclick=()=>{if(!busy){selected='';status.textContent='';render();}};
 const form=document.getElementById('workerClockForm');
 form.onsubmit=async event=>{
  event.preventDefault();if(busy)return;
  const username=form.elements.username.value,pin=form.elements.pin.value;
  if(!/^\d{4,10}$/.test(pin)){form.querySelector('[data-clock-error]').textContent='Enter your Drink PIN to continue.';return;}
  busy=true;form.querySelector('button[type=submit]').disabled=true;
  try{
   const result=await KBRCloud.rpc('kbr_login_worker',{p_username:username,p_pin:pin});
   form.elements.pin.value='';
   if(result.error)throw Error(result.error);
   if(!result.profile?.id||!result.profile?.username)throw Error('Worker login was not confirmed.');
   profile=result.profile;sessionPin=pin;selected='';records=[];signature='';attendanceReady=false;
   render();await refresh(true);
   status.textContent=active()?'Logged in. Your existing shift is still running.':'Logged in. Press Clock In to start your shift.';
  }catch(error){
   if(profile){status.textContent='Logged in, but attendance could not be loaded: '+error.message;}
   else{form.querySelector('[data-clock-error]').textContent=error.message;form.elements.pin.value='';form.querySelector('button[type=submit]').disabled=false;}
  }finally{busy=false;if(profile)render();}
 };
 mountWorkerLoginPin(form);
}
async function refresh(force=false){if(!profile||refreshing)return;refreshing=true;const workerId=profile.id;try{const rows=await KBRCloud.request('/rest/v1/kbr_worker_attendance?barista_id=eq.'+encodeURIComponent(workerId)+'&select=*&order=clocked_in_at.desc&limit=20');if(profile?.id!==workerId)return;const next=JSON.stringify(rows);records=rows;attendanceReady=true;if(force||signature!==next){signature=next;render();}timer();KBRCloud.status('Connected · attendance saved; refresh on sign-in and clock actions');}catch(error){KBRCloud.status('Attendance connection unavailable',true);throw error;}finally{refreshing=false;}}
async function changeAttendance(action){if(!profile||busy||!attendanceReady)return;busy=true;render();try{const result=await KBRCloud.rpc('kbr_clock_worker',{p_username:profile.username,p_pin:sessionPin,p_action:action});if(result.error)throw Error(result.error);await refresh(true);status.textContent=action==='in'?'Clocked in. Your time has started.':'Clocked out. Your earned time is shown.';}
catch(error){status.textContent='Attendance change was not confirmed: '+error.message+' Refresh and review your shift before retrying.';}
finally{busy=false;render();}}
function signOutWorker(){if(busy)return;profile=null;syncElapsedTicker();sessionPin='';selected='';records=[];signature='';attendanceReady=false;render();status.textContent='Signed out. Any active shift continues until you clock out.';}
signOut.onclick=signOutWorker;
async function start(){if(!KBRCloud.requireLogin())return;try{if(!['owner','operator'].includes(await KBRCloud.role()))throw Error('Staff login required.');workers=await KBRCloud.rpc('kbr_clock_roster',{});render();if(!started){started=true;
 document.addEventListener('visibilitychange',syncElapsedTicker);
 window.addEventListener('pageshow',syncElapsedTicker);
 window.addEventListener('pagehide',()=>{if(elapsedTicker!==null){clearInterval(elapsedTicker);elapsedTicker=null;}});
}}
catch(error){host.textContent='Unable to load worker login: '+error.message;const retry=document.createElement('button');retry.textContent='Retry';retry.onclick=start;host.append(retry);}}start();
})();
