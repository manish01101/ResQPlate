import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Leaflet Default Icon
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Interactive Map Picker Component
function LocationPicker({
  position,
  setPosition,
  setAddress,
  setIsFetchingAddress,
}) {
  const map = useMap();

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());

      // Immediately provide visual feedback in the input box
      setIsFetchingAddress(true);
      setAddress("Fetching street address...");

      // Fetch the new address
      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}`,
        {
          headers: {
            "Accept-Language": "en-US,en;q=0.9", // Forces English results
          },
        },
      )
        .then((res) => res.json())
        .then((data) => {
          if (data && data.display_name) {
            setAddress(data.display_name);
          } else {
            setAddress("");
          }
        })
        .catch((err) => {
          console.error("Geocoding failed", err);
          setAddress("");
        })
        .finally(() => {
          setIsFetchingAddress(false);
        });
    },
  });

  // Automatically pan to user's position when it updates externally (via GPS button)
  useEffect(() => {
    if (position) {
      map.flyTo(position, 14, { animate: true });
    }
  }, [position, map]);

  return position ? <Marker position={position} /> : null;
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "donor",
    phone: "",
    location: {
      type: "Point",
      coordinates: [0, 0], // MongoDB format: [lng, lat]
      address: "",
    },
  });

  // Default Map Center
  const defaultPos = { lat: 22.5726, lng: 88.3639 };
  const [position, setPosition] = useState(defaultPos);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);

  // Sync Map Position -> Form Coordinates
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      location: { ...prev.location, coordinates: [position.lng, position.lat] },
    }));
  }, [position]);

  // Try to get user's current geolocation on mount
  useEffect(() => {
    handleGetLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      setIsFetchingAddress(true);
      setForm((prev) => ({
        ...prev,
        location: { ...prev.location, address: "Fetching GPS location..." },
      }));

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setPosition(newPos);

          fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newPos.lat}&lon=${newPos.lng}`,
            { headers: { "Accept-Language": "en-US,en;q=0.9" } },
          )
            .then((res) => res.json())
            .then((data) => {
              if (data && data.display_name) {
                setForm((prev) => ({
                  ...prev,
                  location: { ...prev.location, address: data.display_name },
                }));
              } else {
                setForm((prev) => ({
                  ...prev,
                  location: { ...prev.location, address: "" },
                }));
              }
            })
            .catch(() => {
              setForm((prev) => ({
                ...prev,
                location: { ...prev.location, address: "" },
              }));
            })
            .finally(() => {
              setIsLocating(false);
              setIsFetchingAddress(false);
            });
        },
        (error) => {
          console.warn("Location access denied or failed.");
          setIsLocating(false);
          setIsFetchingAddress(false);
          setForm((prev) => ({
            ...prev,
            location: { ...prev.location, address: "" },
          }));
        },
        { enableHighAccuracy: true },
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (
        form.location.coordinates[0] === 0 &&
        form.location.coordinates[1] === 0
      ) {
        setError("Please select a location on the map.");
        setLoading(false);
        return;
      }
      const user = await register(form);
      navigate(user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          "Registration failed",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "address") {
      setForm((prev) => ({
        ...prev,
        location: { ...prev.location, address: value },
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const inputClasses =
    "w-full p-3 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-colors";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-100 to-gray-50 dark:from-slate-950 dark:to-slate-900 p-4 w-full py-12">
      <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-2xl shadow-xl w-full max-w-lg border border-gray-100 dark:border-slate-800">
        <div className="text-center mb-8">
          <div className="font-serif text-3xl font-bold text-emerald-700 mb-2">
            ResQPlate
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
            Create Account
          </h2>
          <p className="text-gray-500 dark:text-slate-400 mt-1">
            Join the food rescue community.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center mb-6 text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <input
              type="text"
              name="name"
              placeholder="Full Name / Org Name"
              value={form.name}
              onChange={handleChange}
              required
              className={inputClasses}
            />
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={form.phone}
              onChange={handleChange}
              required
              className={inputClasses}
            />
          </div>

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            required
            className={inputClasses}
          />
          <input
            type="password"
            name="password"
            placeholder="Password (min 6 chars)"
            value={form.password}
            onChange={handleChange}
            required
            className={inputClasses}
          />

          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            required
            className={inputClasses}
          >
            <option value="donor">Donor (I have food to give)</option>
            <option value="ngo">NGO / Volunteer (I can collect food)</option>
          </select>

          {/* --- INTERACTIVE MAP SECTION --- */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-6">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-bold text-gray-700">
                Pinpoint your Location <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={isLocating}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-100/50 px-3 py-1.5 rounded-md border border-emerald-200 transition-colors"
              >
                {isLocating ? "Locating..." : "🎯 Auto-GPS"}
              </button>
            </div>

            <div className="h-[200px] w-full rounded-xl overflow-hidden border border-gray-300 relative z-0 mb-3">
              <MapContainer
                center={position}
                zoom={13}
                className="h-full w-full"
              >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                <LocationPicker
                  position={position}
                  setPosition={setPosition}
                  setIsFetchingAddress={setIsFetchingAddress}
                  setAddress={(addr) =>
                    setForm((prev) => ({
                      ...prev,
                      location: { ...prev.location, address: addr },
                    }))
                  }
                />
              </MapContainer>
            </div>

            <p className="text-[11px] text-gray-500 mb-3 text-center">
              Click anywhere on the map to place your pin accurately.
            </p>

            <div className="relative">
              <input
                type="text"
                name="address"
                placeholder="Full Street Address"
                value={form.location.address}
                onChange={handleChange}
                required
                disabled={isFetchingAddress}
                className={`${inputClasses} bg-white disabled:bg-gray-100 disabled:text-gray-500`}
              />
              {/* Spinner inside input to show it's working */}
              {isFetchingAddress && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                </div>
              )}
            </div>
          </div>
          {/* ------------------------------- */}

          <button
            type="submit"
            disabled={loading || isFetchingAddress}
            className={`w-full py-3.5 text-white font-bold rounded-xl transition-all shadow-md mt-6 ${
              loading || isFetchingAddress
                ? "bg-emerald-400 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700 hover:-translate-y-0.5"
            }`}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center mt-8 text-gray-600 text-sm">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-emerald-600 font-bold hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
