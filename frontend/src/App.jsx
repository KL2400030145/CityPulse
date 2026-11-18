import Welcome from './pages/Welcome';
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, AlertTriangle, ArrowUpRight, BarChart3, Bell, CarFront, CheckCircle2, ChevronRight, Clock3, Gauge, LayoutDashboard, Map, Menu, Radio, RefreshCw, Settings2, ShieldCheck, Signal, Siren, Truck, Wifi, WifiOff, X } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar } from 'recharts'
import MetricCard from './components/MetricCard'
import TrafficMap from './components/TrafficMap'
import Incidents from './pages/Incidents'
const API='https://citypulse-3heq.onrender.com/api'
const fmt = n => Number(n||0).toLocaleString('en-IN')
function App(){
  const [page,setPage]=useState('Overview')
  const [showWelcome,setShowWelcome]=useState(true)
  const [summary,setSummary]=useState({})
  const [segments,setSegments]=useState([])
  const [incidents,setIncidents]=useState([])
  const [history,setHistory]=useState([])
  const [hourly,setHourly]=useState([])
  const [connected,setConnected]=useState(false)
  const [simulation,setSimulation]=useState(true)
  const [lastUpdate,setLastUpdate]=useState(new Date())
  const [mobileOpen,setMobileOpen]=useState(false)
  const [toast,setToast]=useState('')
  const refresh=useCallback(async()=>{
    try{
      const [s,g,i,h,a]=await Promise.all([
        fetch(`${API}/dashboard/summary`),fetch(`${API}/traffic/segments`),fetch(`${API}/incidents`),fetch(`${API}/traffic/history`),fetch(`${API}/analytics/hourly`)
      ])
      if(!s.ok||!g.ok||!i.ok||!h.ok||!a.ok) throw new Error('API unavailable')
      setSummary(await s.json());setSegments(await g.json());setIncidents(await i.json());setHistory(await h.json());setHourly(await a.json());setLastUpdate(new Date())
    }catch(e){setToast('Backend is not reachable. Start the CityPulse API and refresh.')}
  },[])
  useEffect(()=>{refresh();const t=setInterval(refresh,12000);return()=>clearInterval(t)},[refresh])
  useEffect(()=>{
    let ws
    let retry
    const connect=()=>{
      ws=new WebSocket('wss://citypulse-3heq.onrender.com/ws/traffic')
      ws.onopen=()=>setConnected(true)
      ws.onclose=()=>{setConnected(false);retry=setTimeout(connect,3000)}
      ws.onerror=()=>ws.close()
      ws.onmessage=e=>{
        const d=JSON.parse(e.data)
        if(d.type==='traffic_update'){
          setSegments(old=>[d,...old.filter(x=>x.segment_id!==d.segment_id)])
          setSummary(old=>({...old,average_speed:d.average_speed,congestion:d.congestion,vehicles_per_minute:(old.vehicles_per_minute||0)+d.vehicle_count}))
          setLastUpdate(new Date())
        }
      }
    }
    connect()
    return()=>{clearTimeout(retry);ws?.close()}
  },[])
  if (showWelcome) {
  return (
    <Welcome
      onExplore={() => setShowWelcome(false)}
    />
  );
}
  async function toggleSimulation(){
    const action=simulation?'stop':'start'
    const r=await fetch(`${API}/simulation/${action}`,{method:'POST'})
    if(r.ok){setSimulation(!simulation);setToast(`Traffic simulation ${simulation?'paused':'resumed'}.`)}
  }
  const active=incidents.filter(i=>!['Resolved','Closed'].includes(i.status)).length
  const severe=incidents.filter(i=>['High','Critical'].includes(i.severity)&&!['Resolved','Closed'].includes(i.status)).length
  const chartData=history.map((x,i)=>({...x,label:new Date(x.recorded_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),index:i}))
  const nav=[['Overview',LayoutDashboard],['Live traffic',Map],['Incidents',Siren],['Analytics',BarChart3]]
  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen?'open':''}`}>
      <div className="brand"><div className="brand-mark"><Activity size={22}/></div><div><strong>citypulse<span>.</span></strong><small>URBAN MOBILITY OPS</small></div><button className="mobile-close icon-btn" onClick={()=>setMobileOpen(false)}><X/></button></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav>{nav.map(([label,Icon])=><button key={label} className={`nav-item ${page===label?'active':''}`} onClick={()=>{setPage(label);setMobileOpen(false)}}><Icon size={18}/><span>{label}</span>{label==='Incidents'&&active>0&&<b>{active}</b>}</button>)}</nav>
      <div className="sidebar-spacer"/>
      <div className="city-card"><div className="city-card-top"><span className="pulse-dot"/> SYSTEM STATUS</div><strong>Vijayawada, AP</strong><small>Mobility operations demo</small><div className="city-card-foot"><span><Wifi size={13}/> {connected?'Live stream':'Connecting'}</span><span>v1.0</span></div></div>
      <div className="profile"><div className="avatar">CP</div><div><strong>City Operations</strong><small>Control room</small></div><Settings2 size={17}/></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><button className="mobile-menu icon-btn" onClick={()=>setMobileOpen(true)}><Menu/></button><div className="breadcrumb">Workspace <ChevronRight size={14}/> <strong>{page}</strong></div><div className="topbar-right"><span className={`live-pill ${connected?'':'offline'}`}><span/> {connected?'LIVE FEED':'RECONNECTING'}</span><button className="icon-btn" onClick={refresh} title="Refresh data"><RefreshCw size={18}/></button><button className="icon-btn notification-btn" title="Active incidents" onClick={()=>setPage('Incidents')}><Bell size={18}/>{active>0&&<i/>}</button><div className="top-date">{new Date().toLocaleDateString('en-IN',{weekday:'short',day:'2-digit',month:'short'})}</div></div></header>
      <div className="content">
        {page==='Overview'&&<div className="page-stack">
          <div className="hero-row"><div><p className="eyebrow">CITY OPERATIONS / OVERVIEW</p><h1>Good {new Date().getHours()<12?'morning':new Date().getHours()<17?'afternoon':'evening'}, team.</h1><p className="subheading">Here’s what’s happening across the road network right now.</p></div><div className="hero-actions"><button className="secondary-btn" onClick={refresh}><RefreshCw size={16}/> Refresh</button><button className={`primary-btn ${simulation?'pause-btn':''}`} onClick={toggleSimulation}><Radio size={16}/>{simulation?'Pause stream':'Resume stream'}</button></div></div>
          <div className="metric-grid">
            <MetricCard icon={CarFront} label="Vehicles observed" value={fmt(summary.vehicles_per_minute)} unit="" trend="+8.2%" tone="blue" detail="Recent telemetry window"/>
            <MetricCard icon={Gauge} label="Average speed" value={summary.average_speed||'—'} unit=" km/h" trend="+2.4%" tone="green" detail="Across monitored segments"/>
            <MetricCard icon={Activity} label="Congestion index" value={summary.congestion||'—'} unit="%" trend="-3.1%" tone="amber" detail="Lower is better"/>
            <MetricCard icon={AlertTriangle} label="Active incidents" value={active} unit="" tone="red" detail={`${severe} high / critical priority`}/>
          </div>
          <div className="section-grid">
            <section className="panel map-panel"><div className="panel-heading"><div><p className="eyebrow">NETWORK VIEW</p><h2>Traffic across the city</h2></div><button className="text-btn" onClick={()=>setPage('Live traffic')}>Full map <ArrowUpRight size={15}/></button></div><TrafficMap segments={segments} incidents={incidents}/></section>
            <section className="panel feed-panel"><div className="panel-heading"><div><p className="eyebrow">FIELD RESPONSE</p><h2>Incident activity</h2></div><button className="text-btn" onClick={()=>setPage('Incidents')}>View all <ArrowUpRight size={15}/></button></div>
              <div className="feed-list">{incidents.slice(0,4).map(i=><div className="feed-item" key={i.id}><span className={`feed-marker ${i.severity.toLowerCase()}`}/><div className="feed-copy"><strong>{i.title}</strong><small>{i.location} · {i.status}</small></div><span className={ `severity ${i.severity.toLowerCase()}`}>{i.severity}</span></div>)}</div>
              <div className="feed-footer"><ShieldCheck size={15}/> Keep response statuses up to date.</div>
            </section>
          </div>
          <section className="panel chart-panel"><div className="panel-heading"><div><p className="eyebrow">LIVE TELEMETRY</p><h2>Vehicle flow & average speed</h2></div><span className="chart-caption"><span className="legend-line"/> Vehicle count <span className="legend-line speed"/> Average speed</span></div><div className="chart-area"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="flowFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3978e8" stopOpacity={.22}/><stop offset="100%" stopColor="#3978e8" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#edf0f5"/><XAxis dataKey="label" tickLine={false} axisLine={false} tick={{fontSize:11,fill:'#8792a5'}}/><YAxis tickLine={false} axisLine={false} tick={{fontSize:11,fill:'#8792a5'}}/><Tooltip contentStyle={{border:'1px solid #e8edf4',borderRadius:12,fontFamily:'DM Sans'}}/><Area type="monotone" dataKey="vehicle_count" stroke="#3978e8" fill="url(#flowFill)" strokeWidth={2.5} name="Vehicles"/><Area type="monotone" dataKey="average_speed" stroke="#27a77d" fill="transparent" strokeWidth={2} name="Speed (km/h)"/></AreaChart></ResponsiveContainer></div></section>
          <div className="footer-note"><span>Last updated {lastUpdate.toLocaleTimeString()}</span><span>Traffic values are simulated demo telemetry · OpenStreetMap</span></div>
        </div>}
        {page==='Live traffic'&&<div className="page-stack"><div className="page-heading"><div><p className="eyebrow">NETWORK MONITORING</p><h1>Live traffic map</h1><p className="subheading">Explore monitored road segments and current operating conditions.</p></div><span className="live-pill"><span/> LIVE UPDATES</span></div><section className="panel full-map-panel"><TrafficMap segments={segments} incidents={incidents}/></section><div className="segment-grid">{segments.map(s=><div className="segment-card" key={s.segment_id}><div className="segment-head"><strong>{s.segment_name}</strong><span className={`traffic-tag ${s.congestion>=72?'heavy':s.congestion>=45?'moderate':'clear'}`}>{s.congestion>=72?'Heavy':s.congestion>=45?'Moderate':'Clear'}</span></div><div className="segment-stats"><div><small>Avg. speed</small><b>{s.average_speed} <small>km/h</small></b></div><div><small>Vehicles</small><b>{s.vehicle_count}</b></div><div><small>Congestion</small><b>{s.congestion}%</b></div></div></div>)}</div></div>}
        {page==='Incidents'&&<Incidents incidents={incidents} refresh={refresh}/>}
        {page==='Analytics'&&<div className="page-stack"><div className="page-heading"><div><p className="eyebrow">PERFORMANCE & TRENDS</p><h1>Traffic analytics</h1><p className="subheading">Understand flow, speed and pressure across monitored segments.</p></div></div><div className="metric-grid"><MetricCard icon={CarFront} label="Vehicles observed" value={fmt(summary.vehicles_per_minute)} tone="blue" detail="Recent telemetry window"/><MetricCard icon={Gauge} label="Average speed" value={summary.average_speed||'—'} unit=" km/h" tone="green" detail="Current network average"/><MetricCard icon={Activity} label="Congestion index" value={summary.congestion||'—'} unit="%" tone="amber" detail="Current network average"/><MetricCard icon={CheckCircle2} label="Resolved incidents" value={incidents.filter(i=>['Resolved','Closed'].includes(i.status)).length} tone="green" detail="All recorded incidents"/></div><section className="panel chart-panel"><div className="panel-heading"><div><p className="eyebrow">RECENT READINGS</p><h2>Vehicle volume by sample</h2></div></div><div className="chart-area tall"><ResponsiveContainer width="100%" height="100%"><BarChart data={history}><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#edf0f5"/><XAxis dataKey="segment_name" tickLine={false} axisLine={false} tick={{fontSize:10,fill:'#8792a5'}}/><YAxis tickLine={false} axisLine={false}/><Tooltip/><Bar dataKey="vehicle_count" fill="#3978e8" radius={[5,5,0,0]} name="Vehicles"/></BarChart></ResponsiveContainer></div></section><div className="analytics-note"><Activity size={18}/><div><strong>How to read this data</strong><p>These charts use the latest simulated telemetry records stored by the API. For production use, connect an authorized traffic sensor or GPS feed and validate data quality before making operational decisions.</p></div></div></div>}
      </div>
    </main>
    {toast&&<div className="toast" onClick={()=>setToast('')}>{toast}<button><X size={14}/></button></div>}
  </div>
}
export default App
