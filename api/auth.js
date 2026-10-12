const crypto=require("crypto");
const {pool,hash,passwordHash}=require("../lib/auth");
module.exports=async(req,res)=>{
 res.setHeader("Cache-Control","no-store");
 if(req.method!=="POST")return res.status(405).json({error:"method_not_allowed"});
 const {action,username,password}=req.body||{};
 if(!["register","login","logout"].includes(action))return res.status(400).json({error:"invalid_action"});
 let client;
 try{
  client=await pool.connect();
  if(action==="logout"){
   const token=/^Bearer (.+)$/.exec(req.headers.authorization||"")?.[1];
   if(token)await client.query("DELETE FROM monitor_sessions WHERE token_hash=$1",[hash(token)]);
   return res.status(200).json({ok:true});
  }
  if(typeof username!=="string"||!/^[a-zA-Z0-9_.-]{3,40}$/.test(username)||typeof password!=="string"||password.length<12||password.length>128)return res.status(400).json({error:"invalid_credentials_format",detail:"Usuario: 3-40 caracteres. Contraseña: 12-128 caracteres."});
  const uname=username.toLowerCase();
  let user;
  if(action==="register"){
   const salt=crypto.randomBytes(16).toString("hex"),ph=passwordHash(password,salt);
   const created=await client.query("INSERT INTO monitor_users(username,password_salt,password_hash) VALUES($1,$2,$3) ON CONFLICT(username) DO NOTHING RETURNING id,username",[uname,salt,ph]);
   if(!created.rowCount)return res.status(409).json({error:"username_unavailable"});
   user=created.rows[0];
  }else{
   const found=await client.query("SELECT id,username,password_salt,password_hash,active FROM monitor_users WHERE username=$1",[uname]);
   const row=found.rows[0];
   const dummySalt="bce9f03b5d65b94e8fa14d01eeb8e32c";
   const candidate=passwordHash(password,row?.password_salt||dummySalt);
   const expected=Buffer.from(row?.password_hash||"0".repeat(128),"hex");
   if(!row||!row.active||!crypto.timingSafeEqual(Buffer.from(candidate,"hex"),expected))return res.status(401).json({error:"invalid_credentials"});
   user={id:row.id,username:row.username};
  }
  const token=crypto.randomBytes(32).toString("hex");
  await client.query("INSERT INTO monitor_sessions(user_id,token_hash,expires_at) VALUES($1,$2,NOW()+INTERVAL '30 days')",[user.id,hash(token)]);
  return res.status(200).json({ok:true,username:user.username,token});
 }catch(e){console.error("Auth error",{code:e.code||"unknown"});return res.status(503).json({error:"auth_unavailable",sqlstate:e.code||null})}finally{if(client)client.release()}
};