(() => {
 'use strict';
 const settings={ '5001':[59,46,25], '5942':[59,51,25], '1108':[65,48,25], '1100':[60,49,23], '5011':[44,36,22], '5099':[58,48,25] };
 const exact={'5001-01':'5001','5942-01':'5942','1108-01':'1108','1100-01':'1100','5011-01':'5011','5099-01':'5099'};
 const pick=p=>exact[p.number]||(/ポロ/.test(p.type)?'1100':/長袖|スウェット|パーカー/.test(p.type)?'5011':'5001');
 window.FactioSleeve={
  info(p){const key=pick(p);return {key,image:`assets/photo/sleeve/${key}.webp`,mask:`assets/photo/sleeve/${key}-mask.webp`,point:settings[key],approx:!exact[p.number]};},
  tone(c){if(/ホワイト|白/.test(c.name))return '#ffffff';return '#'+c.hex.slice(1).match(/../g).map(v=>Math.round(255*Math.pow(parseInt(v,16)/255,.68)).toString(16).padStart(2,'0')).join('');},
  place(x,y,width,ratio){
   const art=document.getElementById('print-art'),layer=document.getElementById('print-layer');
   const guide=document.getElementById('sleeve-range');layer.append(guide);guide.hidden=false;const body=window.FactioGarments.products.find(p=>p.id===document.querySelector('[data-body][aria-pressed=true]')?.dataset.body),pt=this.info(body).point;const gw=pt[2]/100*layer.clientWidth,gh=gw;guide.style.cssText=`left:0;top:0;width:${gw}px;height:${gh}px;transform-origin:0 0;transform:${SleeveProject.css(SleeveProject.quad(pt[0]/100*layer.clientWidth,pt[1]/100*layer.clientHeight,gw,gh),gw,gh)}`;
   const w=width/100*layer.clientWidth,h=w*ratio,q=SleeveProject.quad(x/100*layer.clientWidth,y/100*layer.clientHeight,w,h);
   art.style.cssText=`left:0;top:0;width:${w}px;height:${h}px;transform-origin:0 0;transform:${SleeveProject.css(q,w,h)}`;
  },
  async paint(ctx,img,color,mask){
   ctx.drawImage(img,0,0);if(color==='#ffffff')return;
   const tint=document.createElement('canvas');tint.width=img.naturalWidth;tint.height=img.naturalHeight;
   const tc=tint.getContext('2d');tc.fillStyle=color;tc.fillRect(0,0,tint.width,tint.height);tc.globalCompositeOperation='destination-in';
   const m=new Image();m.src=mask;await m.decode();tc.drawImage(m,0,0);
   ctx.save();ctx.globalCompositeOperation='multiply';ctx.drawImage(tint,0,0);ctx.restore();
  }
 };
 new ResizeObserver(()=>{if(!document.getElementById('garment-stage').classList.contains('is-sleeve'))return;document.getElementById('scale').dispatchEvent(new Event('input'));}).observe(document.getElementById('garment-stage'));
})();
