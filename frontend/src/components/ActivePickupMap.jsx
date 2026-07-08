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
      // Slightly different padding for mobile vs desktop for better framing
      const isMobile = window.innerWidth < 640;
      map.fitBounds(bounds, {
        padding: isMobile ? [40, 40] : [60, 60],
        animate: true,
      });
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
    // Outer wrapper: Full screen transparent on desktop, solid on mobile
    <div className="fixed inset-0 z-[9999] flex items-center justify-center sm:bg-black/60 sm:p-4 sm:backdrop-blur-sm">
      {/* Inner Container: Full screen on mobile, rounded modal on desktop */}
      <div className="w-full h-[100dvh] sm:h-[85vh] sm:max-w-4xl bg-white dark:bg-slate-900 sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col relative">
        {/* HEADER */}
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 z-10 shadow-sm flex-shrink-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white leading-tight">
              {userRole === "ngo"
                ? "Navigate to Pickup"
                : "Volunteer Approaching"}
            </h2>
            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-slate-300 mt-1">
              Food:{" "}
              <span className="text-emerald-600 font-bold">
                {claim.donation_id.food_title}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 sm:px-5 sm:py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl font-bold text-gray-700 dark:text-gray-200 transition-colors text-sm sm:text-base flex-shrink-0"
          >
            ✕ <span className="hidden sm:inline ml-1">Close</span>
          </button>
        </div>
        {/* MAP AREA */}
        <div className="flex-grow w-full relative z-0">
          {/* Waiting Message for Donor */}
          {userRole === "donor" && !ngoLocation && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-amber-50 border border-amber-200 shadow-lg px-4 py-3 rounded-2xl flex items-center gap-3 w-[90%] max-w-sm">
              <div className="animate-spin h-5 w-5 border-2 border-amber-600 border-t-transparent rounded-full flex-shrink-0"></div>
              <div>
                <p className="text-sm font-bold text-amber-900 leading-tight">
                  Waiting for Volunteer...
                </p>
                <p className="text-[10px] sm:text-xs text-amber-700 mt-0.5">
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

            {/* Bottom Right Zoom Control (Adjusted for mobile) */}
            <div className="leaflet-bottom leaflet-right mb-24 sm:mb-6 mr-2">
              <div className="leaflet-control-zoom leaflet-bar leaflet-control">
                <a
                  className="leaflet-control-zoom-in"
                  href="#"
                  title="Zoom in"
                  role="button"
                  aria-label="Zoom in"
                  onClick={(e) => {
                    e.preventDefault();
                    mapRef.current?.zoomIn();
                  }}
                >
                  +
                </a>
                <a
                  className="leaflet-control-zoom-out"
                  href="#"
                  title="Zoom out"
                  role="button"
                  aria-label="Zoom out"
                  onClick={(e) => {
                    e.preventDefault();
                    mapRef.current?.zoomOut();
                  }}
                >
                  −
                </a>
              </div>
            </div>

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

          {/* FLOATING ETA CARD (Responsive positioned at the bottom) */}
          {ngoLocation && (
            <div className="absolute bottom-6 left-4 right-4 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 z-[1000] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-gray-200 dark:border-slate-700 shadow-2xl px-6 py-4 rounded-2xl flex items-center justify-between sm:justify-start sm:gap-8 sm:min-w-[320px]">
              <div className="flex flex-col items-center sm:items-start">
                <span className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">
                  Est. Arrival
                </span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
                  {routeInfo.time}{" "}
                  <span className="text-sm font-bold">min</span>
                </span>
              </div>

              <div className="w-px h-10 sm:h-12 bg-gray-200 dark:bg-slate-700 mx-2 sm:mx-0"></div>

              <div className="flex flex-col items-center sm:items-start">
                <span className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">
                  Distance
                </span>
                <span className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 leading-none mt-1">
                  {routeInfo.distance}{" "}
                  <span className="text-sm font-semibold">km</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
