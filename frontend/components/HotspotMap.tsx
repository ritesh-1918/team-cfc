"use client";

import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type Hotspot = { ward: string; count: number; lat: number; lng: number };
type Props   = { hotspots: Hotspot[] };

const MAX_RADIUS = 30;
const MIN_RADIUS = 8;

function getColor(ratio: number): string {
  if (ratio > 0.7) return "#ef4444";
  if (ratio > 0.4) return "#f97316";
  if (ratio > 0.2) return "#f59e0b";
  return "#6366f1";
}

function getLegendLabel(ratio: number): string {
  if (ratio > 0.7) return "Critical";
  if (ratio > 0.4) return "High";
  if (ratio > 0.2) return "Medium";
  return "Low";
}

const LEGEND = [
  { color: "#ef4444", label: "Critical" },
  { color: "#f97316", label: "High" },
  { color: "#f59e0b", label: "Medium" },
  { color: "#6366f1", label: "Low" },
];

export default function HotspotMap({ hotspots }: Props) {
  const max = Math.max(...hotspots.map((h) => h.count), 1);
  const center: [number, number] = [51.505, -0.09];

  return (
    <div className="relative">
      <MapContainer
        center={center}
        zoom={10}
        style={{ height: "360px", width: "100%" }}
        scrollWheelZoom={false}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles-dark"
        />
        {hotspots.map((h) => {
          if (!h.lat || !h.lng) return null;
          const ratio  = h.count / max;
          const radius = MIN_RADIUS + (ratio * (MAX_RADIUS - MIN_RADIUS));
          const color  = getColor(ratio);
          const isTop  = ratio === 1;

          return (
            <CircleMarker
              key={h.ward}
              center={[h.lat, h.lng]}
              radius={radius}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: isTop ? 0.65 : 0.45,
                weight: isTop ? 2.5 : 1.5,
                opacity: 0.9,
              }}
            >
              <Tooltip direction="top" offset={[0, -radius]} opacity={1}>
                <div style={{ fontFamily: "system-ui, sans-serif", minWidth: 120 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span style={{
                      display: "inline-block", width: 8, height: 8,
                      borderRadius: "50%", backgroundColor: color, flexShrink: 0
                    }} />
                    <strong style={{ fontSize: 12, color: "#f4f4f5" }}>{h.ward}</strong>
                  </div>
                  <div style={{ fontSize: 11, color: "#a1a1aa", paddingLeft: 14 }}>
                    {h.count} report{h.count !== 1 ? "s" : ""}
                    <span style={{
                      marginLeft: 6, padding: "1px 6px",
                      borderRadius: 4, fontSize: 10,
                      backgroundColor: `${color}22`, color
                    }}>
                      {getLegendLabel(ratio)}
                    </span>
                  </div>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Legend overlay */}
      <div style={{
        position: "absolute", bottom: 28, right: 12, zIndex: 1000,
        background: "rgba(9,9,14,0.85)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 10, padding: "8px 12px",
        display: "flex", flexDirection: "column", gap: 5,
      }}>
        <p style={{ fontSize: 9, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>
          Intensity
        </p>
        {LEGEND.map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              backgroundColor: color, flexShrink: 0
            }} />
            <span style={{ fontSize: 11, color: "#a1a1aa" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
