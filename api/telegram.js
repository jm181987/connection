const crypto=require("crypto");
const {pool,userFor}=require("../lib/auth");
function key(){const value=process.env.TELEGRAM_ENCRYPTION_KEY;if(!value||!/^[a-fA-F0-9]{64}$/.test(value))return null;return Buffer.from(value,"hex")}
function encrypt(text,k){const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv("aes-256-gcm",k,iv);const body=Buffer.concat([cipher.update(text,"utf8"),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),body]).toString("base64")}
function decrypt(data,k){const b=Buffer.from(data,"base64"),d=crypto.createDecipheriv("aes-256-gcm",k,b.subarray(0,12));d.setAuthTag(b.subarray(12,28));return Buffer.concat([d.update(b.subarray(28)),d.final()]).toString("utf8")}
module.exports=async(req,res)=>{
 res.setHeader("Cache-Control","no-store");
 if(!["GET","POST"].includes(req.method))return res.status(405).json({error:"method_not_allowed"});
 const k=key();if(!k)return res.status(503).json({error:"telegram_encryption_not_configured"});
 let client;
 try{
  client=await pool.connect();
  const user=await userFor(req,client);if(!user)return res.status(401).json({error:"login_required"});
  if(req.method==="GET"){
   const q=await client.query("SELECT enabled,chat_id,bot_token_encrypted IS NOT NULL AS configured FROM monitor_telegram_settings WHERE user_id=$1",[user.id]);
   const x=q.rows[0];return res.status(200).json({ok:true,enabled:x?.enabled||false,chatId:x?.chat_id||"",configured:x?.configured||false});
  }
  const {action}=req.body||{};
  if(action==="save"){
   const {enabled,chatId,botToken}=req.body;
   if(typeof enabled!=="boolean"||typeof chatId!=="string"||chatId.length>100||typeof botToken!=="string"||botToken.length>250)return res.status(400).json({error:"invalid_settings"});
   if(botToken&&!/^\d{6,15}:[A-Za-z0-9_-]{20,}$/.test(botToken))return res.status(400).json({error:"invalid_bot_token"});
   const enc=botToken?encrypt(botToken,k):null;
   await client.query("INSERT INTO monitor_telegram_settings(user_id,enabled,chat_id,bot_token_encrypted) VALUES($1,$2,$3,$4) ON CONFLICT(user_id) DO UPDATE SET enabled=EXCLUDED.enabled,chat_id=EXCLUDED.chat_id,bot_token_encrypted=COALESCE(EXCLUDED.bot_token_encrypted,monitor_telegram_settings.bot_token_encrypted)",[user.id,enabled,chatId,enc]);
   return res.status(200).json({ok:true});
  }
  if(action==="test"||action==="alert"){
   const q=await client.query("SELECT enabled,chat_id,bot_token_encrypted FROM monitor_telegram_settings WHERE user_id=$1",[user.id]);
   const x=q.rows[0];if(!x?.bot_token_encrypted||!x.chat_id||(!x.enabled&&action!=="test"))return res.status(400).json({error:"telegram_not_configured"});
   const message=action==="test"?"✅ KNJ Internet Monitor: Telegram vinculado correctamente.":req.body?.event==="offline"?"🔴 KNJ Internet Monitor: SIN INTERNET detectado.":req.body?.event==="recovered"?"🟢 KNJ Internet Monitor: conexión RESTABLECIDA.":null;
   if(!message)return res.status(400).json({error:"invalid_event"});
   const token=decrypt(x.bot_token_encrypted,k);
   const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
   try{
    const response=await fetch("https://api.telegram.org/bot"+token+"/sendMessage",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chat_id:x.chat_id,text:message}),signal:controller.signal});
    const body=await response.json().catch(()=>({}));
    if(!response.ok||!body.ok)return res.status(502).json({error:"telegram_delivery_failed"});
    return res.status(200).json({ok:true});
   }finally{clearTimeout(timeout)}
  }
  return res.status(400).json({error:"invalid_action"});
 }catch(e){console.error("Telegram settings error",{code:e.code||"unknown",name:e.name});return res.status(503).json({error:"telegram_unavailable",sqlstate:e.code||null})}finally{if(client)client.release()}
};