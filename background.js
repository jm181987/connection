
// La configuración de la API se guarda solo en el perfil local de Chrome.
const API_ENDPOINT="https://connection-smoky.vercel.app/api/measurements";
let syncing=false;
async function queueMeasurement(result){
 const d=await chrome.storage.local.get(["dbEnabled","dbQueue","dbDeviceId"]);
 if(!d.dbEnabled)return;
 const id=d.dbDeviceId||"knj-"+crypto.randomUUID();
 const queue=[...(d.dbQueue||[]),result].slice(-2000);
 await chrome.storage.local.set({dbDeviceId:id,dbQueue:queue,dbPending:queue.length});
 if(result.ok)void syncMeasurements();
}
async function syncMeasurements(){
 if(syncing)return {ok:true,inProgress:true};
 syncing=true;
 try{
  const d=await chrome.storage.local.get(["dbEnabled","dbApiKey","authToken","dbDeviceId","dbQueue"]);
  if(!d.dbEnabled||!(d.authToken||d.dbApiKey))return {ok:false,error:"Iniciá sesión para sincronizar"};
  const queue=d.dbQueue||[];
  const deviceId=/^[a-zA-Z0-9_-]{8,80}$/.test(d.dbDeviceId||"")?d.dbDeviceId:"knj-"+crypto.randomUUID();
  if(deviceId!==d.dbDeviceId)await chrome.storage.local.set({dbDeviceId:deviceId});
  if(!queue.length)return {ok:true,sent:0,pending:0};
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20000);
  let response;
  try{response=await fetch(API_ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+(d.authToken||d.dbApiKey)},body:JSON.stringify({deviceId,measurements:queue.slice(0,100)}),signal:controller.signal})}finally{clearTimeout(timeout)}
  if(!response.ok){const detail=await response.json().catch(()=>({}));throw Error("API HTTP "+response.status+(detail.error?" · "+detail.error+(detail.detail?" ("+detail.detail+")":""):""));}
  const body=await response.json();
  if(!body.ok)throw Error("Respuesta inválida de API");
  const current=await chrome.storage.local.get("dbQueue");
  const sentTimes=new Set(queue.slice(0,100).map(x=>x.time));
  const remaining=(current.dbQueue||[]).filter(x=>!sentTimes.has(x.time));
  await chrome.storage.local.set({dbQueue:remaining,dbPending:remaining.length,dbStatus:"Último envío: "+new Date().toLocaleString()});
  return {ok:true,sent:queue.slice(0,100).length,inserted:body.inserted,pending:remaining.length};
 }catch(e){const error=e?.name==="AbortError"?"Tiempo de espera agotado (20 s). Revisá la conexión y los logs de Vercel.":e?.name==="TypeError"?"No se pudo conectar con la API. Revisá Internet y permisos de Chrome.":String(e);await chrome.storage.local.set({dbStatus:"Error de sincronización: "+error});return {ok:false,error}}finally{syncing=false}
}

const URLS=["https://www.google.com/generate_204","https://www.cloudflare.com/cdn-cgi/trace"];let busy=false,creating=null;async function telegramSend(event){
 const d=await chrome.storage.local.get(["telegramEnabled","authToken"]);
 if(!d.telegramEnabled||!d.authToken)return {ok:false,error:"Iniciá sesión y activá Telegram"};
 try{
  const r=await fetch("https://connection-smoky.vercel.app/api/telegram",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+d.authToken},body:JSON.stringify({action:event==="test"?"test":"alert",event})});
  const b=await r.json().catch(()=>({}));
  if(!r.ok)throw Error(b.error||"Error HTTP "+r.status);
  await chrome.storage.local.set({telegramStatus:"Enviado: "+new Date().toLocaleString()});
  return {ok:true};
 }catch(e){await chrome.storage.local.set({telegramStatus:"Error de envío: "+String(e)});return {ok:false,error:String(e)}}
}
async function telegramState(previous,confirmed,result){
 if(!previous||previous===confirmed||!(previous==="offline"||confirmed==="offline"))return;
 const d=await chrome.storage.local.get(["telegramEnabled","telegramPendingOutage"]);
 if(!d.telegramEnabled)return;
 if(confirmed==="offline"){await chrome.storage.local.set({telegramPendingOutage:true});return}
 if(previous==="offline"){
  if(d.telegramPendingOutage){const outage=await telegramSend("offline");if(outage.ok)await chrome.storage.local.remove("telegramPendingOutage")}
  await telegramSend("recovered");
 }
}
async function measure(){if(busy)return;busy=true;try{const d=await chrome.storage.local.get(["enabled","alerts","qualityAlerts","confirmedQuality","failures","successes","history"]);if(d.enabled===false)return;let result={time:Date.now(),ok:false,ms:null,quality:"offline"};for(const url of URLS){const c=new AbortController(),timeout=setTimeout(()=>c.abort(),2400),start=performance.now();try{const r=await fetch(url+"?t="+Date.now(),{cache:"no-store",signal:c.signal});if(!r.ok)throw Error("HTTP "+r.status);const ms=Math.round(performance.now()-start);result={time:Date.now(),ok:true,ms,quality:ms<150?"good":ms<400?"fair":"poor"};break}catch{}finally{clearTimeout(timeout)}}const failures=result.ok?0:(d.failures||0)+1,successes=result.ok?(d.successes||0)+1:0,previous=d.confirmedQuality||null;let confirmed=previous;if(!result.ok&&failures>=2)confirmed="offline";if(result.ok&&successes>=2)confirmed=result.quality;await chrome.storage.local.set({latest:result,history:[result,...(d.history||[])].slice(0,100),failures,successes,confirmedQuality:confirmed,monitorHeartbeat:Date.now()});await showResult({result,previous,confirmed,alerts:d.alerts!==false,qualityAlerts:d.qualityAlerts!==false});await telegramState(previous,confirmed,result);await queueMeasurement(result)}catch(e){await chrome.storage.local.set({monitorError:String(e)})}finally{busy=false}}async function showResult({result,previous,confirmed,alerts,qualityAlerts}){await chrome.action.setBadgeText({text:confirmed==="offline"?"OFF":result.ok?String(result.ms):"…"});await chrome.action.setBadgeBackgroundColor({color:{good:"#22c55e",fair:"#f59e0b",poor:"#ef4444",offline:"#64748b"}[confirmed]||"#64748b"});if(previous&&confirmed!==previous&&alerts&&(previous==="offline"||confirmed==="offline"||qualityAlerts))await chrome.notifications.create({type:"basic",iconUrl:"icon32.png",title:confirmed==="offline"?"KNJ: Internet sin respuesta":previous==="offline"?"KNJ: Internet recuperado":"KNJ: cambio de calidad",message:confirmed==="offline"?"Dos comprobaciones sin respuesta":"Latencia HTTP: "+result.ms+" ms",priority:confirmed==="offline"||previous==="offline"?2:0})}async function ensureMonitor(){if(creating)return creating;creating=(async()=>{const {enabled=true}=await chrome.storage.local.get("enabled");if(!enabled)return;if(!(await chrome.offscreen.hasDocument()))await chrome.offscreen.createDocument({url:"monitor.html",reasons:["WORKERS"],justification:"Ejecutar comprobaciones de conectividad periódicas"})})();try{await creating;await chrome.storage.local.remove("monitorError")}catch(e){await chrome.storage.local.set({monitorError:"Monitor automático: "+String(e)})}finally{creating=null}}async function start(){await chrome.alarms.create("watchdog",{periodInMinutes:0.5});await measure();await ensureMonitor()}chrome.runtime.onInstalled.addListener(async()=>{const {enabled}=await chrome.storage.local.get("enabled");if(enabled===undefined)await chrome.storage.local.set({enabled:true,alerts:true,qualityAlerts:true});await start()});chrome.runtime.onStartup.addListener(start);chrome.alarms.onAlarm.addListener(async a=>{if(a.name!=="watchdog")return;const d=await chrome.storage.local.get(["enabled","latest"]);if(d.enabled===false)return;if(!d.latest?.time||Date.now()-d.latest.time>15000)await measure();await ensureMonitor();await syncMeasurements()});chrome.runtime.onMessage.addListener((m,s,reply)=>{(async()=>{if(m.type==="RESULT")await showResult(m);if(m.type==="TICK")await measure();if(m.type==="DB_SYNC"){const d=await chrome.storage.local.get(["dbEnabled","dbApiKey","authToken","latest"]);if(!d.dbEnabled||!(d.authToken||d.dbApiKey)){reply({ok:false,error:"Iniciá sesión y activá PostgreSQL"});return}if(d.latest){const q=await chrome.storage.local.get("dbQueue");if(!(q.dbQueue||[]).some(x=>x.time===d.latest.time)){await chrome.storage.local.set({dbQueue:[...(q.dbQueue||[]),d.latest].slice(-2000)})}}reply(await syncMeasurements());return}if(m.type==="TELEGRAM_TEST"){const sent=await telegramSend("test");reply(sent);return}if(m.type==="TEST"){await measure();await ensureMonitor()}if(m.type==="ENSURE")await start();if(m.type==="TOGGLE"){await chrome.storage.local.set({enabled:m.enabled,failures:0,successes:0,confirmedQuality:null});if(m.enabled)await start();else{await chrome.alarms.clear("watchdog");if(await chrome.offscreen.hasDocument())await chrome.offscreen.closeDocument();await chrome.action.setBadgeText({text:""})}}reply({ok:true})})().catch(e=>reply({ok:false,error:String(e)}));return true});