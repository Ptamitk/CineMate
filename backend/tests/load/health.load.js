const target=process.env.TARGET_URL||"http://localhost:5000/health";
const concurrency=Number(process.env.CONCURRENCY||50);
const rounds=Number(process.env.ROUNDS||20);
const run=async()=>{const started=Date.now();let ok=0,fail=0,total=0;const lat=[];for(let r=0;r<rounds;r++){await Promise.all(Array.from({length:concurrency},async()=>{const t=Date.now();try{const res=await fetch(target);total++;if(res.ok)ok++;else fail++;}catch{total++;fail++;}lat.push(Date.now()-t);}));}lat.sort((a,b)=>a-b);const pct=p=>lat[Math.min(lat.length-1,Math.floor(lat.length*p))]||0;console.log(JSON.stringify({target,total,ok,fail,durationMs:Date.now()-started,p50Ms:pct(.5),p95Ms:pct(.95),p99Ms:pct(.99)},null,2));if(fail>0)process.exitCode=1;};
run();