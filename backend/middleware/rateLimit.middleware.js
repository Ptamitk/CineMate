const buckets=new Map();
const WINDOW_MS=60*1000;
const MAX_REQUESTS=process.env.API_RATE_LIMIT_MAX?Number(process.env.API_RATE_LIMIT_MAX):180;
module.exports=(req,res,next)=>{if(req.path==="/health")return next();const now=Date.now();const key=req.ip||"unknown";const current=buckets.get(key);if(!current||now-current.start>=WINDOW_MS){buckets.set(key,{start:now,count:1});return next();}current.count+=1;if(current.count>MAX_REQUESTS){res.set("Retry-After","60");return res.status(429).json({message:"Too many requests. Please try again later."});}next();};
setInterval(()=>{const now=Date.now();for(const [key,v] of buckets){if(now-v.start>=WINDOW_MS)buckets.delete(key);}},WINDOW_MS).unref();
