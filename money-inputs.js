'use strict';
// Formato AR compartido. Los cálculos y registros siguen usando centavos enteros.
function moneyPartsAR(value){
 let raw=String(value??'').trim().replace(/^(?:ARS[ \u00a0]*|\$[ \u00a0]*)/i,'');
 if(/^\d{1,3}(?:[ \u00a0]\d{3})+(?:,\d{1,2})?$/.test(raw))raw=raw.replace(/[ \u00a0]/g,'');
 if(!raw)return null;
 let integer,decimal='',hasDecimal=false;
 if(/^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(raw)){const parts=raw.split(',');integer=parts[0].replace(/\./g,'');decimal=parts[1]||'';hasDecimal=parts.length>1;}
 else if(/^\d+(?:,\d{1,2})?$/.test(raw)){const parts=raw.split(',');integer=parts[0];decimal=parts[1]||'';hasDecimal=parts.length>1;}
 else if(/^\d+\.\d{1,2}$/.test(raw)){[integer,decimal]=raw.split('.');hasDecimal=true;}
 else return null;
 integer=integer.replace(/^0+(?=\d)/,'');return {integer,decimal,hasDecimal};
}
function parseMoneyCentsAR(value,{allowEmpty=false,maxCents=100000000000}={}){
 if(!String(value??'').trim()&&allowEmpty)return null;
 const parts=moneyPartsAR(value);if(!parts)throw Error('Ingresá un importe válido. Ej.: 10.000,50.');
 const cents=Number(parts.integer)*100+Number(parts.decimal.padEnd(2,'0'));
 if(!Number.isSafeInteger(cents)||cents<=0||cents>maxCents)throw Error('El importe debe ser mayor a cero y no superar '+new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS'}).format(maxCents/100)+'.');
 return cents;
}
function formatMoneyValueAR(value){const parts=moneyPartsAR(value);if(!parts)return String(value??'');return parts.integer.replace(/\B(?=(\d{3})+(?!\d))/g,'.')+(parts.hasDecimal?','+parts.decimal.padEnd(2,'0'):'');}
function moneyInputElement(node){return node?.matches?.('input[name="amount"],input[data-money]')?node:null;}
function formatMoneyEditing(input){
 const raw=input.value,caret=input.selectionStart??raw.length;
 if(!/^[\d.,]*$/.test(raw)||raw.split(',').length>2){input.setCustomValidity('Ingresá un importe válido. Ej.: 10.000,50.');return;}
 const [whole='',decimal]=raw.split(',');if(decimal!==undefined&&(!/^\d{0,2}$/.test(decimal))){input.setCustomValidity('Usá hasta dos decimales.');return;}
 const digits=whole.replace(/\./g,'').replace(/^0+(?=\d)/,'');const formatted=(digits?digits.replace(/\B(?=(\d{3})+(?!\d))/g,'.'):(decimal!==undefined?'0':''))+(decimal!==undefined?','+decimal:'');
 const logical=raw.slice(0,caret).replace(/\./g,'').length+(!digits&&decimal!==undefined&&caret>0?1:0);input.value=formatted;input.setCustomValidity('');let pos=0,count=0;while(pos<formatted.length&&count<logical){if(formatted[pos]!=='.')count++;pos++;}try{input.setSelectionRange(pos,pos);}catch{}
}
function prepareMoneyInputs(root){
 if(typeof document==='undefined'||!document?.createElement||!root?.querySelectorAll||!root.isConnected)return;
 const nodes=[...(moneyInputElement(root)?[root]:[]),...root.querySelectorAll('input[name="amount"],input[data-money]')];
 for(const input of nodes){input.type='text';input.inputMode='decimal';input.maxLength=24;input.autocomplete='off';input.dataset.money='ARS';input.placeholder='Ej.: 10.000,50';input.setAttribute('autocapitalize','none');input.setAttribute('spellcheck','false');input.setAttribute('aria-label',input.getAttribute('aria-label')||input.labels?.[0]?.textContent.trim()||'Importe en pesos argentinos');const formatted=formatMoneyValueAR(input.value);if(input.value!==formatted){input.value=formatted;input.defaultValue=formatted;}}
}
const moneyInputObserver=new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1)prepareMoneyInputs(node);});moneyInputObserver.observe(document.body,{childList:true,subtree:true});prepareMoneyInputs(document);
document.addEventListener('beforeinput',event=>{const input=moneyInputElement(event.target);if(!input||event.isComposing)return;
 if(event.inputType==='insertText'&&event.data==='.'){
  event.preventDefault();const from=input.selectionStart??input.value.length,to=input.selectionEnd??from;if(input.value.includes(',')&&!(from<=input.value.indexOf(',')&&to>input.value.indexOf(',')))return;input.setRangeText(',',from,to,'end');formatMoneyEditing(input);return;
 }
 if(event.inputType==='insertText'&&event.data&&!/^[\d,]+$/.test(event.data)){event.preventDefault();return;}
 if(event.inputType==='insertText'&&event.data){const from=input.selectionStart??input.value.length,to=input.selectionEnd??from;const proposed=input.value.slice(0,from)+event.data+input.value.slice(to);if(proposed.split(',').length>2||(proposed.includes(',')&&proposed.split(',')[1].length>2)){event.preventDefault();return;}}
 if(event.inputType==='deleteContentForward'&&input.selectionStart===input.selectionEnd&&input.value[input.selectionStart]==='.'){event.preventDefault();input.setRangeText('',input.selectionStart,input.selectionStart+2,'end');formatMoneyEditing(input);return;}
 if(event.inputType==='deleteContentBackward'&&input.selectionStart===input.selectionEnd&&input.selectionStart>0&&input.value[input.selectionStart-1]==='.'){
  event.preventDefault();const from=Math.max(0,input.selectionStart-2);input.setRangeText('',from,input.selectionStart,'end');formatMoneyEditing(input);
 }
});
document.addEventListener('input',event=>{const input=moneyInputElement(event.target);if(input&&!event.isComposing)formatMoneyEditing(input);});
document.addEventListener('paste',event=>{const input=moneyInputElement(event.target);if(!input)return;const raw=event.clipboardData?.getData('text');if(raw===undefined)return;event.preventDefault();if(!moneyPartsAR(raw)){input.setCustomValidity('Revisá el importe pegado. Ej.: 10.000,50.');input.reportValidity();return;}input.value=formatMoneyValueAR(raw);input.setCustomValidity('');input.setSelectionRange(input.value.length,input.value.length);});
document.addEventListener('blur',event=>{const input=moneyInputElement(event.target);if(!input||!input.value)return;if(moneyPartsAR(input.value)){input.value=formatMoneyValueAR(input.value);input.setCustomValidity('');}else if(/^\d{1,3}(?:\.\d{3})*,$/.test(input.value)){input.value=input.value+'00';input.setCustomValidity('');}else input.setCustomValidity('Ingresá un importe válido. Ej.: 10.000,50.');},true);
document.addEventListener('change',()=>queueMicrotask(()=>{if(typeof document!=='undefined')prepareMoneyInputs(document);}));
