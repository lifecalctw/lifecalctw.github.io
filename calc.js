/* 生活計算所 — 共用計算邏輯（多頁版，無路由） */
function pick(btn,group){document.querySelectorAll('#'+group+' button').forEach(b=>b.classList.remove('on'));btn.classList.add('on');}
function getSeg(group){const b=document.querySelector('#'+group+' button.on');return b?b.dataset.v:null;}
const nf=(n,d=0)=>(isFinite(n)?n:0).toLocaleString('zh-TW',{minimumFractionDigits:d,maximumFractionDigits:d});
const $=id=>document.getElementById(id);

/* 房貸 */
function calcM(){
  const P=(+$('m_amt').value||0)*10000, annual=+$('m_rate').value||0;
  const years=Math.floor(+$('m_yr').value||0); let grace=Math.floor(Math.max(0,+$('m_grace').value||0));
  const out=$('m_out'); if(P<=0||years<=0){out.innerHTML='';return;}
  if(grace>=years){out.innerHTML='<div class="note" style="border-left-color:var(--neg)">寬限期必須小於貸款年數，請調整。</div>';return;}
  const r=annual/100/12, n=years*12, gN=grace*12, payN=n-gN;
  let pay=(r===0)?P/payN:P*r*Math.pow(1+r,payN)/(Math.pow(1+r,payN)-1);
  const graceMonthly=P*r; let bal=P, totalInt=0, rows=[];
  for(let i=1;i<=n;i++){let interest,thisPay,principal;
    if(i<=gN){interest=bal*r;principal=0;thisPay=interest;}else{interest=bal*r;principal=pay-interest;thisPay=pay;bal-=principal;}
    totalInt+=interest;if(bal<0.005)bal=0;rows.push([i,thisPay,bal]);}
  const totalPay=P+totalInt; let yr='';
  for(let y=1;y<=years;y++){const m=rows[Math.min(y*12,rows.length)-1];yr+=`<tr><td>${y}</td><td class="num">${nf(m[1])}</td><td class="num">${nf(m[2])}</td></tr>`;}
  out.innerHTML=`<div class="result"><div class="cap">每月應繳${grace>0?'（寬限期後）':''}</div>
    <div class="big num">$${nf(pay)}<small>元 / 月</small></div>
    ${grace>0?`<div class="hint">寬限期內每月只繳利息約 $${nf(graceMonthly)} 元</div>`:''}
    <div class="stats"><div class="stat"><div class="k">總利息支出</div><div class="v num">$${nf(totalInt)}</div></div>
    <div class="stat"><div class="k">本利合計</div><div class="v num">$${nf(totalPay)}</div></div>
    <div class="stat"><div class="k">還款期數</div><div class="v num">${n} 期</div></div></div></div>
    <div class="panel"><h4>每年攤還摘要</h4><div class="tablewrap"><table><tr><th>年</th><th>該月月付（元）</th><th>年底剩餘本金（元）</th></tr>${yr}</table></div>
    <div class="hint">表格為每年第 12 個月的數字。</div></div>`;
}

/* 電費（台電 114/10/1） */
const ERATES={summer:[[120,1.78],[330,2.55],[500,3.80],[700,5.14],[1000,6.44],[Infinity,8.86]],
  winter:[[120,1.78],[330,2.26],[500,3.13],[700,4.24],[1000,5.27],[Infinity,7.03]]};
function calcE(){
  const kwh=Math.max(0,+$('e_kwh').value||0), months=+getSeg('e_period')||1; let season=getSeg('e_season');
  if(season==='auto'){const mo=new Date().getMonth()+1;season=(mo>=6&&mo<=9)?'summer':'winter';}
  const out=$('e_out'); if(kwh<=0){out.innerHTML='';return;}
  const tiers=ERATES[season]; let prev=0,total=0,rows='',top=0;
  for(let i=0;i<tiers.length;i++){const cap=tiers[i][0]===Infinity?Infinity:tiers[i][0]*months, rate=tiers[i][1];
    const portion=Math.min(kwh,cap)-prev;
    if(portion>0.0001){const amt=portion*rate;total+=amt;top=rate;
      const lbl=(i===0)?`${cap} 度以下`:(cap===Infinity?`${prev+1} 度以上`:`${prev+1}–${cap} 度`);
      rows+=`<tr><td style="text-align:left">${lbl}</td><td class="num">${nf(portion,1)}</td><td class="num">${rate.toFixed(2)}</td><td class="num">${nf(amt)}</td></tr>`;}
    prev=cap;if(kwh<=cap)break;}
  const avg=total/kwh;
  out.innerHTML=`<div class="result"><div class="cap">應繳電費 · ${season==='summer'?'夏月':'非夏月'} · ${months===2?'雙月':'單月'}</div>
    <div class="big num">$${nf(total)}<small>元</small></div>
    <div class="stats"><div class="stat"><div class="k">用電度數</div><div class="v num">${nf(kwh,1)} 度</div></div>
    <div class="stat"><div class="k">平均每度</div><div class="v num">$${nf(avg,2)}</div></div>
    <div class="stat"><div class="k">最高一度單價</div><div class="v num">$${nf(top,2)}</div></div></div></div>
    <div class="panel"><h4>級距明細（看清每段怎麼算）</h4><div class="tablewrap"><table><tr><th style="text-align:left">級距</th><th>度數</th><th>單價</th><th>金額</th></tr>${rows}</table></div></div>`;
}
function calcEst(){
  const w=Math.max(0,+$('e_w').value||0), hr=Math.max(0,+$('e_hr').value||0), days=Math.max(0,+$('e_days').value||0);
  const out=$('est_out'), kwh=w/1000*hr*days; if(kwh<=0){out.innerHTML='';return;}
  out.innerHTML=`<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;background:var(--soft);border:1px solid #dde7e0;border-radius:7px;padding:14px 16px;margin-top:4px">
    <div>估算用電 <b class="num" style="font-family:var(--serif);font-size:22px;color:var(--accent)">${nf(kwh,1)}</b> 度</div>
    <button class="applybtn" onclick="useEst(${kwh.toFixed(2)})">↑ 套用到上方度數</button></div>`;
}
function useEst(v){$('e_kwh').value=(+v).toFixed(1);calcE();window.scrollTo({top:0});}

/* 股票 */
function calcStk(){
  const buy=+$('s_buy').value||0, sell=+$('s_sell').value||0, qty=+$('s_qty').value||0, disc=+$('s_disc').value||1;
  const day=getSeg('s_type')==='day', out=$('s_out'); if(buy<=0||qty<=0){out.innerHTML='';return;}
  const feeRate=0.001425*disc, taxRate=day?0.0015:0.003, buyAmt=buy*qty, sellAmt=sell*qty;
  const buyFee=Math.max(20,Math.floor(buyAmt*feeRate)), sellFee=sell>0?Math.max(20,Math.floor(sellAmt*feeRate)):0;
  const tax=sell>0?Math.round(sellAmt*taxRate):0, cost=buyFee+sellFee+tax, pl=sellAmt-buyAmt-cost, ret=buyAmt>0?pl/buyAmt*100:0;
  const be=qty>0?(buyAmt+buyFee)/(qty*(1-feeRate-taxRate)):0, col=pl>=0?'var(--pos)':'var(--neg)';
  out.innerHTML=`<div class="result" style="border-top-color:${col}"><div class="cap">淨損益（已扣交易成本）</div>
    <div class="big num" style="color:${col}">${pl>=0?'+':''}$${nf(pl)}<small>${ret>=0?'+':''}${nf(ret,2)}%</small></div>
    <div class="stats"><div class="stat"><div class="k">交易成本合計</div><div class="v num">$${nf(cost)}</div></div>
    <div class="stat"><div class="k">損益兩平賣價</div><div class="v num">$${nf(be,2)}</div></div></div></div>
    <div class="panel"><h4>成本明細</h4><div class="stats">
    <div class="stat"><div class="k">買進金額</div><div class="v num">$${nf(buyAmt)}</div></div>
    <div class="stat"><div class="k">賣出金額</div><div class="v num">$${nf(sellAmt)}</div></div>
    <div class="stat"><div class="k">買進手續費</div><div class="v num">$${nf(buyFee)}</div></div>
    <div class="stat"><div class="k">賣出手續費</div><div class="v num">$${nf(sellFee)}</div></div>
    <div class="stat"><div class="k">證交稅</div><div class="v num">$${nf(tax)}</div></div></div></div>`;
}

/* 薪資 */
function calcSal(){
  const base=getSeg('sal_base'), v=+$('sal_val').value||0, hpd=+$('sal_hpd').value||8, dpw=+$('sal_dpw').value||5;
  const out=$('sal_out'); if(v<=0){out.innerHTML='';return;}
  const daysPerMonth=dpw*52/12, hoursPerMonth=hpd*daysPerMonth; let monthly;
  if(base==='month')monthly=v;else if(base==='year')monthly=v/12;else if(base==='day')monthly=v*daysPerMonth;else monthly=v*hoursPerMonth;
  const hourly=monthly/hoursPerMonth, daily=monthly/daysPerMonth, weekly=daily*dpw, yearly=monthly*12;
  out.innerHTML=`<div class="result"><div class="cap">換算結果 · 每日 ${hpd} 小時、每週 ${dpw} 天</div>
    <div class="big num">$${nf(monthly)}<small>元 / 月</small></div>
    <div class="stats"><div class="stat"><div class="k">時薪</div><div class="v num">$${nf(hourly,1)}</div></div>
    <div class="stat"><div class="k">日薪</div><div class="v num">$${nf(daily)}</div></div>
    <div class="stat"><div class="k">週薪</div><div class="v num">$${nf(weekly)}</div></div>
    <div class="stat"><div class="k">年薪</div><div class="v num">$${nf(yearly)}</div></div></div></div>`;
}

/* 加班費 */
function calcOT(){
  const base=getSeg('ot_base'), v=+$('ot_val').value||0, hr=Math.max(0,+$('ot_hr').value||0), type=getSeg('ot_type');
  $('ot_lbl').textContent=(base==='month')?'月薪（元）':'時薪（元）';
  const out=$('ot_out'); if(v<=0){out.innerHTML='';return;}
  const hourly=(base==='month')?v/240:v, clamp=(x,lo,hi)=>Math.max(0,Math.min(x,hi)-lo); let rows=[];
  if(type==='weekday'){const a=Math.min(hr,2),b=Math.max(0,hr-2);rows.push(['前 2 小時 ×1⅓',a,a*hourly*4/3]);if(b>0)rows.push(['第 3 小時起 ×1⅔',b,b*hourly*5/3]);}
  else if(type==='rest'){const a=Math.min(hr,2),b=clamp(hr,2,8),c=clamp(hr,8,12);rows.push(['前 2 小時 ×1⅓',a,a*hourly*4/3]);if(b>0)rows.push(['第 3–8 小時 ×1⅔',b,b*hourly*5/3]);if(c>0)rows.push(['第 9–12 小時 ×2⅔',c,c*hourly*8/3]);}
  else{const within=Math.min(hr,8),over=Math.max(0,hr-8);rows.push(['8 小時內加發 ×1',within,within*hourly]);const a=Math.min(over,2),b=Math.max(0,over-2);if(a>0)rows.push(['超過 8h 前 2 小時 ×1⅓',a,a*hourly*4/3]);if(b>0)rows.push(['超過 10h 起 ×1⅔',b,b*hourly*5/3]);}
  const pay=rows.reduce((s,r)=>s+r[2],0);
  let tr=rows.map(r=>`<tr><td style="text-align:left">${r[0]}</td><td class="num">${nf(r[1],1)}</td><td class="num">$${nf(r[2])}</td></tr>`).join('');
  out.innerHTML=`<div class="result"><div class="cap">加班費加給 · 時薪 $${nf(hourly,1)}</div>
    <div class="big num">$${nf(pay)}</div><div class="stats"><div class="stat"><div class="k">加班時數</div><div class="v num">${nf(hr,1)} 小時</div></div></div></div>
    <div class="panel"><h4>計算明細</h4><div class="tablewrap"><table><tr><th style="text-align:left">區段</th><th>時數</th><th>加給金額</th></tr>${tr}</table></div></div>`;
}

/* 健康 */
function calcH(){
  const sex=getSeg('h_sex'), h=+$('h_h').value||0, w=+$('h_w').value||0, age=+$('h_age').value||0, act=+$('h_act').value||1.2;
  const out=$('h_out'); if(h<=0||w<=0){out.innerHTML='';return;}
  const m=h/100, bmi=w/(m*m); let cat,cls,color;
  if(bmi<18.5){cat='體重過輕';cls='b-warn';color='#b08018';}else if(bmi<24){cat='健康範圍';cls='b-good';color='#2d6553';}
  else if(bmi<27){cat='體重過重';cls='b-warn';color='#b08018';}else{cat='肥胖';cls='b-bad';color='#a23a2c';}
  const pct=Math.max(2,Math.min(100,(bmi-15)/20*100)), lo=18.5*m*m, hi=24*m*m; let diff;
  if(w<lo)diff=`距離健康範圍還需增加 ${nf(lo-w,1)} 公斤`;else if(w>hi)diff=`要回到健康範圍需減少 ${nf(w-hi,1)} 公斤`;else diff='你的體重在健康範圍內，繼續保持！';
  const bmr=(sex==='male')?(10*w+6.25*h-5*age+5):(10*w+6.25*h-5*age-161), tdee=bmr*act;
  out.innerHTML=`<div class="result"><div class="cap">你的 BMI · 僅依身高、體重</div>
    <div class="big num">${nf(bmi,1)} <span class="badge ${cls}">${cat}</span></div>
    <div class="meter"><i style="width:${pct}%;background:${color}"></i></div><div class="hint">${diff}</div>
    <div class="stats"><div class="stat"><div class="k">健康體重範圍</div><div class="v num">${nf(lo,1)}–${nf(hi,1)} kg</div></div></div></div>
    <div class="result alt"><div class="cap">每日建議熱量 TDEE · 依年齡 ${age}、活動量計算</div>
    <div class="big num" style="color:var(--accent2)">${nf(tdee)} <small>kcal / 天</small></div>
    <div class="stats"><div class="stat"><div class="k">基礎代謝 BMR</div><div class="v num">${nf(bmr)}</div></div>
    <div class="stat"><div class="k">溫和減重 -0.5kg/週</div><div class="v num">${nf(tdee-500)}</div></div>
    <div class="stat"><div class="k">增重 / 增肌</div><div class="v num">${nf(tdee+300)}</div></div></div></div>`;
}

/* 單位 */
const UNITS={length:{u:{'公分':0.01,'公尺':1,'公里':1000,'英吋':0.0254,'英尺':0.3048,'英里':1609.344,'台尺':0.30303}},
  weight:{u:{'公克':0.001,'公斤':1,'公噸':1000,'台斤':0.6,'磅':0.453592,'盎司':0.0283495}},
  area:{u:{'平方公尺':1,'坪':3.305785,'平方公分':0.0001,'公頃':10000,'甲':9699.17,'平方英尺':0.092903}}};
function setUnit(){
  const cat=getSeg('u_cat'), fromSel=$('u_from');
  if(cat==='temp'){fromSel.innerHTML=['攝氏 °C','華氏 °F','克氏 K'].map(o=>`<option>${o}</option>`).join('');}
  else{fromSel.innerHTML=Object.keys(UNITS[cat].u).map(o=>`<option>${o}</option>`).join('');if(cat==='length')fromSel.value='公尺';if(cat==='area')fromSel.value='坪';}
  calcU();
}
function calcU(){
  const cat=getSeg('u_cat'), val=+$('u_val').value||0, from=$('u_from').value, out=$('u_out'); let rows='';
  if(cat==='temp'){let c;if(from.includes('°C'))c=val;else if(from.includes('°F'))c=(val-32)*5/9;else c=val-273.15;
    const res={'攝氏 °C':c,'華氏 °F':c*9/5+32,'克氏 K':c+273.15};
    for(const k in res)rows+=`<div class="stat"><div class="k">${k}</div><div class="v num">${nf(res[k],2)}</div></div>`;}
  else{const u=UNITS[cat].u, baseVal=val*u[from];
    for(const k in u){const v=baseVal/u[k];rows+=`<div class="stat"><div class="k">${k}</div><div class="v num">${nf(v,(v!==0&&Math.abs(v)<1)?4:2)}</div></div>`;}}
  out.innerHTML=`<div class="result"><div class="cap">換算結果</div><div class="stats">${rows}</div></div>`;
}

/* 複利 */
function calcC(){
  const P=+$('c_p').value||0, add=+$('c_add').value||0, rate=(+$('c_rate').value||0)/100, yr=Math.floor(+$('c_yr').value||0);
  const out=$('c_out'); if(yr<=0){out.innerHTML='';return;}
  let bal=P, invested=P, rows=[];
  for(let y=1;y<=yr;y++){bal=bal*(1+rate)+add;invested+=add;rows.push([y,bal,bal-invested]);}
  const gain=bal-invested, tr=rows.map(r=>`<tr><td>${r[0]}</td><td class="num">${nf(r[1])}</td><td class="num">${nf(r[2])}</td></tr>`).join('');
  out.innerHTML=`<div class="result"><div class="cap">${yr} 年後總資產</div><div class="big num">$${nf(bal)}<small>元</small></div>
    <div class="stats"><div class="stat"><div class="k">累積投入本金</div><div class="v num">$${nf(invested)}</div></div>
    <div class="stat"><div class="k">複利獲利</div><div class="v num" style="color:var(--pos)">$${nf(gain)}</div></div></div></div>
    <div class="panel"><h4>逐年成長</h4><div class="tablewrap"><table><tr><th>年</th><th>總資產（元）</th><th>累積獲利（元）</th></tr>${tr}</table></div></div>`;
}

/* 年齡 */
function calcA(){
  const f=$('a_from').value, t=$('a_to').value, out=$('a_out'); if(!f){out.innerHTML='';return;}
  const from=new Date(f+'T00:00:00'), to=t?new Date(t+'T00:00:00'):new Date(new Date().toDateString());
  if(to<from){out.innerHTML='<div class="note" style="border-left-color:var(--neg)">結束日期不能早於起始日期。</div>';return;}
  let y=0,m=0,cur=new Date(from);
  while(true){const nx=new Date(cur);nx.setFullYear(nx.getFullYear()+1);if(nx<=to){cur=nx;y++;}else break;}
  while(true){const nx=new Date(cur);nx.setMonth(nx.getMonth()+1);if(nx<=to){cur=nx;m++;}else break;}
  const d=Math.round((to-cur)/86400000), totalDays=Math.round((to-from)/86400000), weeks=Math.floor(totalDays/7);
  out.innerHTML=`<div class="result"><div class="cap">實際年齡 / 間隔</div>
    <div class="big"><span class="num">${y}</span> <small>歲</small> <span class="num">${m}</span> <small>個月</small> <span class="num">${d}</span> <small>天</small></div>
    <div class="stats"><div class="stat"><div class="k">總天數</div><div class="v num">${nf(totalDays)} 天</div></div>
    <div class="stat"><div class="k">總週數</div><div class="v num">${nf(weeks)} 週</div></div>
    <div class="stat"><div class="k">虛歲（概估）</div><div class="v num">${y+1} 歲</div></div></div></div>`;
}

/* 民國 / 西元 */
function calcROC(){
  const d=$('r_date').value, out=$('r_out'); if(!d){out.innerHTML='';return;}
  const dt=new Date(d+'T00:00:00'), y=dt.getFullYear(), mo=dt.getMonth()+1, day=dt.getDate();
  const roc=y-1911, rocLabel=roc>=1?`民國 ${roc} 年`:`民國前 ${1-roc} 年`;
  const animals=['鼠','牛','虎','兔','龍','蛇','馬','羊','猴','雞','狗','豬'], zodiac=animals[((y-4)%12+12)%12];
  const signs=[['摩羯',1,19],['水瓶',2,18],['雙魚',3,20],['牡羊',4,19],['金牛',5,20],['雙子',6,21],['巨蟹',7,22],['獅子',8,22],['處女',9,22],['天秤',10,23],['天蠍',11,22],['射手',12,21],['摩羯',12,31]];
  let star=''; for(let i=0;i<signs.length;i++){if(mo===signs[i][1]){star=day<=signs[i][2]?signs[i][0]:(signs[i+1]?signs[i+1][0]:'摩羯');break;}}
  out.innerHTML=`<div class="result"><div class="cap">國曆 ${y} 年 ${mo} 月 ${day} 日</div>
    <div class="big num">${rocLabel} ${mo} 月 ${day} 日</div>
    <div class="stats"><div class="stat"><div class="k">生肖</div><div class="v">${zodiac}</div></div>
    <div class="stat"><div class="k">星座</div><div class="v">${star}座</div></div>
    <div class="stat"><div class="k">西元</div><div class="v num">${y}</div></div></div></div>`;
}

/* 預產期 */
function calcDue(){
  const v=$('due_lmp').value, out=$('due_out'); if(!v){out.innerHTML='';return;}
  const cycle=+$('due_cycle').value||28, lmp=new Date(v+'T00:00:00');
  const edd=new Date(lmp); edd.setDate(edd.getDate()+280+(cycle-28));
  const today=new Date(new Date().toDateString());
  const diff=Math.floor((today-lmp)/86400000), wk=Math.floor(diff/7), dy=((diff%7)+7)%7;
  const toEdd=Math.round((edd-today)/86400000);
  const tri=diff<0?'—':(wk<13?'第一孕期':wk<28?'第二孕期':'第三孕期');
  const fmt=d=>`${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`;
  const weekStr=diff<0?'—':`${wk} 週 ${dy} 天`;
  out.innerHTML=`<div class="result"><div class="cap">預產期（預計生產日）</div>
    <div class="big num">${fmt(edd)}</div>
    <div class="stats"><div class="stat"><div class="k">目前懷孕週數</div><div class="v num">${weekStr}</div></div>
    <div class="stat"><div class="k">孕期階段</div><div class="v">${tri}</div></div>
    <div class="stat"><div class="k">距預產期</div><div class="v num">${diff<0?'—':(toEdd>=0?toEdd+' 天':'已過 '+(-toEdd)+' 天')}</div></div></div></div>`;
}

/* 排卵 / 生理期 */
function calcOvu(){
  const v=$('ovu_lmp').value, out=$('ovu_out'); if(!v){out.innerHTML='';return;}
  const cycle=+$('ovu_cycle').value||28, pdays=+$('ovu_days').value||5, lmp=new Date(v+'T00:00:00');
  const next=new Date(lmp); next.setDate(next.getDate()+cycle);
  const ovu=new Date(next); ovu.setDate(ovu.getDate()-14);
  const fs=new Date(ovu); fs.setDate(fs.getDate()-5);
  const fe=new Date(ovu); fe.setDate(fe.getDate()+1);
  const md=d=>`${d.getMonth()+1}/${d.getDate()}`;
  out.innerHTML=`<div class="result"><div class="cap">排卵日（約）</div>
    <div class="big num">${ovu.getFullYear()}/${md(ovu)}</div>
    <div class="stats"><div class="stat"><div class="k">易孕期</div><div class="v num">${md(fs)} – ${md(fe)}</div></div>
    <div class="stat"><div class="k">下次月經預估</div><div class="v num">${next.getFullYear()}/${md(next)}</div></div>
    <div class="stat"><div class="k">週期 / 經期</div><div class="v num">${cycle} / ${pdays} 天</div></div></div></div>`;
}

/* 折扣 */
function calcDisc(){
  const price=+$('disc_price').value||0, mode=getSeg('disc_mode'), val=+$('disc_val').value||10, out=$('disc_out');
  if(price<=0){out.innerHTML='';return;}
  let cap,total,avg,eq,save;
  if(mode==='pct'){total=price*val/10;avg=total;eq=val;save=price-total;cap=`打 ${val} 折`;}
  else if(mode==='second'){total=price+price*val/10;avg=total/2;eq=avg/price*10;save=price*2-total;cap=`第二件 ${val} 折 · 買 2 件`;}
  else{total=price;avg=price/2;eq=5;save=price;cap='買一送一 · 拿 2 件';}
  out.innerHTML=`<div class="result"><div class="cap">${cap}</div>
    <div class="big num">$${nf(total)}<small>${mode==='pct'?'實付':'共付'}</small></div>
    <div class="stats">
    ${mode!=='pct'?`<div class="stat"><div class="k">平均每件</div><div class="v num">$${nf(avg)}</div></div>`:''}
    <div class="stat"><div class="k">相當於</div><div class="v num">${nf(eq,1)} 折</div></div>
    <div class="stat"><div class="k">省下</div><div class="v num">$${nf(save)}</div></div></div></div>`;
}

/* 寵物年齡 */
function calcPet(){
  const type=getSeg('pet_type'), size=getSeg('pet_size'), age=+$('pet_age').value||0, out=$('pet_out');
  if(age<=0){out.innerHTML='';return;}
  let h;
  if(type==='cat'){h=age<=1?15*age:age<=2?15+(age-1)*9:24+(age-2)*4;}
  else{const per=size==='small'?4:size==='large'?6:5;h=age<=1?15*age:age<=2?15+(age-1)*9:24+(age-2)*per;}
  out.innerHTML=`<div class="result"><div class="cap">換算成人類年齡（約）</div>
    <div class="big num">${nf(h,0)} <small>歲</small></div>
    <div class="stats"><div class="stat"><div class="k">${type==='cat'?'貓咪':'狗狗'}實際年齡</div><div class="v num">${nf(age,1)} 歲</div></div>
    ${type==='dog'?`<div class="stat"><div class="k">體型</div><div class="v">${size==='small'?'小型':size==='large'?'大型':'中型'}</div></div>`:''}</div></div>`;
}

/* 油錢 */
function calcFuel(){
  const dist=+$('fuel_dist').value||0, eff=+$('fuel_eff').value||0, price=+$('fuel_price').value||0, out=$('fuel_out');
  if(dist<=0||eff<=0){out.innerHTML='';return;}
  const liters=dist/eff, cost=liters*price, perKm=price/eff;
  out.innerHTML=`<div class="result"><div class="cap">這趟油錢</div>
    <div class="big num">$${nf(cost)}</div>
    <div class="stats"><div class="stat"><div class="k">耗油量</div><div class="v num">${nf(liters,2)} 公升</div></div>
    <div class="stat"><div class="k">每公里油錢</div><div class="v num">$${nf(perKm,2)}</div></div>
    <div class="stat"><div class="k">行駛距離</div><div class="v num">${nf(dist)} 公里</div></div></div></div>`;
}

/* 工作天數 */
function calcWork(){
  const f=$('work_from').value, t=$('work_to').value, out=$('work_out');
  if(!f||!t){out.innerHTML='';return;}
  const from=new Date(f+'T00:00:00'), to=new Date(t+'T00:00:00');
  if(to<from){out.innerHTML='<div class="note" style="border-left-color:var(--neg)">結束日期不能早於起始日期。</div>';return;}
  const hol=Math.max(0,Math.floor(+$('work_hol').value||0));
  let total=0, weekend=0, cur=new Date(from);
  while(cur<=to){const d=cur.getDay();total++;if(d===0||d===6)weekend++;cur.setDate(cur.getDate()+1);}
  const workdays=total-weekend, final=Math.max(0,workdays-hol);
  out.innerHTML=`<div class="result"><div class="cap">工作天數（扣週末${hol>0?'與假日':''}）</div>
    <div class="big num">${nf(final)} <small>天</small></div>
    <div class="stats"><div class="stat"><div class="k">區間總天數</div><div class="v num">${nf(total)} 天</div></div>
    <div class="stat"><div class="k">週末天數</div><div class="v num">${nf(weekend)} 天</div></div>
    <div class="stat"><div class="k">扣國定假日</div><div class="v num">${nf(hol)} 天</div></div></div></div>`;
}

/* 中文大寫金額 */
function numToChineseUpper(num){
  const d=['零','壹','貳','參','肆','伍','陸','柒','捌','玖'], radice=['','拾','佰','仟'], units=['','萬','億','兆'], dec=['角','分'];
  num=num.toString();
  let intPart, decPart;
  if(num.indexOf('.')===-1){intPart=num;decPart='';}else{const p=num.split('.');intPart=p[0];decPart=p[1].substr(0,2);}
  let s='';
  if(parseInt(intPart,10)>0){
    let zero=0; const L=intPart.length;
    for(let i=0;i<L;i++){
      const n=intPart.substr(i,1), p=L-i-1, q=Math.floor(p/4), m=p%4;
      if(n==='0'){zero++;}
      else{if(zero>0)s+=d[0];zero=0;s+=d[parseInt(n)]+radice[m];}
      if(m===0&&zero<4)s+=units[q];
    }
    s+='元';
  }
  if(decPart!==''){for(let i=0;i<decPart.length;i++){const n=decPart.substr(i,1);if(n!=='0')s+=d[parseInt(n)]+dec[i];}}
  if(s==='')s=d[0]+'元整'; else if(decPart==='')s+='整';
  return s;
}
function calcUpper(){
  const raw=$('upper_amt').value, out=$('upper_out'), num=parseFloat(raw);
  if(raw===''||isNaN(num)||num<0){out.innerHTML='';return;}
  if(num>999999999999){out.innerHTML='<div class="note" style="border-left-color:var(--neg)">金額過大，請輸入一兆以下的數字。</div>';return;}
  const txt=numToChineseUpper(num);
  out.innerHTML=`<div class="result"><div class="cap">中文大寫金額</div>
    <div class="big" style="font-size:32px;line-height:1.45">${txt}</div>
    <div class="stats"><div class="stat"><div class="k">阿拉伯數字</div><div class="v num">${num.toLocaleString('zh-TW')}</div></div></div></div>`;
}

/* 寶寶月齡與疫苗時程（依疾管署現行兒童常規疫苗） */
const VACCINES=[
  [0,'B 型肝炎 第 1 劑'],
  [1,'B 型肝炎 第 2 劑'],
  [2,'五合一 第 1 劑、肺炎鏈球菌 第 1 劑'],
  [4,'五合一 第 2 劑、肺炎鏈球菌 第 2 劑'],
  [5,'卡介苗 BCG'],
  [6,'B 型肝炎 第 3 劑、五合一 第 3 劑、流感（每年）'],
  [12,'水痘、MMR 第 1 劑、肺炎鏈球菌 第 3 劑、A 肝 第 1 劑'],
  [15,'日本腦炎 第 1 劑'],
  [18,'五合一 第 4 劑、A 肝 第 2 劑'],
  [27,'日本腦炎 第 2 劑'],
  [60,'MMR 第 2 劑、日本腦炎、四合一 DTaP-IPV']
];
function calcBaby(){
  const v=$('baby_dob').value, out=$('baby_out'); if(!v){out.innerHTML='';return;}
  const dob=new Date(v+'T00:00:00'), today=new Date(new Date().toDateString());
  if(dob>today){out.innerHTML='<div class="note" style="border-left-color:var(--neg)">出生日期不能在未來。</div>';return;}
  const diffDays=Math.floor((today-dob)/86400000), wk=Math.floor(diffDays/7);
  let m=0,cur=new Date(dob);
  while(true){const nx=new Date(cur);nx.setMonth(nx.getMonth()+1);if(nx<=today){cur=nx;m++;}else break;}
  const remD=Math.round((today-cur)/86400000);
  const fmt=d=>`${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`;
  let rows='';
  VACCINES.forEach(vc=>{
    const d=new Date(dob); if(vc[0]>0)d.setMonth(d.getMonth()+vc[0]); else d.setDate(d.getDate()+1);
    const done=today>=d, label=vc[0]===0?'出生 24 小時內':`滿 ${vc[0]} 個月`;
    rows+=`<tr><td style="text-align:left">${label}</td><td style="text-align:left">${vc[1]}</td><td class="num">${fmt(d)}</td><td>${done?'✓ 已可接種':'尚未到'}</td></tr>`;
  });
  out.innerHTML=`<div class="result"><div class="cap">寶寶目前月齡</div>
    <div class="big num">${m} <small>個月 ${remD} 天</small></div>
    <div class="stats"><div class="stat"><div class="k">出生至今</div><div class="v num">${nf(diffDays)} 天</div></div>
    <div class="stat"><div class="k">滿幾週</div><div class="v num">${wk} 週</div></div></div></div>
    <div class="panel"><h4>公費疫苗接種時程（依出生日推算）</h4><div class="tablewrap"><table>
    <tr><th style="text-align:left">時程</th><th style="text-align:left">疫苗</th><th>建議日期</th><th>狀態</th></tr>${rows}</table></div>
    <div class="hint">「狀態」僅表示建議時間是否已到，不代表是否已接種；實際請依兒童健康手冊與醫師安排。</div></div>`;
}

/* 定存利息 */
function calcFD(){
  const p=+$('fd_p').value||0, rate=(+$('fd_rate').value||0)/100, mon=+$('fd_mon').value||0, out=$('fd_out');
  if(p<=0||mon<=0){out.innerHTML='';return;}
  const yr=mon/12, interest=p*rate*yr, total=p+interest, monthly=p*rate/12;
  out.innerHTML=`<div class="result"><div class="cap">到期本利和（整存整付・單利）</div>
    <div class="big num">$${nf(total)}</div>
    <div class="stats"><div class="stat"><div class="k">總利息</div><div class="v num">$${nf(interest)}</div></div>
    <div class="stat"><div class="k">存本取息・每月領</div><div class="v num">$${nf(monthly)}</div></div>
    <div class="stat"><div class="k">存款期間</div><div class="v num">${nf(mon)} 個月</div></div></div></div>`;
}

/* 存錢目標 */
function calcSave(){
  const goal=+$('sv_goal').value||0, have=+$('sv_have').value||0, months=+$('sv_months').value||0, r=(+$('sv_rate').value||0)/100/12, out=$('sv_out');
  if(goal<=0||months<=0){out.innerHTML='';return;}
  let pmt;
  if(r>0){const f=Math.pow(1+r,months);pmt=(goal-have*f)/((f-1)/r);}
  else{pmt=(goal-have)/months;}
  if(pmt<=0){out.innerHTML=`<div class="result"><div class="cap">每月需存</div><div class="big num">$0</div><div class="hint">依目前已有金額${r>0?'與投資報酬':''}，期限內已可達成目標。</div></div>`;return;}
  const totalContrib=have+pmt*months, growth=goal-totalContrib;
  out.innerHTML=`<div class="result"><div class="cap">每月需存</div>
    <div class="big num">$${nf(pmt)}</div>
    <div class="stats"><div class="stat"><div class="k">目標金額</div><div class="v num">$${nf(goal)}</div></div>
    <div class="stat"><div class="k">期限</div><div class="v num">${nf(months)} 個月</div></div>
    ${r>0?`<div class="stat"><div class="k">投資複利貢獻</div><div class="v num" style="color:var(--pos)">$${nf(growth)}</div></div>`:`<div class="stat"><div class="k">目前已有</div><div class="v num">$${nf(have)}</div></div>`}</div></div>`;
}

/* 自動初始化（依頁面存在的元素） */
document.addEventListener('DOMContentLoaded',()=>{
  if($('fd_out'))calcFD();
  if($('sv_out'))calcSave();
  if($('baby_out'))calcBaby();
  if($('fuel_out'))calcFuel();
  if($('work_out'))calcWork();
  if($('upper_out'))calcUpper();
  if($('due_out'))calcDue();
  if($('ovu_out'))calcOvu();
  if($('disc_out'))calcDisc();
  if($('pet_out'))calcPet();
  if($('m_out'))calcM();
  if($('e_out')){calcE();calcEst();}
  if($('s_out'))calcStk();
  if($('sal_out'))calcSal();
  if($('ot_out'))calcOT();
  if($('h_out'))calcH();
  if($('u_from'))setUnit();
  if($('c_out'))calcC();
  if($('a_out'))calcA();
  if($('r_out'))calcROC();
});
