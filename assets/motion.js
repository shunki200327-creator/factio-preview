(() => {
 'use strict';
 window.initFactioMotion = () => {
  const mq=matchMedia('(min-width:992px) and (prefers-reduced-motion:no-preference)');
  const targets=document.querySelectorAll('[data-oval],[data-reveal],[data-shift]');
  let observer;
  function sync(){
   observer?.disconnect();
   targets.forEach(el=>el.classList.remove('motion-ready','is-visible'));
   if(!mq.matches)return;
   observer=new IntersectionObserver(entries=>entries.forEach(({isIntersecting,target})=>{if(isIntersecting){target.classList.add('is-visible');observer.unobserve(target);}}),{threshold:.12});
   targets.forEach(el=>{el.classList.add('motion-ready');observer.observe(el);});
  }
  mq.addEventListener('change',sync);sync();
 };
})();
