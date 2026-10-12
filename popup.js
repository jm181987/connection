const $=id=>document.getElementById(id);function render(d){$("enabled").checked=d.enabled!==false;$("alerts").checked=d.alerts!==false;$("qualityAlerts").checked=d.qualityAlerts!==false;const q=d.latest?.quality;const age=d.latest?.time?Date.now()-d.latest.time:Infinity;$("lastCheck").textContent="Última prueba: "+(d.latest?.time?new Date(d.latest.time).toLocaleTimeString():"—")+(d.enabled!==false&&age>12000?" · Monitor sin actividad"+(d.monitorError?" ("+d.monitorError+")":""):"");$("status").textContent=d.enabled===false?"Monitoreo detenido":({good:"● Conexión buena",fair:"● Conexión regular",poor:"● Conexión mala",offline:"● Sin respuesta"}[q]||"Esperando medición…");$("status").style.color=({good:"#4ade80",fair:"#fbbf24",poor:"#fb7185",offline:"#94a3b8"}[q]||"#94a3b8");$("latency").textContent=d.latest?.ok?d.latest.ms+" ms":"—";$("history").replaceChildren();for(const x of (d.history||[]).slice(0,15)){const li=document.createElement("li"),time=document.createElement("span"),value=document.createElement("span");time.textContent=new Date(x.time).toLocaleString();value.textContent=x.ok?x.ms+" ms":"Sin respuesta";li.append(time,value);$("history").append(li)}}async function refresh(){render(await chrome.storage.local.get(["enabled","alerts","qualityAlerts","latest","history","monitorError"]))}$("enabled").addEventListener("change",async e=>{const r=await chrome.runtime.sendMessage({type:"TOGGLE",enabled:e.target.checked});if(!r?.ok)$("lastCheck").textContent="Error: "+(r?.error||"No se pudo activar");refresh()});for(const key of ["alerts","qualityAlerts"])$(key).addEventListener("change",async e=>{await chrome.storage.local.set({[key]:e.target.checked})});$("test").addEventListener("click",async()=>{$("test").disabled=true;try{const r=await chrome.runtime.sendMessage({type:"TEST"});if(!r?.ok)throw Error(r?.error||"No se pudo probar");await refresh()}catch(e){$("lastCheck").textContent="Error: "+e.message}finally{$("test").disabled=false}});chrome.storage.onChanged.addListener(refresh);chrome.runtime.sendMessage({type:"ENSURE"}).catch(()=>{});refresh();setInterval(refresh,3000);async function telegramLoad(){
 const {authToken}=await chrome.storage.local.get("authToken");
 if(!authToken){$("telegramStatus").textContent="Iniciá sesión para configurar Telegram";return}
 try{
  const r=await fetch("https://connection-smoky.vercel.app/api/telegram",{headers:{Authorization:"Bearer "+authToken}});
  const b=await r.json();if(!r.ok)throw Error(b.error||"Error HTTP "+r.status);
  $("telegramEnabled").checked=b.enabled;
  $("telegramChatId").value=b.chatId||"";
  $("telegramToken").value="";
  $("telegramToken").placeholder=b.configured?"Token guardado de forma cifrada · dejá vacío para conservarlo":"Token del bot";
  await chrome.storage.local.set({telegramEnabled:b.enabled});
  $("telegramStatus").textContent=b.configured?"Configuración de la cuenta cargada":"Todavía no configuraste un bot";
 }catch(e){$("telegramStatus").textContent="Error: "+e.message}
}
async function telegramSave(){
 const {authToken}=await chrome.storage.local.get("authToken");
 if(!authToken)throw Error("Iniciá sesión primero");
 const enabled=$("telegramEnabled").checked,chatId=$("telegramChatId").value.trim(),botToken=$("telegramToken").value.trim();
 const r=await fetch("https://connection-smoky.vercel.app/api/telegram",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+authToken},body:JSON.stringify({action:"save",enabled,chatId,botToken})});
 const b=await r.json();if(!r.ok)throw Error(b.error||"Error HTTP "+r.status);
 await chrome.storage.local.set({telegramEnabled:enabled});
 await chrome.storage.local.remove(["telegramToken","telegramChatId"]);
 $("telegramToken").value="";
 $("telegramStatus").textContent="Configuración cifrada y guardada en tu cuenta";
}
$("telegramSave").addEventListener("click",async()=>{try{await telegramSave()}catch(e){$("telegramStatus").textContent="Error: "+e.message}});
$("telegramTest").addEventListener("click",async()=>{
 try{await telegramSave();$("telegramStatus").textContent="Enviando prueba…";const r=await chrome.runtime.sendMessage({type:"TELEGRAM_TEST"});$("telegramStatus").textContent=r?.ok?"Mensaje enviado a Telegram":"Error: "+(r?.error||"Sin respuesta")}catch(e){$("telegramStatus").textContent="Error: "+e.message}
});
telegramLoad();
async function dbLoad(){const d=await chrome.storage.local.get(["dbEnabled","dbStatus","dbPending"]);$("dbEnabled").checked=d.dbEnabled===true;$("dbStatus").textContent=(d.dbStatus||"Sin sincronizaciones")+(d.dbPending?" · Pendientes: "+d.dbPending:"")}
async function dbSave(){await chrome.storage.local.set({dbEnabled:$("dbEnabled").checked,});$("dbStatus").textContent="Configuración guardada solo en Chrome"}
$("dbSave").addEventListener("click",dbSave);
$("dbSync").addEventListener("click",async()=>{await dbSave();$("dbSync").disabled=true;$("dbStatus").textContent="Sincronizando…";try{const r=await chrome.runtime.sendMessage({type:"DB_SYNC"});$("dbStatus").textContent=r?.ok?(r.inProgress?"Envío automático en curso. Reintentá en unos segundos.":"API respondió · Procesadas: "+r.sent+" · Insertadas en PostgreSQL: "+(r.inserted??"—")+" · Pendientes: "+(r.pending??"—")):"Error: "+(r?.error||"Sin respuesta")}catch(e){$("dbStatus").textContent="Error: "+e.message}finally{$("dbSync").disabled=false}});
dbLoad();

async function loadStats(){
 const button=$("statsRefresh");button.disabled=true;$("statsStatus").textContent="Consultando PostgreSQL…";
 try{
  const d=await chrome.storage.local.get(["dbEnabled","authToken","dbDeviceId"]);
  if(!d.dbEnabled||!d.authToken||!d.dbDeviceId)throw Error("Iniciá sesión y activá PostgreSQL primero");
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
  let response;
  try{response=await fetch("https://connection-smoky.vercel.app/api/stats?deviceId="+encodeURIComponent(d.dbDeviceId)+"&days="+$("statsDays").value,{headers:{Authorization:"Bearer "+d.authToken},signal:controller.signal})}finally{clearTimeout(timer)}
  const body=await response.json().catch(()=>({}));
  if(!response.ok)throw Error("API "+response.status+" · "+(body.error||"Sin respuesta")+(body.sqlstate?" ("+body.sqlstate+")":""));
  const t=body.totals,n=Number(t.samples||0),up=Number(t.online_samples||0);
  $("statsAvailability").textContent=n?(100*up/n).toFixed(2)+"%":"—";
  $("statsLatency").textContent=t.avg_latency==null?"—":t.avg_latency+" ms";
  $("statsOutages").textContent=String(t.outage_count||0);
  const seconds=Number(t.outage_seconds||0);
  $("statsDuration").textContent=seconds>=3600?(seconds/3600).toFixed(1)+" h":seconds>=60?Math.round(seconds/60)+" min":seconds+" s";
  $("statsBars").replaceChildren();
  const series=body.series||[];
  const step=Math.max(1,Math.ceil(series.length/48));
  for(let i=0;i<series.length;i+=step){
   const chunk=series.slice(i,i+step),total=chunk.reduce((a,x)=>a+Number(x.samples),0),online=chunk.reduce((a,x)=>a+Number(x.online_samples),0),pct=total?online/total*100:0;
   const bar=document.createElement("div");bar.className="stats-bar";bar.style.height=Math.max(3,pct)+"%";bar.style.background=pct>=99?"#4ade80":pct>=90?"#fbbf24":"#fb7185";bar.title=new Date(chunk[0].bucket).toLocaleString()+" · "+pct.toFixed(1)+"% · "+total+" mediciones";$("statsBars").append(bar);
  }
  $("statsNote").textContent="Mediciones: "+n+" · Última registrada: "+(t.last_sample?new Date(t.last_sample).toLocaleString():"—")+" · No se computan intervalos sin muestras.";
  $("statsStatus").textContent=n?"Datos cargados correctamente":"Sin mediciones en este período";
 }catch(e){$("statsStatus").textContent="Error: "+(e.name==="AbortError"?"Tiempo de espera agotado":e.message)}finally{button.disabled=false}
}
$("statsRefresh").addEventListener("click",loadStats);
$("statsDays").addEventListener("change",loadStats);
$("statsPanel").addEventListener("toggle",()=>{if($("statsPanel").open)loadStats()});

async function authView(){
 const d=await chrome.storage.local.get(["authToken","authUsername"]);
 $("accountLoggedOut").hidden=!!d.authToken;
 $("accountLoggedIn").hidden=!d.authToken;
 $("authIdentity").textContent=d.authToken?"Conectado como "+(d.authUsername||"usuario"):"";
}
async function authSubmit(action){
 $("authStatus").textContent="Procesando…";
 try{
  const username=$("authUsername").value.trim(),password=$("authPassword").value;
  const r=await fetch("https://connection-smoky.vercel.app/api/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,username,password})});
  const b=await r.json();
  if(!r.ok)throw Error(b.error+(b.detail?" · "+b.detail:""));
  await chrome.storage.local.set({authToken:b.token,authUsername:b.username,dbEnabled:true});
  await chrome.storage.local.remove("dbApiKey");
  $("authPassword").value="";
  $("authStatus").textContent="Sesión iniciada. PostgreSQL activado.";
  await authView();
  await telegramLoad();
  chrome.runtime.sendMessage({type:"DB_SYNC"}).catch(()=>{});
 }catch(e){$("authStatus").textContent="Error: "+e.message}
}
$("authLogin").addEventListener("click",()=>authSubmit("login"));
$("authRegister").addEventListener("click",()=>authSubmit("register"));
$("authLogout").addEventListener("click",async()=>{
 const {authToken}=await chrome.storage.local.get("authToken");
 await chrome.storage.local.remove(["authToken","authUsername","dbApiKey","telegramToken","telegramChatId","telegramEnabled"]);
 await chrome.storage.local.set({dbEnabled:false});
 await authView();
 $("authStatus").textContent="Sesión cerrada";
 if(authToken)fetch("https://connection-smoky.vercel.app/api/auth",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+authToken},body:JSON.stringify({action:"logout"})}).catch(()=>{});
});
authView();
