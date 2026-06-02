// Pure gacha logic — mirror ของ inline JS ใน ../deliverables/gacha-simulator.html
// (ไฟล์ส่งต้องเป็น HTML เดียว จึง inline; ไฟล์นี้แยกออกมาเพื่อ unit test ตรรกะเดียวกัน)
export const RAR=["SSR","SR","R","N"];

export function rateTotal(r){return RAR.reduce((s,k)=>s+(+r[k]||0),0);}

// สุ่ม rarity ตาม cumulative rate + pity (rnd แยกออกมาเพื่อ test แบบ deterministic)
export function pickRarity(rates,ctx,rnd=Math.random){
 if(ctx&&ctx.on&&ctx.counter+1>=ctx.th){ctx.counter=0;return "SSR";}
 const t=RAR.reduce((s,k)=>s+rates[k],0);let x=rnd()*t,acc=0,out="N";
 for(const k of RAR){acc+=rates[k];if(x<acc){out=k;break;}}
 if(ctx){if(out==="SSR")ctx.counter=0;else ctx.counter++;}
 return out;
}

// budget → paid/free/total (free roll คำนวณจาก paid เท่านั้น, free ไม่สร้าง free)
export function computeRolls(budget,price,freeOn,x,y){
 const paid=price>0?Math.floor(budget/price):0;
 const free=freeOn?Math.floor(paid/Math.max(1,x))*Math.max(0,y):0;
 return {paid,free,total:paid+free};
}

// pool validation: ทุก rarity ที่ rate>0 ต้องมี item อย่างน้อย 1
export function missingPools(rates,pool){
 return RAR.filter(k=>rates[k]>0 && !pool.some(p=>p.rarity===k));
}
