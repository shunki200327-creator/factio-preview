(() => {
 'use strict';
 const legacyIds={'5001-01':'tee','5011-01':'long','5214-01':'hoodie'};
 const products=window.FactioCatalog.filter(p=>['5001-01','5011-01','5214-01'].includes(p.id)).map(p=>{
  const colors=p.colors.map(c=>({...c,id:c.code,english:c.name}));
  const variants=Object.fromEntries(colors.map(c=>[c.code,{image:c.front,back:c.back}]));
  return {...p,id:legacyIds[p.id]||p.id,number:p.id,colors,variants,...variants[colors[0].code],note:`United Athle ${p.id}の商品写真を使用`};
 });
 const unitPrice=()=>null; // 11/17 金額は載せず「お問い合わせください」（辻さん・くもんさん）
 window.FactioGarments={products,unitPrice};
})();
