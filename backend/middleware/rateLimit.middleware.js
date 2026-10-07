const Redis=require("ioredis");
const localBuckets=new Map();
const redisClient=process.env.REDIS_URL?new Redis(process.env.REDIS_URL,{maxRetriesPerRequest:1,enableOfflineQueue:false}):null;
const WINDOW_SECONDS=60;
const MAX_REQUESTS=process.env.API_RATE_LIMIT_MAX?Number(process.env.API_RATE_LIMIT_MAX):180;
module.exports=async(req,res,next)=>{
 if(req.path==="/health")return next();
 const key="cinemate:rate:"+ (req.ip||"unknown");
 if(redisClient){
  try{const count=await redisClient.incr(key);if(count===1)await redisClient.expire(key,WINDOW_SECONDS);if(count>MAX_REQUESTS){res.set("Retry-After",String(WINDOW_SECONDS));return res.status(429).json({message:"Too many requests. Please try again later."});}return next();}catch(error){console.error("Redis rate limit fallback:",error.message);}
 }
 const now=Date.now();const current=localBuckets.get(key);if(!current||now-current.start>=WINDOW_SECONDS*1000){localBuckets.set(key,{start:now,count:1});return next();}current.count+=1;if(current.count>MAX_REQUESTS){res.set("Retry-After",String(WINDOW_SECONDS));return res.status(429).json({message:"Too many requests. Please try again later."});}next();
};
setInterval(()=>{const now=Date.now();for(const[key,v]of localBuckets){if(now-v.start>=WINDOW_SECONDS*1000)localBuckets.delete(key);}},WINDOW_SECONDS*1000).unref();
