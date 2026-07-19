import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import DonationCard from "../components/DonationCard";
import { haversineDistance } from "../utils/haversine";

// Default Blue Icon for Donations
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom Red Marker for User's "You" Location
const userIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function FindFoodPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [radius, setRadius] = useState(20);
  const [filter, setFilter] = useState("all");
  const [userCoords, setUserCoords] = useState(null);

  // UI States
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const verificationBlocked =
    (user?.role === "donor" || user?.role === "ngo") && !user?.isVerified;

  // Refs
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const mapWrapperRef = useRef(null);

  const defaultCenter = [22.581373, 88.349279]; // Fallback Center

  // Initial Load: Auto-fetch Live GPS Location
  useEffect(() => {
    const fetchInitialLocation = () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserCoords({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            setIsInitializing(false);
          },
          (error) => {
            console.warn("GPS access denied or failed, using fallback.", error);
            fallbackToRegisteredLocation();
          },
          { enableHighAccuracy: true, timeout: 5000 },
        );
      } else {
        fallbackToRegisteredLocation();
      }
    };

    const fallbackToRegisteredLocation = () => {
      if (user?.location?.coordinates && user.location.coordinates[0] !== 0) {
        setUserCoords({
          lat: user.location.coordinates[1],
          lng: user.location.coordinates[0],
        });
      } else {
        setUserCoords({ lat: defaultCenter[0], lng: defaultCenter[1] });
      }
      setIsInitializing(false);
    };

    fetchInitialLocation();
  }, [user]);

  // Fullscreen Event Listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setTimeout(() => {
        if (mapRef.current) mapRef.current.invalidateSize();
      }, 200);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Fetch Donations whenever Coords or Radius change
  const fetchDonations = useCallback(async () => {
    if (!userCoords) return;
    setIsRefreshing(true);
    try {
      const res = await api.get(
        `/donations/nearby?lat=${userCoords.lat}&lng=${userCoords.lng}&radius=${radius}&status=available`,
      );
      setDonations(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  }, [userCoords, radius]);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  // Filter Donations
  const filteredDonations = donations.filter((d) => {
    const isNotExpired = new Date(d.expiry_datetime) > new Date();
    const matchesFilter = filter === "all" || d.food_type === filter;
    return isNotExpired && matchesFilter;
  });

  // Handle Dragging the Red Marker
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = userMarkerRef.current;
        if (marker != null) {
          const newPos = marker.getLatLng();
          setUserCoords({ lat: newPos.lat, lng: newPos.lng });
        }
      },
    }),
    [],
  );

  // Action Handlers
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserCoords(newCoords);
        setIsLocating(false);
        if (mapRef.current) {
          mapRef.current.flyTo([newCoords.lat, newCoords.lng], 14, {
            animate: true,
          });
        }
      },
      (error) => {
        alert("Unable to retrieve location. Check browser permissions.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true },
    );
  };

  const handleResetMap = () => {
    if (user?.location?.coordinates && user.location.coordinates[0] !== 0) {
      const resetCoords = {
        lat: user.location.coordinates[1],
        lng: user.location.coordinates[0],
      };
      setUserCoords(resetCoords);
      if (mapRef.current) {
        mapRef.current.flyTo([resetCoords.lat, resetCoords.lng], 13, {
          animate: true,
        });
      }
    } else {
      alert("No registered home location found. Use 'Locate GPS' instead.");
    }
  };

  const handleClaim = async (donationId) => {
    if (verificationBlocked) {
      navigate("/verify");
      return;
    }
    try {
      await api.post("/claims", { donation_id: donationId });
      alert("✅ Request sent successfully! Waiting for donor approval.");
      fetchDonations();
    } catch (err) {
      alert(err.response?.data?.message || "Claim failed");
    }
  };

  // --- Map View Controls (Fullscreen & Fit Area) ---
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (mapWrapperRef.current.requestFullscreen) {
        mapWrapperRef.current.requestFullscreen().catch(console.log);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleFitArea = () => {
    if (mapRef.current && userCoords) {
      const bounds = L.latLngBounds(
        [userCoords.lat, userCoords.lng],
        [userCoords.lat, userCoords.lng],
      );
      filteredDonations.forEach((d) => {
        if (d.location?.coordinates) {
          bounds.extend([d.location.coordinates[1], d.location.coordinates[0]]);
        }
      });
      mapRef.current.fitBounds(bounds, { padding: [50, 50], animate: true });
    }
  };

  // Button styling dynamic class
  const filterBtnClass = (active) =>
    `px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap border flex-1 md:flex-none text-center ${
      active
        ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
        : "bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700"
    }`;

  // Loading State
  if (isInitializing || !userCoords) {
    return (
      <div className="min-h-screen w-full bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-600 mb-4"></div>
        <p className="font-bold text-lg text-gray-900 dark:text-slate-100">
          Finding your location...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 font-sans flex flex-col">
      {/* ========================================= */}
      {/* TOP SECTION: Controls (Left) & Map (Right) */}
      {/* ========================================= */}
      <div className="flex flex-col md:flex-row w-full bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-sm md:h-[500px] lg:h-[600px]">
        {/* Left Side: Controls Panel (Tightened gaps for mobile) */}
        <div className="w-full md:w-[350px] lg:w-[400px] p-4 sm:p-6 flex flex-col gap-4 sm:gap-6 flex-shrink-0 z-10 md:overflow-y-auto">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100 mb-1">
              Live Food Map
            </h1>
            {verificationBlocked && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                <div className="font-semibold">
                  Account verification required
                </div>
                <p className="mt-1">
                  Please complete verification to start claiming pickups.
                </p>
                <button
                  onClick={() => navigate("/verify")}
                  className="mt-2 font-semibold underline"
                >
                  Go to verification page
                </button>
              </div>
            )}
            <p className="text-gray-500 dark:text-slate-400 text-xs sm:text-sm">
              Showing donations within{" "}
              <strong className="text-emerald-600 dark:text-emerald-400">
                {radius} km
              </strong>
            </p>
          </div>

          {/* Map Actions Grid */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={fetchDonations}
              disabled={isRefreshing}
              className="flex flex-col items-center justify-center py-2 sm:py-2.5 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-800/50 transition-colors disabled:opacity-60 text-xs font-bold"
            >
              <span className="text-lg mb-1">🔄</span>
              {isRefreshing ? "Wait..." : "Refresh"}
            </button>
            <button
              onClick={handleLocateMe}
              disabled={isLocating}
              className="flex flex-col items-center justify-center py-2 sm:py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-60 text-xs font-bold shadow-sm"
            >
              <span className="text-lg mb-1">🎯</span>
              {isLocating ? "Wait..." : "GPS"}
            </button>
            <button
              onClick={handleResetMap}
              className="flex flex-col items-center justify-center py-2 sm:py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-xs font-bold shadow-sm"
            >
              <span className="text-lg mb-1">🏠</span>
              Home
            </button>
          </div>

          {/* Radius Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-600 dark:text-slate-400 uppercase tracking-wider">
                Search Radius
              </label>
              <span className="text-xs font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                {radius} km
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full accent-emerald-600 dark:accent-emerald-500 h-2 bg-gray-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Right Side: Map Area */}
        <div
          ref={mapWrapperRef}
          className={`relative w-full bg-gray-200 dark:bg-slate-800 z-0 flex-shrink-0 ${
            isFullscreen
              ? "fixed inset-0 z-[9999] h-screen w-screen"
              : "h-[45vh] md:h-full md:flex-1"
          }`}
        >
          {/* Floating Helper Badge */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-gray-200 dark:border-slate-700 shadow-md px-3 py-1.5 rounded-full pointer-events-none flex items-center gap-2">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs sm:text-sm tracking-wide whitespace-nowrap">
              📍 Drag red pin to move search area
            </span>
          </div>

          {/* Custom Floating Controls */}
          <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
            <button
              onClick={handleFitArea}
              title="Fit all food in view"
              className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm text-gray-700 dark:text-slate-300 p-2 sm:p-2.5 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 sm:w-5 sm:h-5"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>

            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm text-gray-700 dark:text-slate-300 p-2 sm:p-2.5 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
            >
              {isFullscreen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 sm:w-5 sm:h-5"
                >
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 sm:w-5 sm:h-5"
                >
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                </svg>
              )}
            </button>
          </div>

          <MapContainer
            center={[userCoords.lat, userCoords.lng]}
            zoom={13}
            ref={mapRef}
            className="h-full w-full z-0"
            zoomControl={false}
          >
            {/* Bottom Right Zoom Control */}
            <div className="leaflet-bottom leaflet-right mb-4 mr-2">
              <div className="leaflet-control-zoom leaflet-bar leaflet-control">
                <a
                  className="leaflet-control-zoom-in"
                  href="#"
                  title="Zoom in"
                  role="button"
                  aria-label="Zoom in"
                  onClick={(e) => {
                    e.preventDefault();
                    mapRef.current.zoomIn();
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
                    mapRef.current.zoomOut();
                  }}
                >
                  −
                </a>
              </div>
            </div>

            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution="&copy; OpenStreetMap contributors"
            />

            <Marker
              draggable={true}
              eventHandlers={eventHandlers}
              position={[userCoords.lat, userCoords.lng]}
              icon={userIcon}
              ref={userMarkerRef}
            >
              <Popup>
                <div className="text-center p-1">
                  <strong className="text-red-600 block mb-1">
                    📍 Search Center
                  </strong>
                  <span className="text-[10px] text-gray-500 italic">
                    Drag to update search area
                  </span>
                </div>
              </Popup>
            </Marker>

            <Circle
              center={[userCoords.lat, userCoords.lng]}
              radius={radius * 1000}
              pathOptions={{
                color: "#10B981",
                fillColor: "#10B981",
                fillOpacity: 0.08,
                weight: 1.5,
              }}
            />

            {filteredDonations.map(
              (d) =>
                d.location?.coordinates && (
                  <Marker
                    key={d._id}
                    position={[
                      d.location.coordinates[1],
                      d.location.coordinates[0],
                    ]}
                  >
                    <Popup>
                      <div className="text-center p-1 min-w-[120px]">
                        <strong className="text-emerald-700 block mb-1">
                          {d.food_title}
                        </strong>
                        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded inline-block font-medium">
                          👥 Quantity: {d.quantity}
                        </span>
                      </div>
                    </Popup>
                  </Marker>
                ),
            )}
          </MapContainer>
        </div>
      </div>

      {/* ========================================= */}
      {/* BOTTOM SECTION: Full Width Results Grid   */}
      {/* ========================================= */}
      <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* NEW: Headers and Filters logically grouped together */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100">
              Available Donations
            </h2>
            <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 py-1 px-3 rounded-full text-sm font-bold border border-emerald-200 dark:border-emerald-700">
              {filteredDonations.length} Found
            </span>
          </div>

          {/* Moved Food Type Filters */}
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button
              className={filterBtnClass(filter === "all")}
              onClick={() => setFilter("all")}
            >
              All Types
            </button>
            <button
              className={filterBtnClass(filter === "vegetarian")}
              onClick={() => setFilter("vegetarian")}
            >
              🥦 Veg
            </button>
            <button
              className={filterBtnClass(filter === "non-vegetarian")}
              onClick={() => setFilter("non-vegetarian")}
            >
              🍗 Non-Veg
            </button>
          </div>
        </div>

        {filteredDonations.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-3xl p-10 sm:p-16 text-center flex flex-col items-center justify-center bg-white dark:bg-slate-900">
            <div className="text-5xl sm:text-6xl mb-4 opacity-50">📭</div>
            <h3 className="text-lg font-bold text-gray-700 dark:text-slate-300 mb-2">
              No food found nearby
            </h3>
            <p className="text-gray-500 dark:text-slate-500 text-sm max-w-md mx-auto">
              Try dragging the red map pin to a new area, expanding your search
              radius, or click Refresh.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredDonations.map((d) => (
              <DonationCard
                key={d._id}
                donation={d}
                distanceKm={
                  d.location?.coordinates
                    ? haversineDistance(
                        userCoords.lat,
                        userCoords.lng,
                        d.location.coordinates[1],
                        d.location.coordinates[0],
                      ).toFixed(2)
                    : null
                }
                onClaim={handleClaim}
                userRole={user?.role}
                isVerificationBlocked={verificationBlocked}
                onVerifyRequired={() => navigate("/verify")}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
