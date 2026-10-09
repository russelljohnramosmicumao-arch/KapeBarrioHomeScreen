(()=>{'use strict';
window.KBRManagerTile={open(target){
if(!KBRCloud.requireLogin())return;
KBRSyncUI.screen('Manager PIN','Enter your owner PIN. Authorized managers use their own drink PIN.',[['Cancel',()=>KBRSyncUI.close()]]);
const form=document.createElement('form');
form.innerHTML='<label>PIN<input name="pin" type="password" inputmode="numeric" pattern="[0-9]{4,6}" minlength="4" maxlength="6" autocomplete="off" required></label><p data-error role="alert"></p><button type="submit">Open Manager</button>';
document.querySelector('#cloudScreen .cloud-box').append(form);
form.elements.pin.focus();let busy=false;
form.onsubmit=async event=>{event.preventDefault();if(busy)return;busy=true;const button=form.querySelector('button');button.disabled=true;const pin=form.elements.pin.value;form.elements.pin.value='';
try{const result=await KBRCloud.rpc('kbr_open_management',{p_pin:pin});if(result.error||!result.ok)throw Error(result.error||'Access was not approved.');location.assign(target);}
catch(error){form.querySelector('[data-error]').textContent=error.message;button.disabled=false;busy=false;form.elements.pin.focus();}
};
}};
})();
