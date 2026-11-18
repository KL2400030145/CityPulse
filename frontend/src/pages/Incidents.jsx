import { useEffect, useMemo, useState } from 'react'
import { Search, Plus, MapPin, Clock3, UserRound, X, Check } from 'lucide-react'
const API = 'https://citypulse-3heq.onrender.com/api'
const statuses = ['Reported','Assigned','In Progress','Resolved','Closed']
const severityClass = s => `severity ${s.toLowerCase()}`
export default function Incidents({ incidents, refresh }) {
  const [search,setSearch] = useState('')
  const [status,setStatus] = useState('All')
  const [showForm,setShowForm] = useState(false)
  const [form,setForm] = useState({title:'',description:'',incident_type:'Accident',severity:'Medium',location:'Benz Circle',latitude:16.5062,longitude:80.6480,assigned_to:'Unassigned'})
  const filtered = useMemo(() => incidents.filter(i => (status==='All'||i.status===status) && `${i.title} ${i.location}`.toLowerCase().includes(search.toLowerCase())),[incidents,search,status])
  async function update(id, patch) { await fetch(`${API}/incidents/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(patch)}); refresh() }
  async function create(e) { e.preventDefault(); const r=await fetch(`${API}/incidents`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}); if(r.ok){setShowForm(false);setForm({...form,title:'',description:''});refresh()} else alert('Could not create incident. Check the details and try again.') }
  return <div className="page-stack">
    <div className="page-heading"><div><p className="eyebrow">OPERATIONS CENTER</p><h1>Incident management</h1><p className="subheading">Coordinate field response and keep the city moving.</p></div><button className="primary-btn" onClick={()=>setShowForm(true)}><Plus size={17}/> Report incident</button></div>
    <div className="toolbar"><div className="search-box"><Search size={17}/><input placeholder="Search incidents or locations..." value={search} onChange={e=>setSearch(e.target.value)}/></div><select value={status} onChange={e=>setStatus(e.target.value)}>{['All',...statuses].map(s=><option key={s}>{s}</option>)}</select><span className="result-count">{filtered.length} records</span></div>
    <div className="incident-list">{filtered.map(i=><article className="incident-card" key={i.id}>
      <div className="incident-main"><div className="incident-title-row"><span className={`type-icon ${i.incident_type==='Accident'?'accident':''}`}>{i.incident_type==='Accident'?'!':i.incident_type==='Signal Failure'?'⌁':'↗'}</span><div><h3>{i.title}</h3><p>{i.description || 'No additional details provided.'}</p></div></div>
      <div className="incident-meta"><span><MapPin size={14}/>{i.location}</span><span><Clock3 size={14}/>{new Date(i.created_at).toLocaleString()}</span><span><UserRound size={14}/>{i.assigned_to}</span></div></div>
      <div className="incident-actions"><span className={severityClass(i.severity)}>{i.severity}</span><select value={i.status} onChange={e=>update(i.id,{status:e.target.value})}>{statuses.map(s=><option key={s}>{s}</option>)}</select></div>
    </article>)}</div>
    {showForm && <div className="modal-backdrop" onClick={()=>setShowForm(false)}><form className="modal" onSubmit={create} onClick={e=>e.stopPropagation()}>
      <div className="modal-head"><div><p className="eyebrow">NEW REPORT</p><h2>Log an incident</h2></div><button type="button" className="icon-btn" onClick={()=>setShowForm(false)}><X/></button></div>
      <label>Incident title<input required minLength="4" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Traffic signal not responding"/></label>
      <label>Details<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="What happened? Add useful field details."/></label>
      <div className="form-grid"><label>Type<select value={form.incident_type} onChange={e=>setForm({...form,incident_type:e.target.value})}>{['Accident','Signal Failure','Road Obstruction','Road Closure','Other'].map(x=><option>{x}</option>)}</select></label><label>Severity<select value={form.severity} onChange={e=>setForm({...form,severity:e.target.value})}>{['Low','Medium','High','Critical'].map(x=><option>{x}</option>)}</select></label></div>
      <label>Location<select value={form.location} onChange={e=>{const coords={ 'Benz Circle':[16.5062,80.6480],'MG Road':[16.5193,80.6305],'Governorpet':[16.5170,80.6260],'Auto Nagar':[16.4975,80.6660],'Kanuru Junction':[16.4850,80.6900],'Bhavanipuram':[16.5350,80.6010],'Ramavarappadu':[16.5175,80.6780]};setForm({...form,location:e.target.value,latitude:coords[e.target.value][0],longitude:coords[e.target.value][1]})}}>{['Benz Circle','MG Road','Governorpet','Auto Nagar','Kanuru Junction','Bhavanipuram','Ramavarappadu'].map(x=><option>{x}</option>)}</select></label>
      <label>Assigned team<input value={form.assigned_to} onChange={e=>setForm({...form,assigned_to:e.target.value})}/></label>
      <button className="primary-btn full-btn"><Check size={17}/> Save incident</button>
    </form></div>}
  </div>
}
