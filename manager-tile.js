function mountManagerPinKeypad(form){
 const input=form.elements.pin;input.readOnly=true;input.inputMode='none';input.setAttribute('aria-label','Manager PIN entered using keypad');
 const layout=document.createElement('div');layout.className='manager-pin-layout';
 const left=document.createElement('div');left.className='manager-pin-fields';
 while(form.firstChild)left.append(form.firstChild);layout.append(left);
 const right=document.createElement('div');right.className='manager-pin-pad';right.setAttribute('aria-label','PIN keypad');
 for(const key of ['1','2','3','4','5','6','7','8','9','Clear','0','⌫']){
  const button=document.createElement('button');button.type='button';button.textContent=key;button.setAttribute('aria-label',key==='⌫'?'Delete last PIN digit':key==='Clear'?'Clear PIN':key);
  button.onclick=()=>{if(form.querySelector('button[type="submit"]').disabled)return;input.value=key==='Clear'?'':key==='⌫'?input.value.slice(0,-1):input.value.length<6?input.value+key:input.value;form.querySelector('[data-error]').textContent='';};right.append(button);
 }
 layout.append(right);form.append(layout);
 if(!document.getElementById('managerPinKeypadStyle')){const style=document.createElement('style');style.id='managerPinKeypadStyle';style.textContent='.manager-pin-layout{display:grid;grid-template-columns:minmax(0,1fr) 156px;gap:18px;align-items:start}.manager-pin-fields{min-width:0}.manager-pin-fields input{width:100%;min-width:0}.manager-pin-pad{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:12px}.manager-pin-pad button{min-height:44px;min-width:0;padding:5px;border:1px solid #80644b;border-radius:9px;background:#6b4328;color:#fff;font:700 17px system-ui;cursor:pointer}.manager-pin-pad button:nth-child(10){font-size:11px}.manager-pin-pad button:focus-visible{outline:3px solid #d9a441;outline-offset:2px}@media(max-width:420px){.manager-pin-layout{grid-template-columns:minmax(0,1fr) 138px;gap:10px}}';document.head.append(style);}
 form.addEventListener('submit',event=>{if(!/^\d{4,6}$/.test(input.value)){event.preventDefault();event.stopImmediatePropagation();form.querySelector('[data-error]').textContent='Enter your 4–6 digit PIN using the keypad.';}},true);
}
(()=>{'use strict';
window.KBRManagerTile={open(target){
if(!KBRCloud.requireLogin())return;
KBRSyncUI.screen('Manager PIN','Enter your owner PIN. Authorized managers use their own drink PIN.',[['Cancel',()=>KBRSyncUI.close()]]);
const form=document.createElement('form');
form.innerHTML='<label>PIN<input name="pin" type="password" inputmode="numeric" pattern="[0-9]{4,6}" minlength="4" maxlength="6" autocomplete="off" required></label><p data-error role="alert"></p><button type="submit">Open Manager</button>';
document.querySelector('#cloudScreen .cloud-box').append(form);mountManagerPinKeypad(form);
let busy=false;
form.onsubmit=async event=>{event.preventDefault();if(busy)return;busy=true;const button=form.querySelector('button[type="submit"]');button.disabled=true;const pin=form.elements.pin.value;form.elements.pin.value='';
try{const result=await KBRCloud.rpc('kbr_open_management',{p_pin:pin});if(result.error||!result.ok)throw Error(result.error||'Access was not approved.');location.assign(target);}
catch(error){form.querySelector('[data-error]').textContent=error.message;button.disabled=false;busy=false;}
};
}};
})();
