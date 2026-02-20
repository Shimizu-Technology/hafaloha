import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { locationsApi } from '../services/api';
import type { Location } from '../services/api';

const DAY_ORDER = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DAY_LABELS: Record<string,string> = { monday:'Monday',tuesday:'Tuesday',wednesday:'Wednesday',thursday:'Thursday',friday:'Friday',saturday:'Saturday',sunday:'Sunday' };

function parseHours(h?: Record<string,unknown>): {day:string;time:string}[] {
  if (!h) return [];
  return DAY_ORDER.filter(d=>h[d]).map(d=>{
    const v=h[d]; const t=typeof v==='string'?v:(v as Record<string,string>)?.open&&(v as Record<string,string>)?.close?`${(v as Record<string,string>).open} - ${(v as Record<string,string>).close}`:'Closed';
    return {day:DAY_LABELS[d],time:t};
  });
}

function locationTypeBadge(type:string) {
  const m:Record<string,{bg:string;text:string;label:string}>={permanent:{bg:'bg-emerald-100',text:'text-emerald-700',label:'Permanent'},popup:{bg:'bg-purple-100',text:'text-purple-700',label:'Pop-up'},event:{bg:'bg-orange-100',text:'text-orange-700',label:'Event'}};
  const s=m[type]||m.permanent;
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>{s.label}</span>;
}

export default function LocationsPage() {
  const [locations,setLocations]=useState<Location[]>([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{locationsApi.getLocations().then(r=>setLocations(r.locations||[])).catch(console.error).finally(()=>setLoading(false));},[]);

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-hafalohaRed text-white py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 tracking-tight">Our Locations</h1>
          <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto">Find us near you and order for pickup.</p>
        </div>
      </section>
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3].map(i=><div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse"><div className="h-5 bg-gray-200 rounded w-3/4 mb-4"/><div className="h-4 bg-gray-200 rounded w-full mb-2"/><div className="h-4 bg-gray-200 rounded w-2/3 mb-4"/><div className="h-10 bg-gray-200 rounded w-full"/></div>)}
            </div>
          ) : locations.length===0 ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              <p className="text-gray-500 text-lg">No locations available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.map(loc=><LocationCard key={loc.id} location={loc}/>)}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function LocationCard({location}:{location:Location}) {
  const hours=parseHours(location.hours_json);
  const mapUrl=location.address?`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`:null;
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-900">{location.name}</h3>
          {locationTypeBadge(location.location_type)}
        </div>
        {location.description && <p className="text-gray-600 text-sm mb-4">{location.description}</p>}
        {location.address && (
          <div className="flex items-start gap-2 mb-3">
            <svg className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            <div>
              <p className="text-sm text-gray-700">{location.address}</p>
              {mapUrl && <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="text-hafalohaRed hover:text-red-700 text-xs font-medium inline-flex items-center gap-1 mt-1">Get Directions<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg></a>}
            </div>
          </div>
        )}
        {location.phone && (
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            <a href={`tel:${location.phone}`} className="text-sm text-gray-700 hover:text-hafalohaRed transition-colors">{location.phone}</a>
          </div>
        )}
        {hours.length>0 && (
          <div className="flex items-start gap-2 mb-4">
            <svg className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <div className="space-y-0.5">
              {hours.map(h=><p key={h.day} className="text-sm text-gray-700"><span className="font-medium">{h.day}:</span>{' '}<span className={h.time.toLowerCase()==='closed'?'text-gray-400':''}>{h.time}</span></p>)}
            </div>
          </div>
        )}
        <div className="flex-1"/>
        <Link to={`/menu?location=${location.slug}`} className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-hafalohaRed text-white rounded-lg font-medium text-sm hover:bg-red-700 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
          Order from here
        </Link>
      </div>
    </div>
  );
}
