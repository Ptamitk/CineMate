let requests=0;let errors=0;let active=0;
const metricsMiddleware=(req,res,next)=>{if(req.path==="/metrics")return next();requests++;active++;const started=Date.now();res.on("finish",()=>{active--;if(res.statusCode>=500)errors++;if(process.env.LOG_REQUESTS==="true")console.log(JSON.stringify({type:"http",method:req.method,path:req.path,status:res.statusCode,durationMs:Date.now()-started}));});next();};
const getMetrics=()=>({requests,errors,active,uptimeSeconds:Math.floor(process.uptime()),memory:process.memoryUsage()});
module.exports={metricsMiddleware,getMetrics};
