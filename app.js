const db = supabase.createClient(window.TRIPMATE_SUPABASE.url, window.TRIPMATE_SUPABASE.publishableKey);
const $ = id => document.getElementById(id);
let isAdmin = false;
let trip = {};
const data = {members:[], contributions:[], expenses:[], itinerary:[], bookings:[], rooms:[], transport:[], gallery:[]};

const cfg = {
  members:{label:"Member",table:"members",fields:[
    ["name","Name","text",true],["gender","Gender","text"],["group_name","Group","text"],["phone","Phone","text"],["email","Email","email"],
    ["expected_contribution","Expected contribution","number"],["paid_amount","Paid amount","number"],
    ["payment_status","Payment status","select",false,["Pending","Partial","Paid"]],["notes","Notes","textarea"]
  ]},
  contributions:{label:"Payment",table:"contributions",fields:[
    ["member_id","Member","members",true],["amount","Amount","number",true],["paid_at","Paid at","datetime-local"],
    ["payment_method","Payment method","select",false,["Cash","UPI","Bank Transfer","Card","Other"]],["reference","Reference","text"],["notes","Notes","textarea"]
  ]},
  expenses:{label:"Expense",table:"expenses",fields:[
    ["title","Title","text",true],["category","Category","select",false,["Accommodation","Food","Transport","Activities","Tickets","Other"]],
    ["amount","Amount","number",true],["expense_date","Date","date"],["paid_by","Paid by","text"],["notes","Notes","textarea"]
  ]},
  itinerary:{label:"Itinerary item",table:"itinerary",fields:[
    ["day_number","Day","number",true],["title","Title","text",true],["activity","Activity","text",true],
    ["start_time","Start time","time"],["end_time","End time","time"],["location","Location","text"],["maps_url","Google Maps URL","url"],["notes","Notes","textarea"],["sort_order","Order","number"]
  ]},
  bookings:{label:"Booking",table:"bookings",fields:[
    ["property_name","Property","text",true],["booking_reference","Booking reference","text"],["check_in","Check-in","datetime-local"],
    ["check_out","Check-out","datetime-local"],["booking_amount","Booking amount","number"],["status","Status","select",false,["Confirmed","Pending","Cancelled"]],["notes","Notes","textarea"]
  ]},
  rooms:{label:"Room",table:"rooms",fields:[
    ["booking_id","Booking","bookings"],["room_number","Room number","text"],["room_type","Room type","text"],["capacity","Capacity","number"],["occupants","Occupants","text"],["notes","Notes","textarea"]
  ]},
  transport:{label:"Transport",table:"transport",fields:[
    ["vehicle_type","Vehicle type","text"],["vehicle_number","Vehicle number","text"],["driver_name","Driver name","text"],["driver_phone","Driver phone","text"],
    ["pickup_location","Pickup location","text"],["pickup_time","Pickup time","datetime-local"],["fuel_expense","Fuel expense","number"],["toll_expense","Toll expense","number"],["notes","Notes","textarea"]
  ]},
  gallery:{label:"Gallery photo",table:"gallery",fields:[
    ["title","Title","text"],["image_url","Image URL","url",true],["is_approved","Approval","select",true,["true","false"]]
  ]}
};

function money(n){return "₹"+Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:2});}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function toast(message){let t=$("tmToast");if(!t){t=document.createElement("div");t.id="tmToast";document.body.appendChild(t);}t.textContent=message;t.className="tm-toast show";clearTimeout(window.tmToastTimer);window.tmToastTimer=setTimeout(()=>t.className="tm-toast",2600);}
function setLoading(on){let x=$("tmLoading");if(!x){x=document.createElement("div");x.id="tmLoading";x.className="tm-loading";x.textContent="Syncing with Supabase…";document.body.appendChild(x);}x.classList.toggle("hidden",!on);}
function status(v){return '<span class="tm-status">'+esc(v||"—")+"</span>";}
function actions(table,id){return isAdmin?'<div class="tm-actions"><button type="button" data-edit="'+table+'" data-id="'+id+'">Edit</button><button type="button" class="danger" data-delete="'+table+'" data-id="'+id+'">Delete</button></div>':"";}

function injectStyle(){
 if($("tmStyle"))return;
 const s=document.createElement("style");s.id="tmStyle";
 s.textContent=".tm-toast{position:fixed;right:22px;bottom:22px;background:#111a30;color:#fff;padding:12px 16px;border-radius:10px;opacity:0;transform:translateY(8px);transition:.2s;z-index:9999}.tm-toast.show{opacity:1;transform:none}.tm-loading{position:fixed;right:20px;top:18px;background:#111a30;color:#fff;padding:9px 13px;border-radius:9px;z-index:9999}.tm-adminbar{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;background:#f7f9fd;color:#172039;border:1px solid #dfe5ef;border-radius:12px;padding:12px;margin-bottom:14px}.tm-adminbar button,.tm-primary{border:0;border-radius:8px;padding:9px 13px;background:#315efb;color:#fff;cursor:pointer}.tm-actions{display:flex;gap:6px;margin-top:8px}.tm-actions button{border:1px solid #ccd4e2;background:#fff;color:#172039;border-radius:7px;padding:6px 9px;cursor:pointer}.tm-actions .danger{color:#b42318}.tm-modal{position:fixed;inset:0;background:#071022b8;display:grid;place-items:center;padding:18px;z-index:10000}.tm-modal-card{background:#fff;color:#172039;width:min(720px,100%);max-height:92vh;overflow:auto;border-radius:18px;padding:24px}.tm-modal-head{display:flex;justify-content:space-between;align-items:center}.tm-modal-head button{border:0;background:#edf1f7;border-radius:8px;font-size:20px;cursor:pointer}.tm-form{display:grid;grid-template-columns:1fr 1fr;gap:13px;margin-top:18px}.tm-form label{display:grid;gap:6px;font-size:12px;font-weight:700}.tm-form input,.tm-form select,.tm-form textarea{width:100%;padding:10px;border:1px solid #ccd4e2;border-radius:8px}.tm-form .wide{grid-column:1/-1}.tm-form-actions{grid-column:1/-1;display:flex;justify-content:flex-end;gap:8px}.tm-muted{color:#68758c}.tm-hidden{display:none!important}@media(max-width:700px){.tm-form{grid-template-columns:1fr}.tm-form .wide{grid-column:auto}}";
 document.head.appendChild(s);
}

function setupTabs(){
 document.querySelectorAll(".tab").forEach(btn=>{
   btn.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".panel").forEach(x=>x.classList.remove("active"));btn.classList.add("active");const p=$(btn.dataset.tab);if(p)p.classList.add("active");};
 });
}

function setupToolbars(){
 const defs={
  overview:[["Export finance CSV","export"],["＋ Add expense","expenses"],["＋ Add member","members"]],
  itinerary:[["＋ Add activity","itinerary"]],
  finance:[["＋ Record payment","contributions"],["＋ Add expense","expenses"]],
  members:[["＋ Add member","members"]],
  booking:[["＋ Add booking","bookings"],["＋ Add room","rooms"]],
  transport:[["＋ Add vehicle","transport"]],
  gallery:[["＋ Add photo","gallery"]]
 };
 Object.entries(defs).forEach(([tab,buttons])=>{
   const p=$(tab);if(!p||p.querySelector(".tm-adminbar"))return;
   const bar=document.createElement("div");bar.className="tm-adminbar";
   bar.innerHTML="<strong>"+({overview:"Operations Center",itinerary:"Trip Planner",finance:"Financial Operations",members:"Member Directory",booking:"Bookings & Rooms",transport:"Transport Logistics",gallery:"Gallery Moderation"}[tab])+"</strong><div>"+buttons.map(b=>'<button type="button" data-add="'+b[1]+'">'+b[0]+"</button>").join("")+"</div>";
   p.prepend(bar);
 });
 if(isAdmin){
   const tabs=document.querySelector(".tabs");
   if(tabs&&!document.querySelector('[data-tab="settings"]')){const b=document.createElement("button");b.className="tab";b.dataset.tab="settings";b.textContent="⚙ Admin";tabs.appendChild(b);}
   if(!$("settings")){const sec=document.createElement("section");sec.id="settings";sec.className="panel";sec.innerHTML='<div class="card"><h3>Trip Administration</h3><form id="tripSettingsForm" class="tm-form"></form></div><div class="card" style="margin-top:16px"><h3>Administrator capabilities</h3><p>Create, edit and delete operational records, moderate gallery content, update trip settings and export finance data.</p></div>';document.querySelector(".container").appendChild(sec);}
 }
 setupTabs();
}

async function start(){
 injectStyle();
 const userResult=await db.auth.getUser();
 const user=userResult.data?.user;
 if(userResult.error){console.error("Auth user lookup failed",userResult.error);return;}
 if(!user)return;
 $("loginCard").classList.add("hidden");$("app").classList.remove("hidden");$("signOut").classList.remove("hidden");$("userEmail").textContent=user.email||"";
 const admin=await db.rpc("current_user_is_admin");
 if(admin.error){
   console.error("Admin role lookup failed",admin.error);
   isAdmin=false;
   toast("Admin verification failed: "+admin.error.message);
 }else{
   isAdmin=admin.data===true;
 }
 const badge=$("adminBadge");if(badge)badge.classList.toggle("hidden",!isAdmin);
 setupToolbars();
 await loadAll();
}
async function loadAll(){
 setLoading(true);
 const names=Object.keys(data);
 const results=await Promise.all(names.map(n=>db.from(cfg[n].table).select("*")));
 results.forEach((r,i)=>{if(r.error)console.warn(cfg[names[i]].table,r.error);data[names[i]]=r.data||[];});
 const r=await db.from("trip_settings").select("*").limit(1).maybeSingle();
 if(r.error)toast("Trip settings error: "+r.error.message);
 trip=r.data||{};
 render();renderSettings();setLoading(false);
}

function render(){
 const expected=+trip.expected_amount||0, collected=+trip.collected_amount||0;
 const expenses=data.expenses.reduce((a,x)=>a+(+x.amount||0),0);
 $("tripName").textContent=trip.trip_name||"TRIPMATE";
 $("tripDates").textContent=[trip.start_date,trip.end_date].filter(Boolean).join(" → ")||"Dates not configured";
 $("expected").textContent=money(expected);$("collected").textContent=money(collected);$("pending").textContent=money(Math.max(0,expected-collected));$("expenses").textContent=money(expenses);$("balance").textContent=money(collected-expenses);
 $("overviewText").innerHTML="<p><b>Expected:</b> "+money(expected)+"</p><p><b>Collected:</b> "+money(collected)+"</p><p><b>Pending:</b> "+money(Math.max(0,expected-collected))+"</p><p><b>Expenses:</b> "+money(expenses)+"</p>";
 $("membersList").innerHTML=memberHTML();$("contributionsList").innerHTML=paymentHTML();$("expensesList").innerHTML=expenseHTML();
 $("itineraryList").innerHTML=itineraryHTML();$("bookingList").innerHTML=bookingHTML();$("roomsList").innerHTML=roomHTML();$("transportList").innerHTML=transportHTML();$("galleryList").innerHTML=galleryHTML();
}

function memberHTML(){if(!data.members.length)return '<p class="tm-muted">No members yet.</p>';return data.members.map(x=>'<div class="item"><b>'+esc(x.name)+'</b> · '+status(x.payment_status)+'<br><span class="tm-muted">'+esc(x.group_name||"No group")+' · '+esc(x.phone||"No phone")+' · Paid '+money(x.paid_amount)+'</span>'+actions("members",x.id)+"</div>").join("");}
function paymentHTML(){if(!data.contributions.length)return '<p class="tm-muted">No payments recorded.</p>';return data.contributions.map(x=>{const m=data.members.find(y=>y.id===x.member_id);return '<div class="item"><b>'+money(x.amount)+'</b> · '+esc(m?.name||"Unknown member")+'<br><span class="tm-muted">'+esc(x.payment_method||"Payment")+' · '+esc(x.paid_at||"")+'</span>'+actions("contributions",x.id)+"</div>";}).join("");}
function expenseHTML(){if(!data.expenses.length)return '<p class="tm-muted">No expenses recorded.</p>';return data.expenses.map(x=>'<div class="item"><b>'+esc(x.title)+'</b> · '+money(x.amount)+'<br><span class="tm-muted">'+esc(x.category||"Other")+' · '+esc(x.expense_date||"")+'</span>'+actions("expenses",x.id)+"</div>").join("");}
function itineraryHTML(){if(!data.itinerary.length)return '<p class="tm-muted">No itinerary activities.</p>';return [...data.itinerary].sort((a,b)=>(a.day_number||0)-(b.day_number||0)||(a.sort_order||0)-(b.sort_order||0)).map(x=>'<div class="card" style="margin-bottom:10px"><b>Day '+esc(x.day_number)+' · '+esc(x.title)+'</b><p>'+esc(x.activity)+'</p><span class="tm-muted">⏱ '+esc(x.start_time||"")+' '+(x.end_time?"– "+esc(x.end_time):"")+' · 📍 '+esc(x.location||"—")+'</span>'+(x.maps_url?' · <a href="'+esc(x.maps_url)+'" target="_blank" rel="noopener">Maps</a>':"")+actions("itinerary",x.id)+"</div>").join("");}
function bookingHTML(){if(!data.bookings.length)return '<p class="tm-muted">No bookings.</p>';return data.bookings.map(x=>'<div class="item"><b>'+esc(x.property_name)+'</b> · '+status(x.status)+'<br><span class="tm-muted">Ref '+esc(x.booking_reference||"—")+' · '+money(x.booking_amount)+' · '+esc(x.check_in||"")+' → '+esc(x.check_out||"")+'</span>'+actions("bookings",x.id)+"</div>").join("");}
function roomHTML(){if(!data.rooms.length)return '<p class="tm-muted">No rooms allocated.</p>';return data.rooms.map(x=>'<div class="item"><b>Room '+esc(x.room_number||"—")+'</b> · '+esc(x.room_type||"")+'<br><span class="tm-muted">Capacity '+esc(x.capacity||"—")+' · '+esc(x.occupants||"")+'</span>'+actions("rooms",x.id)+"</div>").join("");}
function transportHTML(){if(!data.transport.length)return '<p class="tm-muted">No transport planned.</p>';return data.transport.map(x=>'<div class="card" style="margin-bottom:10px"><b>'+esc(x.vehicle_type||"Vehicle")+' · '+esc(x.vehicle_number||"")+'</b><p>Driver: '+esc(x.driver_name||"—")+' · '+esc(x.driver_phone||"—")+'</p><span class="tm-muted">Pickup '+esc(x.pickup_location||"—")+' · '+esc(x.pickup_time||"—")+' · Fuel '+money(x.fuel_expense)+' · Toll '+money(x.toll_expense)+'</span>'+actions("transport",x.id)+"</div>").join("");}
function galleryHTML(){if(!data.gallery.length)return '<p class="tm-muted">No gallery items.</p>';return data.gallery.map(x=>'<div class="card" style="display:inline-block;width:31%;margin:1%;vertical-align:top"><img src="'+esc(x.image_url)+'" style="width:100%;height:180px;object-fit:cover;border-radius:10px" alt="'+esc(x.title||"Trip photo")+'"><p><b>'+esc(x.title||"Untitled")+'</b> · '+status(x.is_approved?"Approved":"Pending")+'</p>'+actions("gallery",x.id)+"</div>").join("");}

function renderSettings(){
 const f=$("tripSettingsForm");if(!f||!isAdmin)return;
 f.innerHTML='<label class="wide">Trip name<input name="trip_name" value="'+esc(trip.trip_name||"")+'" required></label><label>Start date<input name="start_date" type="date" value="'+esc(trip.start_date||"")+'"></label><label>End date<input name="end_date" type="date" value="'+esc(trip.end_date||"")+'"></label><label>Expected amount<input name="expected_amount" type="number" value="'+(trip.expected_amount||0)+'"></label><label>Collected amount<input name="collected_amount" type="number" value="'+(trip.collected_amount||0)+'"></label><div class="tm-form-actions"><button class="tm-primary">Save settings</button></div>';
 f.onsubmit=async e=>{e.preventDefault();const o=Object.fromEntries(new FormData(f));o.expected_amount=Number(o.expected_amount||0);o.collected_amount=Number(o.collected_amount||0);const r=await db.from("trip_settings").update(o).eq("id",trip.id);if(r.error)return toast(r.error.message);toast("Trip settings saved");await loadAll();};
}

function fieldHTML(f,obj){
 const [key,label,type,required,options]=f;let value=obj[key]??"";let input="";
 if(type==="select")input='<select name="'+key+'" '+(required?"required":"")+'><option value="">Select…</option>'+options.map(o=>'<option value="'+esc(o)+'" '+(String(value)===String(o)?"selected":"")+'>'+esc(o)+"</option>").join("")+"</select>";
 else if(type==="members")input='<select name="'+key+'" required><option value="">Select member…</option>'+data.members.map(m=>'<option value="'+m.id+'" '+(String(value)===String(m.id)?"selected":"")+'>'+esc(m.name)+"</option>").join("")+"</select>";
 else if(type==="bookings")input='<select name="'+key+'"><option value="">No booking</option>'+data.bookings.map(b=>'<option value="'+b.id+'" '+(String(value)===String(b.id)?"selected":"")+'>'+esc(b.property_name)+"</option>").join("")+"</select>";
 else if(type==="textarea")input='<textarea name="'+key+'" rows="3">'+esc(value)+"</textarea>";
 else {if(type==="datetime-local"&&value){const d=new Date(value);if(!isNaN(d))value=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);}input='<input name="'+key+'" type="'+type+'" value="'+esc(value)+'" '+(required?"required":"")+'>';}
 return '<label class="'+(type==="textarea"?"wide":"")+'">'+label+input+"</label>";
}

function openForm(table,id){
 if(!isAdmin){toast("Administrator access required.");return;}
 const c=cfg[table],obj=id?data[table].find(x=>String(x.id)===String(id)):{};
 const modal=document.createElement("div");modal.className="tm-modal";modal.id="tmModal";
 modal.innerHTML='<div class="tm-modal-card"><div class="tm-modal-head"><div><small>TRIPMATE ADMIN</small><h2>'+(id?"Edit ":"Add ")+c.label+'</h2></div><button type="button" id="tmClose">×</button></div><form id="tmForm" class="tm-form">'+c.fields.map(f=>fieldHTML(f,obj)).join("")+'<div class="tm-form-actions"><button type="button" id="tmCancel">Cancel</button><button class="tm-primary">Save record</button></div></form></div>';
 document.body.appendChild(modal);
 $("tmClose").onclick=closeForm;$("tmCancel").onclick=closeForm;$("tmForm").onsubmit=e=>saveForm(e,table,id);
}
function closeForm(){const m=$("tmModal");if(m)m.remove();}

async function saveForm(e,table,id){
 e.preventDefault();const form=e.target;const obj=Object.fromEntries(new FormData(form));
 cfg[table].fields.forEach(f=>{const key=f[0],type=f[2];if(type==="number"&&obj[key]!=="" )obj[key]=Number(obj[key]);if(type==="datetime-local"&&obj[key])obj[key]=new Date(obj[key]).toISOString();if(key==="is_approved")obj[key]=obj[key]==="true";});
 if(table==="gallery"){const u=(await db.auth.getUser()).data.user;if(u)obj.uploaded_by=u.id;}
 const r=id?await db.from(cfg[table].table).update(obj).eq("id",id):await db.from(cfg[table].table).insert(obj);
 if(r.error){toast("Save failed: "+r.error.message);return;}
 closeForm();toast(id?"Record updated":"Record created");await loadAll();
}
async function removeRecord(table,id){
 if(!isAdmin)return toast("Administrator access required.");
 if(!confirm("Delete this record permanently?"))return;
 const r=await db.from(cfg[table].table).delete().eq("id",id);
 if(r.error){toast("Delete failed: "+r.error.message);return;}
 toast("Record deleted");await loadAll();
}
function exportFinance(){
 const rows=[["Type","Name/Title","Amount","Date","Details"]];
 data.contributions.forEach(x=>rows.push(["Payment",data.members.find(m=>m.id===x.member_id)?.name||"Unknown",x.amount,x.paid_at||"",x.payment_method||""]));
 data.expenses.forEach(x=>rows.push(["Expense",x.title,x.amount,x.expense_date||"",x.category||""]));
 const csv=rows.map(r=>r.map(v=>'"'+String(v??"").replaceAll('"','""')+'"').join(",")).join("\n");
 const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="TRIPMATE-finance.csv";document.body.appendChild(a);a.click();a.remove();
}

document.addEventListener("click",e=>{
 const add=e.target.closest("[data-add]");if(add){if(add.dataset.add==="export")exportFinance();else openForm(add.dataset.add);return;}
 const edit=e.target.closest("[data-edit]");if(edit){openForm(edit.dataset.edit,edit.dataset.id);return;}
 const del=e.target.closest("[data-delete]");if(del){removeRecord(del.dataset.delete,del.dataset.id);return;}
});

async function auth(signup){
 const email=$("email").value.trim(),password=$("password").value;
 if(!email||password.length<6){$("authMsg").textContent="Enter email and a password of at least 6 characters.";return;}
 const r=signup?await db.auth.signUp({email,password}):await db.auth.signInWithPassword({email,password});
 $("authMsg").textContent=r.error?r.error.message:(signup?"Account created. Check your email if confirmation is enabled.":"Signed in.");
 if(!r.error&&!signup)await start();
}
$("signIn").onclick=()=>auth(false);
$("signUp").onclick=()=>auth(true);
$("signOut").onclick=async()=>{await db.auth.signOut();location.reload();};
db.auth.onAuthStateChange((event,session)=>{if(event==="SIGNED_IN"&&session)start();});
start();
