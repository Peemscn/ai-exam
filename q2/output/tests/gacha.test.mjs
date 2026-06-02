// Unit tests สำหรับตรรกะ gacha simulator (q2)
// รัน: node --test q2/output/tests/
import {test} from "node:test";
import assert from "node:assert/strict";
import {pickRarity,computeRolls,rateTotal,missingPools} from "./gacha-logic.mjs";

test("rateTotal: default rate รวม = 100", ()=>assert.equal(rateTotal({SSR:1,SR:9,R:30,N:60}),100));
test("rateTotal: ตรวจจับ rate ผิด (104)", ()=>assert.equal(rateTotal({SSR:5,SR:9,R:30,N:60}),104));

test("computeRolls: 3000/30, free X10 Y1 → 100 paid + 10 free = 110", ()=>{
 const r=computeRolls(3000,30,true,10,1);
 assert.equal(r.paid,100); assert.equal(r.free,10); assert.equal(r.total,110);
});
test("computeRolls: free ไม่สร้าง free ซ้ำ (คิดจาก paid เท่านั้น)", ()=>{
 // 100 paid → 10 free (ไม่ใช่ 11 จากการนับ free เข้าไปคิดอีก)
 assert.equal(computeRolls(3000,30,true,10,1).free,10);
});
test("computeRolls: ปิด free roll → free = 0", ()=>{
 const r=computeRolls(3000,30,false,10,1);
 assert.equal(r.free,0); assert.equal(r.total,100);
});
test("computeRolls: ราคา 0 → paid 0 (กัน div by zero)", ()=>{
 assert.equal(computeRolls(3000,0,true,10,1).paid,0);
});

test("pity: counter ถึง threshold → การันตี SSR + reset", ()=>{
 const ctx={on:true,th:10,counter:9};
 assert.equal(pickRarity({SSR:1,SR:9,R:30,N:60},ctx),"SSR");
 assert.equal(ctx.counter,0);
});
test("pity: counter เพิ่มเมื่อไม่ออก SSR", ()=>{
 const ctx={on:true,th:90,counter:0};
 pickRarity({SSR:0,SR:0,R:0,N:100},ctx);
 assert.equal(ctx.counter,1);
});

test("pickRarity: rnd ต่ำ → SSR (deterministic)", ()=>{
 // rnd 0.05 * total 100 = 5 < SSR 10 → SSR
 assert.equal(pickRarity({SSR:10,SR:20,R:30,N:40},null,()=>0.05),"SSR");
});
test("pickRarity: rnd สูง → N (deterministic)", ()=>{
 // rnd 0.95 * 100 = 95 อยู่ในช่วง N (60-100)
 assert.equal(pickRarity({SSR:10,SR:20,R:30,N:40},null,()=>0.95),"N");
});

test("pickRarity: สัดส่วนจริงใกล้ rate ที่ตั้ง (200k rolls)", ()=>{
 const rates={SSR:10,SR:20,R:30,N:40},cnt={SSR:0,SR:0,R:0,N:0},N=200000;
 for(let i=0;i<N;i++)cnt[pickRarity(rates,null)]++;
 assert.ok(Math.abs(cnt.SSR/N*100-10)<1.5,`SSR=${(cnt.SSR/N*100).toFixed(2)}% ควรใกล้ 10`);
 assert.ok(Math.abs(cnt.SR/N*100-20)<1.5,`SR=${(cnt.SR/N*100).toFixed(2)}% ควรใกล้ 20`);
 assert.ok(Math.abs(cnt.N/N*100-40)<1.5,`N=${(cnt.N/N*100).toFixed(2)}% ควรใกล้ 40`);
});

test("missingPools: rarity ที่ rate>0 แต่ไม่มี item ถูกตรวจจับ", ()=>{
 const rates={SSR:1,SR:9,R:30,N:60};
 assert.deepEqual(missingPools(rates,[{name:"x",rarity:"SR"}]).sort(),["N","R","SSR"]);
 assert.deepEqual(missingPools(rates,[{name:"a",rarity:"SSR"},{name:"b",rarity:"SR"},{name:"c",rarity:"R"},{name:"d",rarity:"N"}]),[]);
});
