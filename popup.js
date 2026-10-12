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
  if(!d.authToken||!d.dbDeviceId)throw Error("Iniciá sesión para ver las mediciones guardadas");
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
  drawOscillation(body.oscillation||[]);
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
  if($("statsPanel").open)loadStats();
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
 $("latencyChart").replaceChildren();$("oscillationSummary").textContent="";$("statsStatus").textContent="Iniciá sesión para consultar el historial";
 if(authToken)fetch("https://connection-smoky.vercel.app/api/auth",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+authToken},body:JSON.stringify({action:"logout"})}).catch(()=>{});
});
authView();
if($("statsPanel").open)loadStats();

function drawOscillation(points){
 const svg=$("latencyChart"),ns="http://www.w3.org/2000/svg";svg.replaceChildren();
 const add=(tag,attrs,parent=svg)=>{const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));parent.append(e);return e};
 const valid=points.filter(p=>p.avg_ms!=null&&Number(p.online_samples)>0);
 if(!points.length||!valid.length){$("oscillationSummary").textContent=points.length?"No hay mediciones de latencia con respuesta en este período":"No hay mediciones guardadas en este período";return}
 const maximum=Math.max(...valid.map(p=>Number(p.max_ms??p.avg_ms)));
 const cap=Math.max(50,Math.ceil(maximum*1.1/25)*25),W=600,H=210,left=45,right=12,top=12,bottom=33,w=W-left-right,h=H-top-bottom;
 const x=i=>left+(points.length===1?w/2:i*w/(points.length-1));
 const y=v=>top+h-Math.max(0,Math.min(cap,Number(v)))/cap*h;
 for(let k=0;k<=4;k++){const v=Math.round(cap*k/4);add("line",{x1:left,y1:y(v),x2:W-right,y2:y(v),stroke:"#304865"});add("text",{x:2,y:y(v)+4,fill:"#b9c8e2","font-size":12}).textContent=v+" ms"}
 let last=null,spikes=0,offline=0,largestSwing=0;
 points.forEach((p,i)=>{
  const xx=x(i),up=Number(p.online_samples||0),total=Number(p.samples||0);
  if(!up){offline++;add("line",{x1:xx,y1:top,x2:xx,y2:top+h,stroke:"#fb7185","stroke-width":3});last=null;return}
  const avg=Number(p.avg_ms),lo=Number(p.min_ms),hi=Number(p.max_ms),swing=hi-lo;largestSwing=Math.max(largestSwing,swing);
  if(hi>=400)spikes++;
  const color=hi>=400?"#fb7185":hi>=150?"#fbbf24":"#4ade80";
  // Siempre mostrar el rango real, incluso cuando haya cientos de intervalos.
  const width=Math.max(1,Math.min(6,w/points.length*.65));
  const range=add("line",{x1:xx,y1:y(hi),x2:xx,y2:y(lo),stroke:color,"stroke-width":width,opacity:.9});
  const tip=new Date(p.bucket).toLocaleString()+" | mínimo "+lo+" ms | promedio "+avg+" ms | máximo "+hi+" ms | oscilación "+swing+" ms | "+up+"/"+total+" respuestas";
  add("title",{} ,range).textContent=tip;
  if(last)add("line",{x1:last.x,y1:last.y,x2:xx,y2:y(avg),stroke:"#60a5fa","stroke-width":2,opacity:.95});
  const dot=add("circle",{cx:xx,cy:y(avg),r:points.length>180?1.4:2.7,fill:"#e0f2fe"});add("title",{},dot).textContent=tip;
  last={x:xx,y:y(avg)};
 });
 if(points.length){const first=new Date(points[0].bucket),lastDate=new Date(points[points.length-1].bucket);add("text",{x:left,y:H-8,fill:"#a8bbd4","font-size":12}).textContent=first.toLocaleString();add("text",{x:W-right,y:H-8,fill:"#a8bbd4","font-size":12,"text-anchor":"end"}).textContent=lastDate.toLocaleString()}
 $("oscillationSummary").textContent="Rango de latencia (líneas de colores): mínimo a máximo por intervalo. Línea azul: promedio. Mayor oscilación: "+largestSwing+" ms · Intervalos con picos ≥400 ms: "+spikes+" · Sin respuesta: "+offline+".";
}
