import React, { useEffect, useState } from "react";
import { NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";

const API = "http://127.0.0.1:8000/api";

const icons = {
  home:"⌂", report:"＋", reports:"▤", map:"⌖", building:"▥", bell:"●",
  authority:"◆", analytics:"▥", repair:"✓", inspect:"◉", menu:"☰", close:"×"
};

async function api(path, options={}) {
  const res = await fetch(API + path, {
    headers: {"Content-Type":"application/json", ...(options.headers||{})},
    ...options
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function Badge({children, tone="neutral"}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
function Stat({label,value,tone=""}) {
  return <div className={`stat ${tone}`}><div className="stat-value">{value}</div><div className="stat-label">{label}</div></div>;
}
function Empty({text}) { return <div className="empty">{text}</div>; }

function Layout({role,setRole}) {
  const [open,setOpen]=useState(false);
  const location=useLocation();
  const citizenLinks=[
    ["/","⌂","Dashboard"],["/report","＋","Report Damage"],["/reports","▤","My Reports"],
    ["/map","⌖","Safety Map"],["/buildings","▥","Building Profiles"],["/notifications","●","Notifications"]
  ];
  const authorityLinks=[
    ["/authority","◆","Authority Dashboard"],["/authority/reports","▤","Report Management"],
    ["/authority/inspections","◉","Inspections"],["/authority/escalations","↑","Escalations"],
    ["/authority/analytics","▥","Analytics"]
  ];
  const links=role==="authority"?authorityLinks:citizenLinks;
  return <div className="app-shell">
    <aside className={`sidebar ${open?"show":""}`}>
      <div className="brand">
        <div className="brand-mark">⌂</div>
        <div><strong>Broken Building</strong><small>Reporter</small></div>
      </div>
      <div className="role-pill">{role==="authority"?"Authority Portal":"Citizen Portal"}</div>
      <nav>
        {links.map(([to,ico,label])=><NavLink key={to} to={to} onClick={()=>setOpen(false)} className={({isActive})=>isActive?"nav active":"nav"}><span>{ico}</span>{label}</NavLink>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="safety-note"><b>Safety first</b><span>AI assists reporting; professionals make final structural decisions.</span></div>
        <button className="ghost" onClick={()=>setRole(role==="citizen"?"authority":"citizen")}>Switch to {role==="citizen"?"Authority":"Citizen"}</button>
      </div>
    </aside>
    <div className="main">
      <header className="topbar">
        <button className="icon-btn mobile-only" onClick={()=>setOpen(!open)}>{open?icons.close:icons.menu}</button>
        <div className="crumb">{location.pathname==="/"?"Dashboard":location.pathname.slice(1).replaceAll("-"," ")}</div>
        <div className="top-actions">
          <button className="role-switch" onClick={()=>setRole(role==="citizen"?"authority":"citizen")}>Viewing: <b>{role}</b> ↔</button>
          <NavLink to="/notifications" className="notification">●<span>3</span></NavLink>
          <div className="avatar">{role==="authority"?"A":"C"}</div>
        </div>
      </header>
      <main className="content"><Routes>
        <Route path="/" element={<CitizenDashboard/>}/>
        <Route path="/report" element={<ReportDamage/>}/>
        <Route path="/analysis/:id" element={<Analysis/>}/>
        <Route path="/reports" element={<Reports/>}/>
        <Route path="/reports/:id" element={<ReportDetails/>}/>
        <Route path="/map" element={<SafetyMap/>}/>
        <Route path="/buildings" element={<Buildings/>}/>
        <Route path="/buildings/:id" element={<BuildingProfile/>}/>
        <Route path="/repair/:id" element={<RepairVerification/>}/>
        <Route path="/notifications" element={<Notifications/>}/>
        <Route path="/authority" element={<AuthorityDashboard/>}/>
        <Route path="/authority/reports" element={<AuthorityReports/>}/>
        <Route path="/authority/inspections" element={<Inspections/>}/>
        <Route path="/authority/escalations" element={<Escalations/>}/>
        <Route path="/authority/analytics" element={<Analytics/>}/>
        <Route path="*" element={<CitizenDashboard/>}/>
      </Routes></main>
    </div>
  </div>
}

function Hero({role}) {
  const nav=useNavigate();
  return <section className="hero">
    <div>
      <div className="eyebrow">AI-ASSISTED CIVIC SAFETY</div>
      <h1>Report. <span>Track.</span> Resolve.</h1>
      <p>Report visible building damage, get AI-assisted analysis, and keep every issue accountable from first report to final verification.</p>
      <div className="hero-actions">
        <button className="primary" onClick={()=>nav("/report")}>＋ Report Building Damage</button>
        <button className="secondary" onClick={()=>nav("/map")}>⌖ View Safety Map</button>
      </div>
    </div>
    <div className="hero-card">
      <div className="hero-building">🏢</div>
      <div><b>Safety intelligence</b><span>Photo → AI → Inspection → Resolution</span></div>
    </div>
  </section>
}

function CitizenDashboard() {
  const [data,setData]=useState(null);
  useEffect(()=>{api("/dashboard").then(setData).catch(()=>{});},[]);
  return <><Hero/><div className="page-head"><div><h2>Citizen Dashboard</h2><p>Monitor your submitted building safety reports.</p></div><NavLink className="primary small" to="/report">＋ New Report</NavLink></div>
    <div className="stats-grid">
      <Stat label="Total Reports" value={data?.total??12}/><Stat label="High Priority" value={data?.high_priority??3} tone="danger"/>
      <Stat label="Under Inspection" value={data?.under_inspection??4} tone="warning"/><Stat label="Resolved" value={data?.resolved??5} tone="success"/>
    </div>
    <div className="grid-2">
      <section className="card"><div className="card-head"><div><h3>Recent Reports</h3><p>Your latest building issues</p></div><NavLink to="/reports" className="link">View all →</NavLink></div>
      <RecentReports/></section>
      <section className="card"><div className="card-head"><div><h3>How it works</h3><p>From report to action</p></div></div>
        <div className="steps">{["Upload photo & location","AI checks visible damage","Authority inspects","Repair & verify"].map((x,i)=><div className="step" key={x}><b>{i+1}</b><span>{x}</span></div>)}</div>
      </section>
    </div>
    <div className="info-banner"><b>Important:</b> AI only evaluates visible evidence. Paint, plaster, blur or obstruction can hide damage. Low-confidence cases are routed for professional inspection.</div>
  </>
}

function RecentReports() {
  const [items,setItems]=useState([]);
  useEffect(()=>{api("/reports").then(x=>setItems(x.slice(0,5))).catch(()=>{});},[]);
  return items.length?<div className="table-wrap"><table><thead><tr><th>Report</th><th>Issue</th><th>Priority</th><th>Status</th></tr></thead><tbody>{items.map(r=><tr key={r.id}><td><NavLink className="link" to={`/reports/${r.id}`}>{r.code}</NavLink></td><td>{r.damage_type}</td><td><Badge tone={r.severity==="High"?"danger":r.severity==="Medium"?"warning":"success"}>{r.severity}</Badge></td><td>{r.status}</td></tr>)}</tbody></table></div>:<Empty text="No reports yet. Create your first report."/>
}

function ReportDamage() {
  const nav=useNavigate();
  const [form,setForm]=useState({damage_type:"Wall Crack",description:"",latitude:"16.5062",longitude:"80.6480",address:"MG Road, Vijayawada"});
  const [file,setFile]=useState(null); const [busy,setBusy]=useState(false); const [msg,setMsg]=useState("");
  async function submit(e){e.preventDefault();setBusy(true);setMsg("");
    try{
      const body={...form,latitude:Number(form.latitude),longitude:Number(form.longitude)};
      const r=await api("/reports",{method:"POST",body:JSON.stringify(body)});
      if(file){const fd=new FormData();fd.append("file",file);await fetch(`${API}/reports/${r.id}/image`,{method:"POST",body:fd});}
      const a=await api(`/ai/analyze/${r.id}`,{method:"POST"});
      nav(`/analysis/${r.id}`);
    }catch(err){setMsg(err.message||"Could not submit report.");}
    finally{setBusy(false);}
  }
  return <><div className="page-head"><div><h2>Report Building Damage</h2><p>Upload clear evidence and the system will assist with preliminary analysis.</p></div></div>
  <form className="card form-card" onSubmit={submit}>
    <div className="upload" onClick={()=>document.getElementById("photo").click()}>
      {file?<div className="file-name">✓ {file.name}</div>:<><div className="upload-icon">▧</div><b>Capture or upload photo</b><span>JPG, PNG up to 10 MB • Multiple views recommended</span></>}
      <input id="photo" type="file" accept="image/*" hidden onChange={e=>setFile(e.target.files[0])}/>
    </div>
    <div className="form-grid">
      <label>Damage type<select value={form.damage_type} onChange={e=>setForm({...form,damage_type:e.target.value})}>{["Wall Crack","Structural Crack","Damaged Plaster","Water Leakage","Damaged Balcony","Damaged Roof","Exposed Wiring","Broken Windows","Other Visible Hazard"].map(x=><option key={x}>{x}</option>)}</select></label>
      <label>Building address<input value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></label>
      <label>Latitude<input value={form.latitude} onChange={e=>setForm({...form,latitude:e.target.value})}/></label>
      <label>Longitude<input value={form.longitude} onChange={e=>setForm({...form,longitude:e.target.value})}/></label>
      <label className="full">Description<textarea rows="5" placeholder="Describe what you can see..." value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
    </div>
    <div className="location-box">⌖ <div><b>Location captured</b><span>{form.latitude}, {form.longitude}</span></div><button type="button" className="secondary" onClick={()=>navigator.geolocation?.getCurrentPosition(p=>setForm({...form,latitude:p.coords.latitude.toFixed(6),longitude:p.coords.longitude.toFixed(6)}))}>Use my location</button></div>
    {msg&&<div className="error">{msg}</div>}
    <button className="primary wide" disabled={busy}>{busy?"Analyzing…":"✦ Analyze & Submit Report"}</button>
  </form></>
}

function Analysis() {
  const {id}=useParamsSafe(); const nav=useNavigate(); const [r,setR]=useState(null);
  useEffect(()=>{api(`/reports/${id}`).then(setR).catch(()=>{});},[id]);
  if(!r)return <Loading/>;
  const low=(r.confidence||0)<70;
  return <><div className="page-head"><div><h2>Analysis Result</h2><p>AI-assisted assessment of visible evidence.</p></div></div>
  <div className="analysis-grid"><section className="card">
    <div className="analysis-title"><div><span>Damage detected</span><h1>{r.damage_type}</h1></div><Badge tone={r.severity==="High"?"danger":r.severity==="Medium"?"warning":"success"}>{r.severity}</Badge></div>
    <div className="metrics"><div><span>Confidence</span><b>{r.confidence}%</b></div><div><span>Severity</span><b>{r.severity}</b></div><div><span>Priority</span><b>{r.priority_score}/100</b></div></div>
    <div className="scan-box"><div className="fake-crack">╱╲<br/>╱╲</div><span>Visible evidence analysis</span></div>
    <div className={low?"warning-box":"recommendation"}><b>{low?"⚠ Inspection Required":"✓ Recommendation"}</b><span>{low?"Image confidence is low. Surface conditions may hide damage; professional inspection is recommended.":"Professional inspection is recommended for high-risk or progressing visible damage."}</span></div>
    <div className="button-row"><button className="secondary" onClick={()=>nav("/report")}>Analyze another</button><button className="primary" onClick={()=>nav(`/reports/${id}`)}>View Report →</button></div>
  </section></div></>
}
function useParamsSafe(){ const location=useLocation(); return {id:location.pathname.split("/").pop()}; }
function Loading(){return <div className="loading">Loading…</div>}

function Reports(){
 const [items,setItems]=useState([]); const [q,setQ]=useState("");
 useEffect(()=>{api("/reports").then(setItems).catch(()=>{});},[]);
 const filtered=items.filter(r=>(r.code+r.damage_type+r.status).toLowerCase().includes(q.toLowerCase()));
 return <><div className="page-head"><div><h2>My Reports</h2><p>Track every issue from report to resolution.</p></div><NavLink className="primary small" to="/report">＋ New Report</NavLink></div>
 <div className="card"><div className="toolbar"><input placeholder="Search reports…" value={q} onChange={e=>setQ(e.target.value)}/><div className="filter-pills"><span>All</span><span>High</span><span>Under Inspection</span><span>Resolved</span></div></div>
 <div className="table-wrap"><table><thead><tr><th>Report ID</th><th>Issue</th><th>Location</th><th>Severity</th><th>Status</th><th></th></tr></thead><tbody>{filtered.map(r=><tr key={r.id}><td><b>{r.code}</b></td><td>{r.damage_type}</td><td>{r.address}</td><td><Badge tone={r.severity==="High"?"danger":r.severity==="Medium"?"warning":"success"}>{r.severity}</Badge></td><td>{r.status}</td><td><NavLink className="link" to={`/reports/${r.id}`}>View →</NavLink></td></tr>)}</tbody></table></div></div></>
}

function ReportDetails(){
 const {id}=useParamsSafe(); const [r,setR]=useState(null); const [busy,setBusy]=useState(false);
 useEffect(()=>{api(`/reports/${id}`).then(setR).catch(()=>{});},[id]);
 async function update(status){setBusy(true);try{await api(`/reports/${id}/status`,{method:"PUT",body:JSON.stringify({status})});setR(await api(`/reports/${id}`));}finally{setBusy(false);}}
 if(!r)return <Loading/>;
 const stages=["Reported","AI Verified","Assigned","Under Inspection","Repair Pending","Resolved"];
 const current=stages.indexOf(r.status);
 return <><div className="page-head"><div><h2>Report Details</h2><p>{r.code} • {r.address}</p></div><Badge tone={r.severity==="High"?"danger":"warning"}>{r.severity} priority</Badge></div>
 <div className="grid-2"><section className="card"><div className="report-visual"><div className="fake-building">🏢</div><div><b>{r.damage_type}</b><span>{r.description||"Visible building damage reported by citizen."}</span></div></div>
 <div className="detail-grid"><div><span>Confidence</span><b>{r.confidence}%</b></div><div><span>Priority score</span><b>{r.priority_score}/100</b></div><div><span>Reported</span><b>{new Date(r.created_at).toLocaleString()}</b></div><div><span>Coordinates</span><b>{r.latitude}, {r.longitude}</b></div></div></section>
 <section className="card"><h3>Status timeline</h3><div className="timeline">{stages.map((s,i)=><div className={`timeline-item ${i<=current?"done":""}`} key={s}><i>{i<=current?"✓":""}</i><div><b>{s}</b>{i===current&&<span>Current status</span>}</div></div>)}</div>
 <div className="button-row"><button disabled={busy} className="secondary" onClick={()=>update("Under Inspection")}>Request inspection</button><button disabled={busy} className="primary" onClick={()=>update("Resolved")}>Mark resolved</button></div></section></div></>
}

function SafetyMap(){
 const [items,setItems]=useState([]); useEffect(()=>{api("/reports").then(setItems).catch(()=>{});},[]);
 return <><div className="page-head"><div><h2>Safety Map</h2><p>Risk locations and reported building issues.</p></div></div>
 <div className="card map-card"><div className="map-placeholder"><div className="map-grid">{items.map((r,i)=><div key={r.id} className={`pin p${i%8}`} title={r.code}>{r.severity==="High"?"🔴":r.severity==="Medium"?"🟠":"🟢"}</div>)}</div><div className="map-center">Vijayawada • Safety Risk View</div></div>
 <div className="legend"><span>🔴 High priority</span><span>🟠 Medium priority</span><span>🟢 Low priority</span></div></div></>
}

function Buildings(){
 const [items,setItems]=useState([]);useEffect(()=>{api("/buildings").then(setItems).catch(()=>{});},[]);
 return <><div className="page-head"><div><h2>Building Profiles</h2><p>Historical reports and visible damage trends.</p></div></div>
 <div className="building-grid">{items.map(b=><NavLink className="building-card" to={`/buildings/${b.id}`} key={b.id}><div className="building-art">🏢</div><div><b>{b.building_code}</b><span>{b.address}</span><Badge tone={b.risk==="High"?"danger":b.risk==="Medium"?"warning":"success"}>{b.risk} attention</Badge></div></NavLink>)}</div></>
}
function BuildingProfile(){
 const {id}=useParamsSafe();const [b,setB]=useState(null);useEffect(()=>{api(`/buildings/${id}`).then(setB).catch(()=>{});},[id]);if(!b)return <Loading/>;
 return <><div className="page-head"><div><h2>{b.building_code}</h2><p>{b.address}</p></div><Badge tone={b.risk==="High"?"danger":"warning"}>{b.risk}</Badge></div>
 <div className="grid-2"><section className="card"><h3>Building Profile</h3><div className="building-large">🏢</div><div className="detail-grid"><div><span>Total reports</span><b>{b.total_reports}</b></div><div><span>High priority</span><b>{b.high_priority}</b></div><div><span>Resolved</span><b>{b.resolved}</b></div><div><span>Trend</span><b>{b.trend}</b></div></div></section>
 <section className="card"><h3>Damage History</h3><div className="history">{b.history.map((h,i)=><div className="history-row" key={i}><div className={`history-dot ${h.severity.toLowerCase()}`}></div><div><b>{h.date} • {h.damage_type}</b><span>{h.note}</span></div><Badge tone={h.severity==="High"?"danger":h.severity==="Medium"?"warning":"success"}>{h.severity}</Badge></div>)}</div></section></div></>
}
function RepairVerification(){
 const {id}=useParamsSafe();const [done,setDone]=useState(false);return <><div className="page-head"><div><h2>Repair Verification</h2><p>Compare evidence before and after repair.</p></div></div>
 <section className="card"><div className="compare"><div><h4>Before Repair</h4><div className="fake-wall crack-wall">╱╲╱╲</div></div><div><h4>After Repair</h4><div className="fake-wall">Clean surface</div></div></div>
 <div className="success-box"><b>{done?"✓ Verification submitted":"✓ Damage appears reduced"}</b><span>AI comparison is an assistance tool; final verification should be performed by an authorized professional.</span></div>
 <button className="primary" onClick={()=>setDone(true)}>{done?"Submitted":"Submit Verification"}</button></section></>
}
function Notifications(){const notes=[["New high priority report received","Building B-1048 • Wall crack","danger"],["Inspection scheduled","B-1048 • Tomorrow 09:00","info"],["Repair update submitted","B-1022 • Verification pending","warning"],["Repair verification successful","B-0987 • Resolved","success"]];return <><div className="page-head"><div><h2>Notifications</h2><p>Important updates about your reports.</p></div></div><div className="notification-list">{notes.map((n,i)=><div className="notification-card" key={i}><div className={`note-icon ${n[2]}`}>{i+1}</div><div><b>{n[0]}</b><span>{n[1]}</span></div><small>Today</small></div>)}</div></>}

function AuthorityDashboard(){
 const [d,setD]=useState(null);useEffect(()=>{api("/dashboard").then(setD).catch(()=>{});},[]);
 return <><div className="page-head"><div><h2>Authority Dashboard</h2><p>Prioritize, inspect and resolve building safety reports.</p></div><NavLink className="secondary" to="/authority/reports">Manage Reports →</NavLink></div>
 <div className="stats-grid"><Stat label="Total Reports" value={d?.total??128}/><Stat label="High Priority" value={d?.high_priority??17} tone="danger"/><Stat label="Under Inspection" value={d?.under_inspection??23} tone="warning"/><Stat label="Resolved" value={d?.resolved??88} tone="success"/></div>
 <div className="grid-2"><section className="card"><div className="card-head"><div><h3>Recent high-priority reports</h3><p>Cases needing attention</p></div></div><RecentReports/></section>
 <section className="card"><h3>Department assignment</h3><div className="bars">{[["Building Safety Dept.",23],["Engineering Dept.",18],["Town Planning Dept.",17],["Electrical Dept.",11]].map(x=><div className="bar-row" key={x[0]}><span>{x[0]}</span><b>{x[1]}</b><div><i style={{width:`${x[1]*3}%`}}></i></div></div>)}</div></section></div></>
}
function AuthorityReports(){
 const [items,setItems]=useState([]);useEffect(()=>{api("/reports").then(setItems).catch(()=>{});},[]);
 async function act(id,status){await api(`/reports/${id}/status`,{method:"PUT",body:JSON.stringify({status})});setItems(await api("/reports"));}
 return <><div className="page-head"><div><h2>Report Management</h2><p>Verify, assign and update building reports.</p></div></div>
 <div className="card"><div className="table-wrap"><table><thead><tr><th>Report</th><th>Issue</th><th>Severity</th><th>Status</th><th>Action</th></tr></thead><tbody>{items.map(r=><tr key={r.id}><td><b>{r.code}</b></td><td>{r.damage_type}<br/><small>{r.address}</small></td><td><Badge tone={r.severity==="High"?"danger":r.severity==="Medium"?"warning":"success"}>{r.severity}</Badge></td><td>{r.status}</td><td><button className="mini" onClick={()=>act(r.id,"Under Inspection")}>Inspect</button><button className="mini" onClick={()=>act(r.id,"Resolved")}>Resolve</button></td></tr>)}</tbody></table></div></div></>
}
function Inspections(){return <><div className="page-head"><div><h2>Inspections</h2><p>Human verification queue for reported damage.</p></div></div><div className="card"><div className="inspection"><b>R-2026-1048</b><span>Wall Crack • High • MG Road</span><Badge tone="danger">Inspection Required</Badge><button className="mini">Schedule</button></div><div className="inspection"><b>R-2026-1022</b><span>Water Leakage • Medium • Gunadala</span><Badge tone="warning">Scheduled</Badge><button className="mini">View</button></div></div></>}
function Escalations(){return <><div className="page-head"><div><h2>Escalations</h2><p>Automatic escalation keeps unresolved reports accountable.</p></div></div><div className="escalation-flow">{["Local / Ward Authority","Department Head","Municipal Commissioner","Higher / State Authority"].map((x,i)=><React.Fragment key={x}><div className="authority-node"><b>{i+1}</b><span>{x}</span>{i<3&&<small>Response deadline</small>}</div>{i<3&&<div className="arrow">→</div>}</React.Fragment>)}</div><div className="card"><h3>Active escalation</h3><div className="inspection"><b>R-2026-0955</b><span>No response after configured deadline</span><Badge tone="danger">Escalated</Badge><button className="mini">Open</button></div></div></>}
function Analytics(){return <><div className="page-head"><div><h2>Analytics</h2><p>Use report data to identify recurring risk areas.</p></div></div><div className="stats-grid"><Stat label="Reports this month" value="75"/><Stat label="Avg. response" value="2.4d"/><Stat label="Resolution rate" value="82%" tone="success"/><Stat label="Escalated" value="9" tone="danger"/></div><section className="card"><h3>Monthly report trend</h3><div className="chart"><div className="chart-line"></div>{[25,38,31,52,44,67,58,75].map((n,i)=><div key={i} className="chart-bar" style={{height:`${n}%`}}><span>{n}</span></div>)}</div></section></>}

export default function App(){
 const [role,setRole]=useState(localStorage.getItem("role")||"citizen");
 useEffect(()=>localStorage.setItem("role",role),[role]);
 return <Layout role={role} setRole={setRole}/>;
}
