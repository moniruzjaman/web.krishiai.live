import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, CircleMarker, Popup, ScaleControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const mkIcon = (color: string) => L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-" + color + ".png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [22, 36], iconAnchor: [11, 36], popupAnchor: [1, -30],
});
const gi = mkIcon("green"), bi = mkIcon("blue"), yi = mkIcon("yellow");

const INSTITUTIONS: { pos: [number, number]; icon: L.Icon; popup: string }[] = [
  { pos: [23.8103, 90.4125], icon: gi, popup: "<b>DAE</b><br>কৃষি সম্প্রসারণ অধিদপ্তর<br>📞 16123" },
  { pos: [24.0022, 90.4264], icon: bi, popup: "<b>BRRI</b><br>বাংলাদেশ ধান গবেষণা ইনস্টিটিউট<br>গাজীপুর" },
  { pos: [23.9999, 90.3977], icon: bi, popup: "<b>BARI</b><br>বাংলাদেশ কৃষি গবেষণা ইনস্টিটিউট<br>গাজীপুর" },
  { pos: [23.7808, 90.3992], icon: gi, popup: "<b>BARC</b><br>বাংলাদেশ কৃষি গবেষণা কাউন্সিল<br>ফার্মগেট, ঢাকা" },
  { pos: [23.7461, 90.3742], icon: gi, popup: "<b>BADC</b><br>বাংলাদেশ কৃষি উন্নয়ন কর্পোরেশন<br>ঢাকা" },
  { pos: [23.7808, 90.3650], icon: bi, popup: "<b>SRDI</b><br>মৃত্তিকা সম্পদ উন্নয়ন ইনস্টিটিউট<br>ঢাকা" },
  { pos: [23.7280, 90.3938], icon: gi, popup: "<b>কৃষি মন্ত্রণালয়</b><br>Ministry of Agriculture<br>ঢাকা" },
  { pos: [23.7450, 90.3960], icon: yi, popup: "<b>DAM</b><br>কৃষি বিপণন অধিদপ্তর<br>বাজার মূল্য তথ্য কেন্দ্র" },
];

function MapCenterFollower({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.flyTo(center, 11, { duration: 1.2 }); }, [center, map]);
  return null;
}

function LocateButton() {
  const map = useMap();
  const [locating, setLocating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const locate = () => {
    if (!navigator.geolocation) { setStatus("GPS সমর্থিত নয়"); return; }
    setLocating(true); setStatus(null);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const c: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        map.flyTo(c, 14, { duration: 1.2 });
        L.circleMarker(c, { radius: 10, color: "#e53e3e", fillColor: "#e53e3e", fillOpacity: 0.9, weight: 3 })
          .addTo(map).bindPopup("<b style='color:#e53e3e'>📍 আপনার অবস্থান</b><br>" + c[0].toFixed(5) + ", " + c[1].toFixed(5)).openPopup();
        setLocating(false); setStatus("✅ অবস্থান পাওয়া গেছে");
        setTimeout(() => setStatus(null), 3000);
      },
      () => { setLocating(false); setStatus("⚠️ অবস্থান পাওয়া যায়নি"); setTimeout(() => setStatus(null), 4000); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <>
      {status && (
        <div style={{
          position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", zIndex: 999,
          background: "rgba(255,255,255,.92)", padding: "5px 14px", borderRadius: 20, fontSize: 11,
          fontWeight: 700, boxShadow: "0 2px 8px rgba(0,0,0,.15)", whiteSpace: "nowrap",
          color: status.includes("✅") ? "#1b8a3e" : "#e53e3e",
        }}>{status}</div>
      )}
      <button onClick={locate} style={{
        position: "absolute", bottom: 16, right: 10, zIndex: 999,
        background: "#1b8a3e", color: "#fff", border: "none", borderRadius: 30,
        padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer",
        boxShadow: "0 3px 12px rgba(27,138,62,.4)", display: "flex", alignItems: "center", gap: 6,
        fontFamily: "inherit",
      }}>
        📍 {locating ? "⏳ খুঁজছি…" : "আমার অবস্থান"}
      </button>
    </>
  );
}

export default function InteractiveMap({ center }: { center: [number, number] }) {
  return (
    <MapContainer center={center} zoom={11} className="z-[1] w-full h-full" scrollWheelZoom={true}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution={'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | krishi.ai'}
        eventHandlers={{
          tileerror: (e) => {
            const tile = e.tile as HTMLImageElement;
            if (tile.getAttribute("data-retry") !== "1") {
              tile.setAttribute("data-retry", "1");
              setTimeout(() => { tile.src = tile.src; }, 1500);
            }
          },
        }}
      />
      {INSTITUTIONS.map((m, i) => (
        <Marker key={i} position={m.pos} icon={m.icon}>
          <Popup>{m.popup}</Popup>
        </Marker>
      ))}
      <CircleMarker center={center} radius={8} pathOptions={{ color: "#e53e3e", fillColor: "#e53e3e", fillOpacity: 0.9 }}>
        <Popup><b>আপনার অবস্থান</b></Popup>
      </CircleMarker>
      <ScaleControl imperial={false} />
      <MapCenterFollower center={center} />
      <LocateButton />
    </MapContainer>
  );
}
