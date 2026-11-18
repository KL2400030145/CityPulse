import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'

const center = [16.5062, 80.6480]
function color(value) {
  if (value >= 72) return '#ef6461'
  if (value >= 45) return '#e8a23a'
  return '#36b58a'
}
export default function TrafficMap({ segments = [], incidents = [] }) {
  return <div className="map-wrap">
    <MapContainer center={center} zoom={12} scrollWheelZoom={true} className="traffic-map">
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {segments.map(s => <CircleMarker key={s.segment_id} center={[s.latitude, s.longitude]} radius={11}
        pathOptions={{ color: color(s.congestion), fillColor: color(s.congestion), fillOpacity: .82, weight: 2 }}>
        <Popup><strong>{s.segment_name}</strong><br/>Average speed: {s.average_speed} km/h<br/>Congestion: {s.congestion}%<br/>Vehicles: {s.vehicle_count}</Popup>
      </CircleMarker>)}
      {incidents.filter(i => i.status !== 'Resolved' && i.status !== 'Closed').map(i =>
        <CircleMarker key={`i-${i.id}`} center={[i.latitude, i.longitude]} radius={7}
          pathOptions={{ color: '#fff', fillColor: '#8b5cf6', fillOpacity: 1, weight: 2 }}>
          <Popup><strong>{i.title}</strong><br/>{i.location}<br/>{i.severity} · {i.status}</Popup>
        </CircleMarker>)}
    </MapContainer>
    <div className="map-legend"><span><i className="dot green"/> Free flow</span><span><i className="dot amber"/> Moderate</span><span><i className="dot red"/> Heavy</span><span><i className="dot purple"/> Incident</span></div>
  </div>
}
