(() => {
'use strict';
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
try { if (!sessionStorage.getItem('factio-visited') && !reduced) { $('#loader').classList.add('active'); sessionStorage.setItem('factio-visited', '1'); } } catch (_) {}
const menu = $('#menu'), toggle = $('#menu-toggle'), header = $('#header');
let previousFocus;
function setMenu(open) {
 if(open) previousFocus=document.activeElement;
 menu.hidden=!open; toggle.setAttribute('aria-expanded',String(open)); toggle.setAttribute('aria-label',open?'メニューを閉じる':'メニューを開く'); document.body.classList.toggle('menu-open',open); header.classList.toggle('is-dark',open);
 $('#main').inert=open; $('.footer-wrap').inert=open;
 if(open){header.classList.remove('nav-hidden');menu.querySelector('a').focus();} else {previousFocus?.focus(); updateNav();}
}
toggle.addEventListener('click',()=>setMenu(menu.hidden));
$$('#menu a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
document.addEventListener('keydown',e=>{
 if(menu.hidden)return;
 if(e.key==='Escape')setMenu(false);
 if(e.key==='Tab'){const nodes=[toggle,...$$('#menu a')],first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
});
let lastY=window.scrollY, navFrame=0;
function updateNav(){
 if(!menu.hidden){header.classList.remove('nav-hidden');return;}
 const y=window.scrollY;
 header.classList.toggle('nav-hidden',y>100 && y>lastY+1);
 const section=[...document.querySelectorAll('main>section,.footer')].find(el=>{const r=el.getBoundingClientRect();return r.top<=35 && r.bottom>35;});
 header.classList.toggle('is-dark',Boolean(section?.classList.contains('dark')));
 header.classList.toggle('over-hero',section?.id==='home');lastY=y;
}
window.addEventListener('scroll',()=>{if(navFrame)return;navFrame=requestAnimationFrame(()=>{updateNav();navFrame=0;});},{passive:true});
window.addEventListener('resize',updateNav); updateNav();
const library=window.FactioGarments;
if (!library) { $('#lab-workspace')?.setAttribute('hidden',''); return; }
// Catalog data is adapted in garments.js for the existing preview extensions.
const products=library.products;
let colors=products[0].colors;
const priceText=value=>value===null?'お問い合わせください':`¥${value.toLocaleString("ja-JP")}`;
const state={body:products[0].id,color:0,position:'chest',view:'front',scale:100,x:50,y:41,file:'',url:null};
let drag=null, hintShown=false, hintTimer, copyTimer;
const pointers=new Map(); let pinch=null;
const typeSelect=document.createElement('select');typeSelect.id='body-type';typeSelect.setAttribute('aria-label','ボディの種類');
[...new Set(products.map(p=>p.type))].forEach(type=>{const option=document.createElement('option');option.value=type;option.textContent=type;typeSelect.append(option);});
$('#body-controls').before(typeSelect);
function bodyChoices(){
 $('#body-controls').replaceChildren();
 products.filter(p=>p.type===typeSelect.value).forEach(p=>{const b=document.createElement('button');b.type='button';b.textContent=`${p.number} / ${p.name}`;b.dataset.body=p.id;b.setAttribute('aria-pressed',String(p.id===state.body));$('#body-controls').append(b);});
}
function colorChoices(){
 colors=products.find(p=>p.id===state.body).colors;$('#color-controls').replaceChildren();
 colors.forEach((c,i)=>{const b=document.createElement('button');b.type='button';b.dataset.color=i;b.style.setProperty('--swatch',c.hex);b.style.setProperty('--check',parseInt(c.hex.slice(1,3),16)<128?'#F4F4ED':'#111112');b.title=`${c.code} ${c.name}`;b.setAttribute('aria-label',b.title);b.setAttribute('aria-pressed',String(i===state.color));b.innerHTML='<span></span>';$('#color-controls').append(b);});
}
typeSelect.addEventListener('change',()=>{state.body=products.find(p=>p.type===typeSelect.value).id;state.color=0;bodyChoices();colorChoices();if(state.view==='sleeve')positionDefaults();render();});
bodyChoices();colorChoices();
function pressed(selector,key,value){$$(selector).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset[key]===String(value))));}
function positionDefaults(){const point=FactioSleeve.info(products.find(p=>p.id===state.body)).point;state.x=state.position==='sleeve'?point[0]:50;state.y=state.position==='sleeve'?point[1]:40;state.scale=100;$('#scale').value='100';}
function place(){const product=products.find(p=>p.id===state.body);const visible=state.position!=='back'||Boolean(product.back);$('#print-layer').hidden=!visible;const sleeve=state.position==='sleeve';$('#sleeve-range').hidden=!sleeve;const up=$('#upload-preview'), ink=!up.hidden?up:$('#sample-print img'), ratio=ink.naturalWidth?ink.naturalHeight/ink.naturalWidth:1;const width=sleeve?Math.min(FactioSleeve.info(product).point[2]*state.scale/100,FactioSleeve.info(product).point[2],FactioSleeve.info(product).point[2]/ratio):25*state.scale/100;$('#print-art').style.cssText=`left:${state.x}%;top:${state.y}%;width:${width}%`;if(sleeve)FactioSleeve.place(state.x,state.y,width,ratio);$('#scale-value').value=state.scale+'%';}
function render(){
 const c=colors[state.color],base=products.find(p=>p.id===state.body),p={...base,...base.variants?.[c.id]};
 if(state.view==='back'&&!p.back)state.view='front';
 $('#unit-price').textContent=`品番 ${p.number}`;
 const sleeve=state.view==='sleeve', info=FactioSleeve.info(base);const image=sleeve?info.image:state.view==='back'?p.back:p.image;$('#garment-stage').classList.toggle('is-sleeve',sleeve);$('#garment-stage').dataset.sleeveColor=FactioSleeve.tone(c);$('#garment-stage').dataset.sleeveMask=info.mask;$('#sleeve-caption').hidden=!sleeve;$('#sleeve-caption').textContent='左袖・最大 約8×8cm（目安）'+(info.approx?' ／ 袖の見え方の目安（'+info.key+'の写真）':'');
 $('#view-controls [data-view=back]').disabled=!p.back;
 $('#garment').replaceChildren();
 const photo=document.createElement('img');photo.src=image;photo.sizes='(min-width: 992px) 45vw, 90vw';photo.alt=p.name+(state.view==='back'?'の背面写真':'の正面写真');photo.width=900;photo.height=sleeve?763:975;photo.draggable=false;
 const tint=document.createElement('div');tint.className='garment-tint';tint.style.backgroundColor=c.hex;tint.style.maskImage=`url("${image}")`;tint.style.webkitMaskImage=`url("${image}")`;
 if(sleeve){photo.alt=p.name+'の袖の見え方';const overlay=document.createElement('div');overlay.className='sleeve-tint';overlay.style.backgroundColor=FactioSleeve.tone(c);overlay.style.maskImage=`url("${info.mask}")`;overlay.style.webkitMaskImage=overlay.style.maskImage;$('#garment').append(overlay);}$('#garment').prepend(photo);if(!p.variants)$('#garment').append(tint);
 $('#print-layer').style.clipPath='none';$('#print-layer').style.maskImage=`url("${image}")`;$('#print-layer').style.webkitMaskImage=`url("${image}")`;
 $('#sample-print').classList.toggle('light-print',!sleeve&&parseInt(c.hex.slice(1,3),16)<128);$('#color-name').textContent=c.name;
 $('#product-label').textContent=p.number+' / '+c.name;
 $('.preview-note').textContent=p.note+'。'+(!p.back?'背面の写真は準備中。背中のプリントは配置の目安です。':'画像はドラッグ・矢印キーで移動できます。');
 $('#garment-stage').classList.toggle('back-placeholder',state.position==='back'&&!p.back);
 pressed('[data-body]','body',state.body);pressed('[data-color]','color',state.color);pressed('[data-position]','position',state.position);pressed('#view-controls [data-view]','view',state.view);place();
}
$('#body-controls').addEventListener('click',e=>{const b=e.target.closest('[data-body]');if(b){state.body=b.dataset.body;state.color=0;colorChoices();if(state.view==='sleeve')positionDefaults();render();}});
$('#color-controls').addEventListener('click',e=>{const b=e.target.closest('[data-color]');if(b){state.color=Number(b.dataset.color);render();}});
$('#position-controls').addEventListener('click',e=>{const b=e.target.closest('[data-position]');if(b){state.position=b.dataset.position;state.view=state.position==='sleeve'?'sleeve':state.position==='back'?'back':'front';positionDefaults();render();}});
$('#view-controls').addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(b&&!b.disabled){state.view=b.dataset.view;state.position=state.view==='sleeve'?'sleeve':state.view==='back'?'back':'chest';positionDefaults();render();}});
[$('#upload-preview'),$('#sample-print img')].forEach(img=>img.addEventListener('load',place));
$('#scale').addEventListener('input',e=>{state.scale=Number(e.target.value);place();});
function move(dx,dy){const sleeve=state.position==='sleeve';const pt=FactioSleeve.info(products.find(p=>p.id===state.body)).point;state.x=Math.max(sleeve?pt[0]-2:15,Math.min(sleeve?pt[0]+2:85,state.x+dx));state.y=Math.max(sleeve?pt[1]-2:22,Math.min(sleeve?pt[1]+2:84,state.y+dy));place();}
$$('[data-move]').forEach(b=>b.addEventListener('click',()=>{const [x,y]={left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]}[b.dataset.move];move(x,y);}));
$('#print-art').addEventListener('keydown',e=>{const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(delta){e.preventDefault();move(...delta);}});
const stage=$('#garment-stage');
function distance(){const [a,b]=[...pointers.values()];return Math.hypot(a.x-b.x,a.y-b.y);}
stage.addEventListener('pointerdown',e=>{
 if(e.button!==0||(!e.target.closest('#print-art')&&e.pointerType!=='touch'))return;
 pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});stage.setPointerCapture(e.pointerId);
 if(pointers.size===2){pinch={distance:distance(),scale:state.scale};drag=null;}
 else drag={clientX:e.clientX,clientY:e.clientY,x:state.x,y:state.y};
});
stage.addEventListener('pointermove',e=>{
 if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pinch&&pointers.size===2){state.scale=Math.round(Math.max(40,Math.min(160,pinch.scale*distance()/Math.max(1,pinch.distance))));$('#scale').value=state.scale;place();return;}
 if(!drag)return;const rect=$('#print-layer').getBoundingClientRect();state.x=drag.x;state.y=drag.y;move((e.clientX-drag.clientX)/rect.width*100,(e.clientY-drag.clientY)/rect.height*100);
});
['pointerup','pointercancel','lostpointercapture'].forEach(name=>stage.addEventListener(name,e=>{pointers.delete(e.pointerId);pinch=null;drag=null;}));
function clearImage(){uploadVersion++;if(state.url)URL.revokeObjectURL(state.url);state.url=null;state.file='';$('#upload-preview').hidden=true;$('#upload-preview').removeAttribute('src');$('#sample-print').hidden=false;$('#upload').value='';$('#upload-status').textContent='';}
$('#reset-print').addEventListener('click',()=>{positionDefaults();clearImage();place();});
let uploadVersion=0;
$('#upload').addEventListener('change',async e=>{
 const file=e.target.files[0]; if(!file)return; const version=++uploadVersion;
 if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>10*1024*1024){$('#upload-status').textContent='10MB以下のPNG・JPG・WebPを選んでください。';e.target.value='';return;}
 const url=URL.createObjectURL(file),img=new Image();img.src=url;
 try{await img.decode();if(version!==uploadVersion){URL.revokeObjectURL(url);return;}if(img.width*img.height>40000000)throw Error('size');if(state.url)URL.revokeObjectURL(state.url);state.url=url;state.file=file.name;$('#upload-preview').src=url;$('#upload-preview').hidden=false;$('#sample-print').hidden=true;$('#upload-status').textContent=file.name+' を読み込みました';if(!hintShown){hintShown=true;$('#gesture-hint').hidden=false;hintTimer=setTimeout(()=>$('#gesture-hint').hidden=true,4000);}}
 catch(_){URL.revokeObjectURL(url);$('#upload-status').textContent='画像を読み込めません。別の画像を選んでください。';e.target.value='';}
});
const sizes=['S','M','L','XL','XXL'];function quantities(){return sizes.map(s=>({size:s,value:Number($(`[name="qty-${s}"]`).value)||0}));}
$$('.quantities input').forEach(i=>i.addEventListener('input',()=>{$('#total').value=quantities().reduce((n,q)=>n+q.value,0);if(Number($('#total').value)>0){$('#quantity-error').hidden=true;$('#quantity-field').removeAttribute('aria-invalid');}}));
const dialog=$('#summary-dialog');
$('#design-form').addEventListener('submit',e=>{e.preventDefault();const counts=quantities();if(!counts.some(q=>q.value>0)){$('#quantity-error').hidden=false;$('#quantity-field').setAttribute('aria-invalid','true');$('#quantity-field').scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});$('.qty-plus').focus({preventScroll:true});return;}const lines=['Factio ご相談内容','',`ボディ：${products.find(p=>p.id===state.body).name} / ${products.find(p=>p.id===state.body).number}`,`金額：お問い合わせください`,`プリント方法：${$('#print-method').value}`,`カラー：${colors[state.color].name}`,`プリント位置：${{chest:'胸',back:'背中',sleeve:'袖'}[state.position]}`,`デザイン：${state.file||'サンプル（Factio ロゴ）'}`,`大きさ：${state.scale}%`,`画像位置：横 ${state.x.toFixed(1)}% / 縦 ${state.y.toFixed(1)}%`,'',...counts.map(q=>`${q.size}：${q.value}枚`),`合計：${counts.reduce((n,q)=>n+q.value,0)}枚`,'',`チーム名：${$('#team').value.trim()||'未定'}`,`希望納期：${$('#deadline').value||'未定'}`,'','※プリント代は別途お見積り。','※写真は配置の目安です。実際のプリント範囲・色味はご相談のうえで確認します。','※仕上がり・納期・制作可否は要相談。','※画像データは含まれません。画像は別途ご用意ください。'];$('#summary-text').value=lines.join('\n');$('#copy-status').textContent='';clearTimeout(copyTimer);
 const details=$('#summary-details');details.replaceChildren();
 lines.filter(line=>line.includes('：')).forEach(line=>{const row=document.createElement('tr'),label=document.createElement('th'),value=document.createElement('td');const index=line.indexOf('：');label.scope='row';label.textContent=line.slice(0,index);value.textContent=line.slice(index+1);row.append(label,value);details.append(row);});
 const thumb=$('#summary-image');thumb.replaceChildren();thumb.hidden=!state.url;if(state.url){const image=document.createElement('img');image.src=state.url;image.alt='相談するプリント画像';thumb.append(image);}
 dialog.showModal();});
$('#close-summary').addEventListener('click',()=>dialog.close());
$('#copy-summary').addEventListener('click',async()=>{const t=$('#summary-text');try{await navigator.clipboard.writeText(t.value);$('#copy-status').textContent='コピーしました';clearTimeout(copyTimer);copyTimer=setTimeout(()=>$('#copy-status').textContent='',2000);}catch(_){t.select();$('#copy-status').textContent=document.execCommand('copy')?'コピーしました':'文章を選択しました。お使いの端末でコピーしてください。';}});
render();
if(typeof window.initFactioHero==='function')window.initFactioHero();
if(typeof window.initFactioMotion==='function')window.initFactioMotion();
})();
