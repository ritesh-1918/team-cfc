"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type Hotspot = {
  ward: string;
  count: number;
  lat: number;
  lng: number;
};

type Props = {
  hotspots: Hotspot[];
};

const MAX_RADIUS = 28;
const MIN_RADIUS = 8;

function getColor(count: number, max: number): string {
  const ratio = count / (max || 1);
  if (ratio > 0.7) return "#ef4444";
  if (ratio > 0.4) return "#f59e0b";
  return "#6366f1";
}

export default function HotspotMap({ hotspots }: Props) {
  const max = Math.max(...hotspots.map((h) => h.count), 1);
  // Centre on London
  const center: [number, number] = [51.505, -0.09];

  return (
    <MapContainer
      center={center}
      zoom={10}
      style={{ height: "340px", width: "100%", borderRadius: "0.75rem" }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="map-tiles-dark"
      />
      {hotspots.map((h) => {
        if (!h.lat || !h.lng) return null;
        const radius = MIN_RADIUS + ((h.count / max) * (MAX_RADIUS - MIN_RADIUS));
        const color = getColor(h.count, max);
        return (
          <CircleMarker
            key={h.ward}
            center={[h.lat, h.lng]}
            radius={radius}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.55,
              weight: 2,
              opacity: 0.9,
            }}
          >
            <Tooltip direction="top" offset={[0, -radius]} opacity={0.95}>
              <div className="text-xs font-medium">
                <strong>{h.ward}</strong><br />
                {h.count} report{h.count !== 1 ? "s" : ""}
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
