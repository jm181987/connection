const {Pool}=require("pg");
const {userFor}=require("../lib/auth");
const pool=new Pool({connectionString:process.env.DATABASE_URL,max:2,connectionTimeoutMillis:5000,idleTimeoutMillis:10000,ssl:process.env.PGSSL==="true"?{rejectUnauthorized:true}:undefined});
module.exports=async(req,res)=>{
 res.setHeader("Cache-Control","no-store");
 if(req.method!=="GET"){res.setHeader("Allow","GET");return res.status(405).json({error:"method_not_allowed"})}

 const deviceId=req.query.deviceId,days=Number(req.query.days||1);
 if(typeof deviceId!=="string"||!/^[a-zA-Z0-9_-]{8,80}$/.test(deviceId)||![1,7,30,0].includes(days))return res.status(400).json({error:"invalid_parameters"});
 let client;
 try{
  client=await pool.connect();
  const user=await userFor(req,client);
  if(!user)return res.status(401).json({error:"login_required"});
  const ownership=await client.query("SELECT 1 FROM monitor_devices WHERE device_id=$1 AND user_id=$2",[deviceId,user.id]);
  if(!ownership.rowCount)return res.status(403).json({error:"device_not_owned"});
  const query=`WITH sampled AS (
    SELECT observed_at, online, latency_ms,
      lag(observed_at) OVER (ORDER BY observed_at) AS prev_time,
      lag(online) OVER (ORDER BY observed_at) AS prev_online
    FROM internet_measurements
    WHERE device_id=$1 AND ($2::int=0 OR observed_at>=NOW()-($2::int*INTERVAL '1 day'))
  ), marked AS (
    SELECT *, CASE WHEN prev_time IS NULL OR EXTRACT(EPOCH FROM observed_at-prev_time)>15 OR prev_online IS DISTINCT FROM online THEN 1 ELSE 0 END AS boundary
    FROM sampled
  ), runs AS (
    SELECT *, SUM(boundary) OVER (ORDER BY observed_at) AS group_id FROM marked
  ), outages AS (
    SELECT group_id, MIN(observed_at) AS started, MAX(observed_at) AS ended, COUNT(*) AS samples
    FROM runs WHERE NOT online GROUP BY group_id
  )
  SELECT
   (SELECT COUNT(*)::int FROM sampled) AS samples,
   (SELECT COUNT(*)::int FROM sampled WHERE online) AS online_samples,
   (SELECT ROUND(AVG(latency_ms))::int FROM sampled WHERE online) AS avg_latency,
   (SELECT COUNT(*)::int FROM outages) AS outage_count,
   (SELECT COALESCE(SUM(EXTRACT(EPOCH FROM ended-started)+LEAST(3,EXTRACT(EPOCH FROM ended-started)+3)),0)::bigint FROM outages) AS outage_seconds,
   (SELECT MAX(observed_at) FROM sampled) AS last_sample`;
  const totals=(await client.query(query,[deviceId,days])).rows[0];
  const series=(await client.query(`SELECT date_trunc('hour',observed_at) AS bucket,COUNT(*)::int AS samples,COUNT(*) FILTER (WHERE online)::int AS online_samples,ROUND(AVG(latency_ms) FILTER (WHERE online))::int AS latency FROM internet_measurements WHERE device_id=$1 AND ($2::int=0 OR observed_at>=NOW()-($2::int*INTERVAL '1 day')) GROUP BY 1 ORDER BY 1`,[deviceId,days])).rows;
  const interval=days===1?"5 minutes":days===7?"30 minutes":days===30?"2 hours":"1 hour";
  const oscillation=(await client.query(`SELECT date_bin($3::interval,observed_at,TIMESTAMPTZ '2000-01-01') AS bucket,
    COUNT(*)::int AS samples, COUNT(*) FILTER (WHERE online)::int AS online_samples,
    ROUND(AVG(latency_ms) FILTER (WHERE online))::int AS avg_ms,
    MIN(latency_ms) FILTER (WHERE online) AS min_ms,
    MAX(latency_ms) FILTER (WHERE online) AS max_ms,
    ROUND(STDDEV_POP(latency_ms) FILTER (WHERE online))::int AS jitter_ms
    FROM internet_measurements WHERE device_id=$1 AND ($2::int=0 OR observed_at>=NOW()-($2::int*INTERVAL '1 day'))
    GROUP BY 1 ORDER BY 1`,[deviceId,days,interval])).rows;
  return res.status(200).json({ok:true,days,totals,series,oscillation});
 }catch(e){console.error("Stats SQL error",{code:e.code||"unknown"});return res.status(503).json({error:"stats_unavailable",sqlstate:e.code||null})}finally{if(client)client.release()}
};