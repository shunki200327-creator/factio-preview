(() => {
 'use strict';
 window.initFactioHero = () => {
  const hero=document.querySelector('.hero'),img=document.querySelector('#hero-blank'),canvas=document.querySelector('#hero-canvas'),button=document.querySelector('#print-toggle');
  const ctx=canvas.getContext('2d'),mask=document.createElement('canvas'),m=mask.getContext('2d');
  if(!ctx||!m)return;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)'),desktop=matchMedia('(min-width:992px)');
  let w=0,h=0,raf=0,visible=true,last=performance.now(),previous=null,points=[],all=false;
  const cover=()=>{const scale=Math.max(w/img.naturalWidth,h/img.naturalHeight),dw=img.naturalWidth*scale,dh=img.naturalHeight*scale;ctx.drawImage(img,(w-dw)/2,(h-dh)/2,dw,dh);};
  function draw(now){
   raf=0;if(hero.classList.contains('hero-gl-active')||!visible||document.hidden||reduced.matches||!img.naturalWidth||!w||!h)return;
   m.clearRect(0,0,w,h);
   points=points.filter(p=>now-p.t<2100);
   if(desktop.matches&&!all&&now-last>2500){const t=(now-last-2500)/1300;points.push({x:w*(.5+.3*Math.sin(t)),y:h*(.48+.22*Math.sin(t*2)),t:now});}
   const radius=Math.min(w*.16,150);
   for(const p of points){const alpha=Math.max(0,1-(now-p.t)/2100),g=m.createRadialGradient(p.x,p.y,radius*.25,p.x,p.y,radius);g.addColorStop(0,`rgba(255,255,255,${alpha})`);g.addColorStop(1,'rgba(255,255,255,0)');m.fillStyle=g;m.fillRect(p.x-radius,p.y-radius,radius*2,radius*2);}
   ctx.clearRect(0,0,w,h);ctx.globalCompositeOperation='source-over';cover();
   if(!all){ctx.globalCompositeOperation='destination-in';ctx.drawImage(mask,0,0);ctx.globalCompositeOperation='source-over';}
   if(desktop.matches||points.length)raf=requestAnimationFrame(draw);
  }
  function wake(){if(!hero.classList.contains('hero-gl-active')&&!raf&&!reduced.matches&&visible&&!document.hidden)raf=requestAnimationFrame(draw);}
  function resize(){w=Math.round(canvas.clientWidth);h=Math.round(canvas.clientHeight);canvas.width=mask.width=w;canvas.height=mask.height=h;points=[];wake();}
  function sync(){cancelAnimationFrame(raf);raf=0;hero.classList.toggle('reduced-color',reduced.matches);if(reduced.matches)ctx.clearRect(0,0,w,h);else wake();}
  function stamp(e){if(reduced.matches||hero.classList.contains('hero-gl-active'))return;const r=canvas.getBoundingClientRect(),p={x:e.clientX-r.left,y:e.clientY-r.top,t:performance.now()};if(p.x<0||p.y<0||p.x>w||p.y>h)return;last=p.t;
   if(previous){const n=Math.ceil(Math.hypot(p.x-previous.x,p.y-previous.y)/20);for(let i=1;i<n;i++)points.push({x:previous.x+(p.x-previous.x)*i/n,y:previous.y+(p.y-previous.y)*i/n,t:p.t});}
   points.push(p);previous=p;wake();
  }
  hero.addEventListener('factio-hero-renderer',sync);
  hero.addEventListener('touchmove',e=>{if(e.touches.length===1)stamp(e.touches[0]);},{passive:true});hero.addEventListener('touchend',()=>previous=null);hero.addEventListener('pointermove',e=>{if(e.pointerType!=='touch')stamp(e);});hero.addEventListener('pointerdown',stamp);hero.addEventListener('pointerleave',()=>previous=null);hero.addEventListener('pointerup',()=>previous=null);
  button.addEventListener('click',()=>{all=!all;button.setAttribute('aria-pressed',String(all));button.firstChild.textContent=all?'COLOR IS ON ':'TOUCH TO COLOR ';if(!reduced.matches){cancelAnimationFrame(raf);raf=0;draw(performance.now());wake();}});
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(e=>{visible=e[0].isIntersecting;sync();}).observe(hero);
  document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);desktop.addEventListener('change',sync);
  img.addEventListener('load',resize);if(img.complete)resize();sync();
 };
})();
