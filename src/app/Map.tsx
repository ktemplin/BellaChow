"use client";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import type { Dispatch, SetStateAction } from "react";
import L from "leaflet";
import { useCallback } from "react";


// Fix default icon issue in Leaflet with Next.js
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

if (typeof window !== 'undefined') {
  icon.options.iconRetinaUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
}

export type Store = {
  id: number;
  lat: number;
  lon: number;
  name: string;
  address?: string;
  shop?: string;
};

// Leaflet CSS should be imported globally in app/layout.tsx or app/globals.css


interface MapProps {
  center: [number, number];
  stores: Store[];
  selectedStore: Store | null;
  setSelectedStore: Dispatch<SetStateAction<Store | null>>;
}

export default function Map({ center, stores, selectedStore, setSelectedStore }: MapProps) {

  // Center map on selected store
  function FlyToStore({ store }: { store: Store | null }) {
    const map = useMap();
    if (store) {
      map.flyTo([store.lat, store.lon], 16);
    }
    return null;
  }

  const handleMarkerClick = useCallback(
    (store: Store) => () => setSelectedStore(store),
    [setSelectedStore]
  );

  return (
    <MapContainer center={center} zoom={14} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
      <TileLayer
        attribution='&copy; 
        <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={center} icon={icon}>
        <Popup>You are here</Popup>
      </Marker>
      {stores.map((store: Store) => (
        <Marker
          key={store.id}
          position={[store.lat, store.lon]}
          icon={icon}
          eventHandlers={{
            click: handleMarkerClick(store),
          }}
        >
          <Popup>
            <strong>{store.name}</strong>
            {store.address && <><br />{store.address}</>}
            {store.shop && <><br /><span style={{color:'#888'}}>{store.shop}</span></>}
          </Popup>
        </Marker>
      ))}
      {selectedStore && <FlyToStore store={selectedStore} />}
    </MapContainer>
  );
}

