import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import RoutingMachine from "./RoutingMachine";
import socket from "../utils/socket";
import L from "leaflet";

// --- CUSTOM ICONS ---
const ngoIcon = L.divIcon({
  className: "moving-vehicle",
  html: `<div style="font-size: 22px; background: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 3px solid #10B981;">🚛</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const donorIcon = L.divIcon({
  className: "static-marker",
  html: `<div style="font-size: 22px; background: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 3px solid #3B82F6;">🏠</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// --- AUTO CAMERA PANNING ---
function MapBoundsFitter({ pos1, pos2 }) {
  const map = useMap();
  useEffect(() => {
    if (pos1 && pos2) {
      const bounds = L.latLngBounds([pos1.lat, pos1.lng], [pos2.lat, pos2.lng]);
      map.fitBounds(bounds, { padding: [60, 60], animate: true });
    }
  }, [map, pos1, pos2]);
  return null;
}

export default function ActivePickupMap({ claim, userRole, onClose }) {
  const [ngoLocation, setNgoLocation] = useState(null);
  const [routeInfo, setRouteInfo] = useState({ distance: "...", time: "..." });

  const donorCoords = {
    lat: claim.donation_id.location.coordinates[1],
    lng: claim.donation_id.location.coordinates[0],
  };

  useEffect(() => {
    socket.emit("joinPickup", claim._id);

    let watchId;
    if (userRole === "ngo") {
      if ("geolocation" in navigator) {
        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            const coords = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            };
            setNgoLocation(coords);
            socket.emit("updateLocation", { claimId: claim._id, coords });
          },
          (err) => console.error("GPS Error:", err),
          { enableHighAccuracy: true, maximumAge: 0 },
        );
      }
    } else if (userRole === "donor") {
      socket.on("ngoLocationMoved", (newCoords) => setNgoLocation(newCoords));
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      socket.off("ngoLocationMoved");
    };
  }, [claim._id, userRole]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[85vh] relative">
        {/* HEADER */}
        <div className="p-5 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 z-10 shadow-sm">
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">
              {userRole === "ngo"
                ? "Navigate to Pickup"
                : "Volunteer Approaching"}
            </h2>
            <p className="text-sm font-medium text-gray-500 mt-1">
              Food:{" "}
              <span className="text-emerald-600">
                {claim.donation_id.food_title}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl font-bold text-gray-700 dark:text-gray-200 transition-colors"
          >
            Close
          </button>
        </div>

        {/* MAP */}
        <div className="flex-grow w-full relative z-0">
          {/* Show a waiting message to the Donor until NGO connects */}
          {userRole === "donor" && !ngoLocation && (
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-[1000] bg-amber-50 border border-amber-200 shadow-xl px-5 py-3 rounded-2xl flex items-center gap-3 w-[90%] max-w-sm">
              <div className="animate-spin h-5 w-5 border-2 border-amber-600 border-t-transparent rounded-full flex-shrink-0"></div>
              <div>
                <p className="text-sm font-bold text-amber-900 leading-tight">
                  Waiting for Volunteer...
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  They haven't started sharing their live location yet.
                </p>
              </div>
            </div>
          )}
          <MapContainer
            center={[donorCoords.lat, donorCoords.lng]}
            zoom={15}
            className="h-full w-full"
            zoomControl={false}
          >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

            {ngoLocation && (
              <>
                <RoutingMachine
                  startCoords={ngoLocation}
                  endCoords={donorCoords}
                  setRouteInfo={setRouteInfo}
                />
                <MapBoundsFitter pos1={ngoLocation} pos2={donorCoords} />
              </>
            )}

            <Marker
              position={[donorCoords.lat, donorCoords.lng]}
              icon={donorIcon}
            >
              <Popup className="font-bold">🏠 Donor Location</Popup>
            </Marker>

            {ngoLocation && (
              <Marker
                position={[ngoLocation.lat, ngoLocation.lng]}
                icon={ngoIcon}
              >
                <Popup className="font-bold">🛵 Volunteer</Popup>
              </Marker>
            )}
          </MapContainer>

          {/* FLOATING ETA CARD */}
          {ngoLocation && (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[1000] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-gray-200 dark:border-slate-700 shadow-2xl px-6 py-4 rounded-2xl flex items-center gap-6 min-w-[280px]">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Est. Arrival
                </span>
                <span className="text-2xl font-black text-emerald-600">
                  {routeInfo.time} min
                </span>
              </div>
              <div className="w-px h-10 bg-gray-200 dark:bg-slate-700"></div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Distance
                </span>
                <span className="text-xl font-bold text-gray-800 dark:text-gray-200">
                  {routeInfo.distance} km
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
