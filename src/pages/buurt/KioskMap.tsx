import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import type { KioskLocation } from "./types";
import { LDH_BRAND } from "./brand";

type Props = {
  locations: KioskLocation[];
  center: [number, number];
  zoom: number;
  selectedId?: string | null;
  onSelect?: (loc: KioskLocation) => void;
  fitBounds?: boolean;
};

function FitBounds({ locations }: { locations: KioskLocation[] }) {
  const map = useMap();
  useEffect(() => {
    if (locations.length === 0) return;
    const lats = locations.map((l) => l.lat);
    const lons = locations.map((l) => l.lon);
    map.fitBounds(
      [
        [Math.min(...lats), Math.min(...lons)],
        [Math.max(...lats), Math.max(...lons)],
      ],
      { padding: [40, 40], maxZoom: 12 },
    );
  }, [locations, map]);
  return null;
}

export function KioskMap({
  locations,
  center,
  zoom,
  selectedId,
  onSelect,
  fitBounds,
}: Props) {
  const markers = useMemo(() => locations, [locations]);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full min-h-[280px] rounded-2xl"
      scrollWheelZoom={false}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {fitBounds ? <FitBounds locations={markers} /> : null}
      {markers.map((loc) => {
        const selected = loc.id === selectedId;
        return (
          <CircleMarker
            key={loc.id}
            center={[loc.lat, loc.lon]}
            radius={selected ? 14 : 10}
            pathOptions={{
              color: LDH_BRAND.navy,
              weight: 2,
              fillColor: selected ? LDH_BRAND.red : LDH_BRAND.redDark,
              fillOpacity: 0.9,
            }}
            eventHandlers={{
              click: () => onSelect?.(loc),
            }}
          >
            <Popup>
              <strong>{loc.title}</strong>
              <br />
              {loc.address}
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
