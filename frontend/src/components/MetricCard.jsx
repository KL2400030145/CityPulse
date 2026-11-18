import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
export default function MetricCard({ icon: Icon, label, value, unit, trend, tone = 'blue', detail }) {
  return <div className="metric-card">
    <div className="metric-top"><span className={`metric-icon ${tone}`}><Icon size={19}/></span>
      {trend && <span className={`trend ${trend.startsWith('-') ? 'down' : 'up'}`}>{trend.startsWith('-') ? <ArrowDownRight size={14}/> : <ArrowUpRight size={14}/>} {trend}</span>}
    </div>
    <div className="metric-label">{label}</div>
    <div className="metric-value">{value}<small>{unit}</small></div>
    <div className="metric-detail">{detail}</div>
  </div>
}
