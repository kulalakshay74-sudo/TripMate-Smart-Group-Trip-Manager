const db=supabase.createClient(window.TRIPMATE_SUPABASE.url,window.TRIPMATE_SUPABASE.publishableKey);
const $=id=>document.getElementById(id);
let isAdmin=false,trip=null,data={members:[],contributions:[],expenses:[],itinerary:[],bookings:[],rooms:[],transport:[],gallery:[]},authMode="login";
const cfg={
members:{label:"Member",table:"members",fields:[["name","Name","text",1],["gender","Gender","text"],["group_name","Group","text"],["phone","Phone","text"],["email","Email","email"],["expected_contribution","Expected contribution","number"],["paid_amount","Paid amount","number"],["payment_status","Payment status","select",0,["Pending","Partial","Paid"]],["notes","Notes","textarea"]]},
contributions:{label:"Payment",table:"contributions",fields:[["member_id","Member","members",1],["amount","Amount","number",1],["paid_at","Paid at","datetime-local"],["payment_method","Payment method","select",0,["Cash","UPI","Bank Transfer","Card","Other"]],["reference","Reference","text"],["notes","Notes","textarea"]]},
expenses:{label:"Expense",table:"expenses",fields:[["title","Title","text",1],["category","Category","select",0,["Accommodation","Food","Transport","Activities","Tickets","Other"]],["amount","Amount","number",1],["expense_date","Date","date"],["paid_by","Paid by","text"],["notes","Notes","textarea"]]},
itinerary:{label:"Itinerary item",table:"itinerary",fields:[["day_number","Day","number",1],["title","Title","text",1],["activity","Activity","text",1],["start_time","Start time","time"],["end_time","End time","time"],["location","Location","text"],["maps_url","Google Maps URL","url"],["notes","Notes","textarea"],["sort_order","Order","number"]]},
bookings:{label:"Booking",table:"bookings",fields:[["property_name","Property","text",1],["booking_reference","Booking reference","text"],["check_in","Check-in","datetime-local"],["check_out","Check-out","datetime-local"],["booking_amount","Booking amount","number"],["status","Status","select",0,["Confirmed","Pending","Cancelled"]],["notes","Notes","textarea"]]},
rooms:{label:"Room",table:"rooms",fields:[["booking_id","Booking","bookings"],["room_number","Room number","text"],["room_type","Room type","text"],["capacity","Capacity","number"],["occupants","Occupants","text"],["notes","Notes","textarea"]]},
transport:{label:"Transport",table:"transport",fields:[["vehicle_type","Vehicle type","text"],["vehicle_number","Vehicle number","text"],["driver_name","Driver name","text"],["driver_phone","Driver phone","text"],["pickup_location","Pickup location","text"],["pickup_time","Pickup time","datetime-local"],["fuel_expense","Fuel expense","number"],["toll_expense","Toll expense","number"],["notes","Notes","textarea"]]},
gallery:{label:"Gallery photo",table:"gallery",fields:[["title","Title","text"],["image_url","Image URL","url",1],["is_approved","Approval","select",1,["true","false"]]]}
};
function money(n){return "₹"+Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:2})}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function toast(m){let t=$("tmToast");if(!t){t=document.createElement("div");t.id="tmToast";document.body.appendChild(t)}t.textContent=m;t.className="tm-toast show";setTimeout(()=>t.className="tm-toast",2500)}
function loading(v){let x=$("tmLoading");if(!x){x=document.createElement("div");x.id="tmLoading";x.className="tm-loading";x.textContent="Syncing live trip data…";document.body.appendChild(x)}x.classList.toggle("hidden",!v)}
function badge(v){let s=String(v||"").toLowerCase();return '<span class="tm-status '+s+'">'+esc(v||"—")+"</span>"}
function actionBtns(table,id){return isAdmin?'<div class="tm-actions"><button data-tm-edit="'+table+'" data-id="'+id+'">Edit</button><button class="danger" data-tm-delete="'+table+'" data-id="'+id+'">Delete</button></div>':""}
function setTab(id){document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===id));document.querySelectorAll(".panel").forEach(p=>p.classList.toggle("active",p.id===id))}
function ensureProfessionalUI(){
const css=document.createElement("style");css.textContent=".tm-toast{position:fixed;right:25px;bottom:25px;background:#111a30;color:#fff;padding:12px 17px;border-radius:12px;opacity:0;transform:translateY(8px);transition:.2s;z-index:999}.tm-toast.show{opacity:1;transform:none}.tm-loading{position:fixed;top:18px;right:18px;background:#111a30;color:#fff;padding:10px 14px;border-radius:10px;z-index:998}.tm-modal{position:fixed;inset:0;background:#081022aa;display:grid;place-items:center;padding:20px;z-index:1000}.tm-modal-card{background:#fff;width:min(680px,100%);max-height:90vh;overflow:auto;border-radius:20px;padding:24px;box-shadow:0 30px 90px #0004}.tm-modal-head{display:flex;justify-content:space-between;align-items:start}.tm-form{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:18px}.tm-form label{display:grid;gap:6px;font-size:12px;font-weight:700;color:#66718a}.tm-form input,.tm-form select,.tm-form textarea{width:100%;padding:10px;border:1px solid #dbe1eb;border-radius:9px}.tm-wide{grid-column:1/-1}.tm-form-actions{grid-column:1/-1;display:flex;justify-content:flex-end;gap:8px}.tm-actions{display:flex;gap:6px;margin-top:9px}.tm-actions button{border:1px solid #dbe1eb;background:#fff;border-radius:7px;padding:6px 9px;cursor:pointer}.tm-actions .danger{color:#b73535}.tm-adminbar{display:flex;justify-content:space-between;align-items:center;gap:10px;background:#f7f9fd;border:1px solid #e1e7f0;border-radius:12px;padding:12px;margin-bottom:14px}.tm-adminbar button{border:0;border-radius:8px;padding:8px 12px;background:#315efb;color:#fff;cursor:pointer}.tm-search{padding:9px 12px;border:1px solid #dbe1eb;border-radius:9px;min-width:210px}.tm-table-actions{white-space:nowrap}.tm-empty{padding:22px;text-align:center;color:#7b879d}.tm-settings{display:grid;grid-template-columns:1fr 1fr;gap:12px}.tm-settings label{display:grid;gap:6px;font-size:12px;color:#66718a}.tm-settings input{padding:10px;border:1px solid #dbe1eb;border-radius:9px}.tm-wide{grid-column:1/-1}@media(max-width:700px){.tm-form,.tm-settings{grid-template-columns:1fr}.tm-wide{grid-column:auto}}";document.head.appendChild(css);
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
["itinerary","finance","members","booking","transport","gallery"].forEach(id=>addToolbar(id));
addDashboardEnhancements();addSettingsPanel();
}
function addToolbar(tab){
let p=$(tab);if(!p||p.querySelector(".tm-adminbar"))return;
let bar=document.createElement("div");bar.className="tm-adminbar";
let title={itinerary:"Trip plan",finance:"Financial operations",members:"Member directory",booking:"Bookings & rooms",transport:"Transport logistics",gallery:"Gallery moderation"}[tab];
let buttons={itinerary:[["Add activity","itinerary"]],finance:[["Record payment","contributions"],["Add expense","expenses"]],members:[["Add member","members"]],booking:[["Add booking","bookings"],["Add room","rooms"]],transport:[["Add vehicle","transport"]],gallery:[["Add photo","gallery"]]}[tab];
bar.innerHTML="<strong>"+title+"</strong><div>"+buttons.map(b=>'<button data-tm-add="'+b[1]+'">＋ '+b[0]+"</button>").join("")+"</div>";
p.prepend(bar);
}
function addDashboardEnhancements(){
let p=$("overview");if(!p)return;
let bar=document.createElement("div");bar.className="tm-adminbar";bar.innerHTML='<strong>Operations Center</strong><div><button data-tm-export>Export finance CSV</button> <button data-tm-add="expenses">＋ Expense</button> <button data-tm-add="members">＋ Member</button></div>';p.prepend(bar);
}
function addSettingsPanel(){
let p=document.querySelector(".tabs");if(!p)return;
let b=document.createElement("button");b.className="tab admin-only";b.dataset.tab="settings";b.textContent="⚙ Admin";p.appendChild(b);
let s=document.createElement("section");s.id="settings";s.className="panel";s.innerHTML='<div class="card"><h3>Trip Administration</h3><p class="muted">Administrators can update core trip settings and manage every operational record.</p><form id="tmTripForm" class="tm-settings"></form></div><div class="card" style="margin-top:18px"><h3>Admin capabilities</h3><div class="tm-settings"><div>✓ Create records</div><div>✓ Edit records</div><div>✓ Delete records</div><div>✓ Approve gallery photos</div><div>✓ Export finance data</div><div>✓ Live Supabase synchronization</div></div></div>';document.querySelector("main .container")?.appendChild(s);let main=document.querySelector("main");if(!s.parentElement||!main.contains(s)){let app=document.querySelector(".container");if(app)app.appendChild(s)}b.onclick=()=>setTab("settings");
}
async function start(){
ensureProfessionalUI();
let r=await db.auth.getSession();if(!r.data.session)return;
let u=r.data.session.user;
$("loginCard").classList.add("hidden");$("app").classList.remove("hidden");$("signOut").classList.remove("hidden");$("userEmail").textContent=u.email||"";
let a=await db.from("admin_users").select("user_id").eq("user_id",u.id).maybeSingle();isAdmin=!!a.data;
document.querySelectorAll(".admin-only,.admin-action,.admin-col").forEach(x=>x.classList.toggle("hidden",!isAdmin));
await loadAll();
}
async function loadAll(){
loading(true);
let names=Object.keys(cfg);
let qs=await Promise.all(names.map(n=>db.from(cfg[n].table).select("*")));
names.forEach((n,i)=>data[n]=qs[i].data||[]);
let s=await db.from("trip_settings").select("*").limit(1).maybeSingle();trip=s.data||{};
render();renderSettings();loading(false);
}
function render(){
let expected=+trip.expected_amount||0,collected=+trip.collected_amount||0,expense=data.expenses.reduce((a,x)=>a+(+x.amount||0),0),balance=collected-expense,pct=expected?Math.min(100,Math.round(collected/expected*100)):0;
$("tripName").textContent=trip.trip_name||"TRIPMATE";$("tripDates").textContent=[trip.start_date,trip.end_date].filter(Boolean).join(" → ")||"Dates not configured";
$("expected").textContent=money(expected);$("collected").textContent=money(collected);$("pending").textContent=money(Math.max(0,expected-collected));$("expenses").textContent=money(expense);$("balance").textContent=money(balance);
$("overviewText").innerHTML="<p><b>Expected:</b> "+money(expected)+"</p><p><b>Collected:</b> "+money(collected)+"</p><p><b>Pending:</b> "+money(Math.max(0,expected-collected))+"</p><p><b>Recorded expenses:</b> "+money(expense)+"</p>";
$("membersList").innerHTML=memberRows();$("contributionsList").innerHTML=paymentRows();$("expensesList").innerHTML=expenseRows();$("itineraryList").innerHTML=itineraryCards();$("bookingList").innerHTML=bookingRows();$("roomsList").innerHTML=roomRows();$("transportList").innerHTML=transportCards();$("galleryList").innerHTML=galleryCards();
let h=document.querySelector("#overview .tm-adminbar");if(h)h.querySelector("strong").textContent=isAdmin?"Administrator mode":"Read-only mode";
}
function memberRows(){
if(!data.members.length)return '<tr><td colspan="7" class="tm-empty">No members yet.</td></tr>';
return data.members.map(x=>'<tr><td><b>'+esc(x.name)+'</b><div class="muted">'+esc(x.gender||"")+'</div></td><td>'+esc(x.group_name||"—")+'</td><td>'+esc(x.phone||"—")+'<br>'+esc(x.email||"")+'</td><td>'+money(x.expected_contribution)+'</td><td>'+money(x.paid_amount)+'</td><td>'+badge(x.payment_status)+'</td><td class="tm-table-actions">'+actionBtns("members",x.id)+"</td></tr>").join("");
}
function paymentRows(){if(!data.contributions.length)return '<p class="tm-empty">No payments recorded.</p>';return data.contributions.map(x=>{let m=data.members.find(y=>y.id===x.member_id);return '<div class="item"><b>'+money(x.amount)+'</b> · '+esc(m?.name||"Unknown member")+'<br><span class="muted">'+esc(x.payment_method||"Payment")+' · '+esc(x.paid_at||"")+'</span>'+actionBtns("contributions",x.id)+"</div>"}).join("")}
function expenseRows(){if(!data.expenses.length)return '<p class="tm-empty">No expenses recorded.</p>';return data.expenses.map(x=>'<div class="item"><b>'+esc(x.title)+'</b> · '+money(x.amount)+'<br><span class="muted">'+esc(x.category||"Other")+' · '+esc(x.expense_date||"")+'</span>'+actionBtns("expenses",x.id)+"</div>").join("")}
function itineraryCards(){if(!data.itinerary.length)return '<p class="tm-empty">No itinerary activities yet.</p>';return data.itinerary.sort((a,b)=>a.day_number-b.day_number||a.sort_order-b.sort_order).map(x=>'<div class="card" style="margin-bottom:12px"><b>Day '+x.day_number+' · '+esc(x.title)+'</b><p>'+esc(x.activity)+'</p><span class="muted">⏱ '+esc(x.start_time||"")+" "+(x.end_time?"– "+esc(x.end_time):"")+" · 📍 "+esc(x.location||"—")+"</span>"+(x.maps_url?' · <a href="'+esc(x.maps_url)+'" target="_blank">Maps</a>':"")+actionBtns("itinerary",x.id)+"</div>").join("")}
function bookingRows(){if(!data.bookings.length)return '<p class="tm-empty">No bookings.</p>';return data.bookings.map(x=>'<div class="item"><b>'+esc(x.property_name)+'</b> · '+badge(x.status)+'<br><span class="muted">Ref '+esc(x.booking_reference||"—")+' · '+money(x.booking_amount)+' · '+esc(x.check_in||"")+' → '+esc(x.check_out||"")+'</span>'+actionBtns("bookings",x.id)+"</div>").join("")}
function roomRows(){if(!data.rooms.length)return '<p class="tm-empty">No rooms allocated.</p>';return data.rooms.map(x=>'<div class="item"><b>Room '+esc(x.room_number||"—")+'</b> · '+esc(x.room_type||"")+'<br><span class="muted">Capacity '+esc(x.capacity||"—")+' · '+esc(x.occupants||"")+'</span>'+actionBtns("rooms",x.id)+"</div>").join("")}
function transportCards(){if(!data.transport.length)return '<p class="tm-empty">No transport planned.</p>';return data.transport.map(x=>'<div class="card" style="margin-bottom:12px"><b>'+esc(x.vehicle_type||"Vehicle")+' · '+esc(x.vehicle_number||"")+'</b><p>Driver: '+esc(x.driver_name||"—")+' · '+esc(x.driver_phone||"—")+'</p><span class="muted">Pickup '+esc(x.pickup_location||"—")+' · '+esc(x.pickup_time||"—")+' · Fuel '+money(x.fuel_expense)+' · Toll '+money(x.toll_expense)+'</span>'+actionBtns("transport",x.id)+"</div>").join("")}
function galleryCards(){if(!data.gallery.length)return '<p class="tm-empty">No photos yet.</p>';return data.gallery.map(x=>'<div class="card" style="display:inline-block;width:31%;vertical-align:top;margin:1%"><img src="'+esc(x.image_url)+'" style="width:100%;height:180px;object-fit:cover;border-radius:10px"><b>'+esc(x.title||"Untitled")+'</b><div>'+badge(x.is_approved?"Approved":"Pending")+"</div>"+actionBtns("gallery",x.id)+"</div>").join("")}
function renderSettings(){
let f=$("tmTripForm");if(!f||!isAdmin)return;
f.innerHTML='<label class="tm-wide">Trip name<input name="trip_name" value="'+esc(trip.trip_name||"")+'"></label><label>Start date<input name="start_date" type="date" value="'+esc(trip.start_date||"")+'"></label><label>End date<input name="end_date" type="date" value="'+esc(trip.end_date||"")+'"></label><label>Expected amount<input name="expected_amount" type="number" value="'+(trip.expected_amount||0)+'"></label><label>Collected amount<input name="collected_amount" type="number" value="'+(trip.collected_amount||0)+'"></label><div class="tm-form-actions"><button class="primary">Save settings</button></div>';
f.onsubmit=async e=>{e.preventDefault();let o=Object.fromEntries(new FormData(f).entries());o.expected_amount=+o.expected_amount;o.collected_amount=+o.collected_amount;let r=await db.from("trip_settings").update(o).eq("id",trip.id);if(r.error)return toast(r.error.message);toast("Trip settings updated");loadAll()};
}
function fieldHTML(f,obj){
let key=f[0],label=f[1],type=f[2],req=f[3],v=obj[key]??"",input="";
if(type==="select")input='<select name="'+key+'" '+(req?"required":"")+'><option value="">Select…</option>'+f[4].map(o=>'<option value="'+esc(o)+'" '+(String(v)===o?"selected":"")+'>'+esc(o)+'</option>').join("")+"</select>";
else if(type==="members")input='<select name="'+key+'" required><option value="">Select member…</option>'+data.members.map(m=>'<option value="'+m.id+'" '+(v===m.id?"selected":"")+'>'+esc(m.name)+"</option>").join("")+"</select>";
else if(type==="bookings")input='<select name="'+key+'"><option value="">No booking</option>'+data.bookings.map(b=>'<option value="'+b.id+'" '+(v===b.id?"selected":"")+'>'+esc(b.property_name)+"</option>").join("")+"</select>";
else if(type==="textarea")input='<textarea name="'+key+'" rows="3">'+esc(v)+"</textarea>";
else{if(type==="datetime-local"&&v)v=new Date(v).toISOString().slice(0,16);input='<input name="'+key+'" type="'+type+'" value="'+esc(v)+'" '+(req?"required":"")+'>'}
return '<label class="'+(type==="textarea"?"tm-wide":"")+'">'+label+input+"</label>";
}
function openModal(table,id){
if(!isAdmin)return;
let c=cfg[table],obj=id?data[table].find(x=>x.id===id):{};
let m=document.createElement("div");m.className="tm-modal";m.id="tmModal";m.innerHTML='<div class="tm-modal-card"><div class="tm-modal-head"><div><span class="kicker">'+(id?"EDIT":"CREATE")+'</span><h2>'+(id?"Edit ":"Add ")+c.label+'</h2></div><button id="tmClose" class="icon-btn">×</button></div><form id="tmForm" class="tm-form">'+c.fields.map(f=>fieldHTML(f,obj)).join("")+'<div class="tm-form-actions"><button type="button" id="tmCancel">Cancel</button><button class="primary">Save record</button></div></form></div>';
document.body.appendChild(m);$("tmClose").onclick=closeModal;$("tmCancel").onclick=closeModal;$("tmForm").onsubmit=e=>saveRecord(e,table,id);
}
function closeModal(){let m=$("tmModal");if(m)m.remove()}
async function saveRecord(e,table,id){
e.preventDefault();let o=Object.fromEntries(new FormData(e.target).entries());
cfg[table].fields.forEach(f=>{if(f[2]==="number"&&o[f[0]]!=="")o[f[0]]=Number(o[f[0]]);if(f[0]==="is_approved")o[f[0]]=o[f[0]]==="true";if(f[2]==="datetime-local"&&o[f[0]])o[f[0]]=new Date(o[f[0]]).toISOString()});
if(table==="gallery")o.uploaded_by=(await db.auth.getUser()).data.user.id;
let r=id?await db.from(cfg[table].table).update(o).eq("id",id):await db.from(cfg[table].table).insert(o);
if(r.error)return toast(r.error.message);toast(id?"Record updated successfully":"Record created successfully");closeModal();loadAll();
}
async function deleteRecord(table,id){if(!isAdmin||!confirm("Delete this record permanently?"))return;let r=await db.from(cfg[table].table).delete().eq("id",id);if(r.error)return toast(r.error.message);toast("Record deleted");loadAll()}
function exportFinance(){
let rows=[["Type","Title","Amount","Date","Details"]];
data.contributions.forEach(x=>rows.push(["Payment",data.members.find(m=>m.id===x.member_id)?.name||"Unknown",x.amount,x.paid_at,x.payment_method||""]));
data.expenses.forEach(x=>rows.push(["Expense",x.title,x.amount,x.expense_date,x.category||""]));
let csv=rows.map(r=>r.map(v=>'"'+String(v??"").replaceAll('"','""')+'"').join(",")).join("\n");let a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="tripmate-finance.csv";a.click();
}
document.addEventListener("click",e=>{
let add=e.target.closest("[data-tm-add]");if(add)openModal(add.dataset.tmAdd);
let edit=e.target.closest("[data-tm-edit]");if(edit)openModal(edit.dataset.tmEdit,edit.dataset.id);
let del=e.target.closest("[data-tm-delete]");if(del)deleteRecord(del.dataset.tmDelete,del.dataset.id);
let ex=e.target.closest("[data-tm-export]");if(ex)exportFinance();
});
async function auth(signup){
let email=$("email").value.trim(),password=$("password").value;
if(!email||password.length<6){$("authMsg").textContent="Enter email and a password of at least 6 characters.";return}
let r=signup?await db.auth.signUp({email,password}):await db.auth.signInWithPassword({email,password});
$("authMsg").textContent=r.error?r.error.message:(signup?"Account created. Check your email if confirmation is enabled.":"Signed in.");
if(!r.error&&!signup)start();
}
$("signIn").onclick=()=>auth(false);$("signUp").onclick=()=>auth(true);$("signOut").onclick=async()=>{await db.auth.signOut();location.reload()};
start();