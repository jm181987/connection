const {Pool}=require("pg");
const pool=new Pool({connectionString:process.env.DATABASE_URL,max:3,connectionTimeoutMillis:5000,idleTimeoutMillis:10000,ssl:process.env.PGSSL==="true"?{rejectUnauthorized:true}:undefined});
module.exports=async(req,res)=>{
 res.setHeader("Cache-Control","no-store");
 if(req.method!=="POST"){res.setHeader("Allow","POST");return res.status(405).json({error:"method_not_allowed"})}
 const secret=process.env.INGEST_API_KEY;
 if(!secret)return res.status(503).json({error:"server_not_configured"});
 if(req.headers.authorization!==`Bearer ${secret}`)return res.status(401).json({error:"unauthorized"});
 const body=req.body||{};
 const deviceId=body.deviceId;
 const items=body.measurements;
 if(typeof deviceId!=="string"||!/^[a-zA-Z0-9_-]{8,80}$/.test(deviceId)||!Array.isArray(items)||items.length<1||items.length>100)return res.status(400).json({error:"invalid_payload",detail:typeof deviceId!=="string"?"missing_device_id":!Array.isArray(items)?"missing_measurements":"invalid_device_id_or_batch"});
 const rows=[];
 for(const item of items){
  if(!item||!Number.isSafeInteger(item.time)||item.time<Date.now()-90*86400000||item.time>Date.now()+300000||typeof item.ok!=="boolean"||!["good","fair","poor","offline"].includes(item.quality)||item.ok===(item.quality==="offline")||!(item.ms===null||Number.isInteger(item.ms)&&item.ms>=0&&item.ms<=120000)||item.ok&&item.ms===null||!item.ok&&item.ms!==null)return res.status(400).json({error:"invalid_measurement"});
  rows.push([deviceId,new Date(item.time),item.ok,item.quality,item.ms]);
 }
 const client=await pool.connect().catch(()=>null);
 if(!client)return res.status(503).json({error:"database_unavailable"});
 try{
  await client.query("BEGIN");
  let inserted=0;
  for(const [id,time,ok,quality,ms] of rows){
   const r=await client.query("INSERT INTO internet_measurements (device_id,observed_at,online,quality,latency_ms) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (device_id,observed_at) DO NOTHING",[id,time,ok,quality,ms]);
   inserted+=r.rowCount;
  }
  await client.query("COMMIT");
  return res.status(200).json({ok:true,received:rows.length,inserted});
 }catch(e){await client.query("ROLLBACK").catch(()=>{});console.error("DB ingestion error",e.code||"unknown");return res.status(503).json({error:"database_write_failed"})}finally{client.release()}
};
