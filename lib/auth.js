const crypto=require("crypto");
const {Pool}=require("pg");
const pool=new Pool({connectionString:process.env.DATABASE_URL,max:3,connectionTimeoutMillis:5000,idleTimeoutMillis:10000,ssl:process.env.PGSSL==="true"?{rejectUnauthorized:true}:undefined});
const hash=t=>crypto.createHash("sha256").update(t).digest("hex");
const passwordHash=(p,s)=>crypto.scryptSync(p,s,64).toString("hex");
async function userFor(req,client){
 const token=/^Bearer (.+)$/.exec(req.headers.authorization||"")?.[1];
 if(!token||token.length!==64||!/^[a-f0-9]+$/.test(token))return null;
 const q=await client.query("SELECT u.id,u.username FROM monitor_sessions s JOIN monitor_users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>NOW() AND u.active=true",[hash(token)]);
 return q.rows[0]||null;
}
async function ownDevice(client,userId,deviceId){
 const r=await client.query("INSERT INTO monitor_devices(device_id,user_id) VALUES($1,$2) ON CONFLICT(device_id) DO UPDATE SET device_id=EXCLUDED.device_id WHERE monitor_devices.user_id=EXCLUDED.user_id RETURNING device_id",[deviceId,userId]);
 return r.rowCount===1;
}
module.exports={pool,hash,passwordHash,userFor,ownDevice};
