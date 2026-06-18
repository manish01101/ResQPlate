import React, { useState, useEffect, useRef } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Component to handle map clicks and reverse geocoding
function LocationPicker({ position, setPosition, setAddress }) {
  const map = useMap();

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());

      // Reverse Geocoding (Convert Lat/Lng to Street Address)
      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}`,
      )
        .then((res) => res.json())
        .then((data) => {
          if (data && data.display_name) {
            setAddress(data.display_name);
          }
        })
        .catch((err) => console.error("Geocoding failed", err));
    },
  });

  // Automatically fly to user's position when it updates externally (via GPS button)
  useEffect(() => {
    if (position) {
      map.flyTo(position, 15, { animate: true });
    }
  }, [position, map]);

  return position === null ? null : <Marker position={position}></Marker>;
}

export default function DonatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    food_title: "",
    quantity: "",
    food_type: "vegetarian",
    expiry_datetime: "",
    notes: "",
    address: "",
    image_url: "",
  });

  // Set default map center (User's saved location or Kolkata)
  const defaultLat = user?.location?.coordinates?.[1] || 22.581373;
  const defaultLng = user?.location?.coordinates?.[0] || 88.349279;
  const [position, setPosition] = useState({
    lat: defaultLat,
    lng: defaultLng,
  });

  const [isLocating, setIsLocating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleImageSelection = (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, image_url: reader.result }));
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    handleImageSelection(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleImageSelection(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const openCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera access is not supported in this browser.");
      return;
    }

    try {
      setCameraError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
    } catch (err) {
      setCameraError("Camera access was denied or is unavailable.");
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setForm((prev) => ({ ...prev, image_url: dataUrl }));
    setError("");
    stopCameraStream();
    setIsCameraOpen(false);
  };

  useEffect(() => {
    return () => stopCameraStream();
  }, []);

  useEffect(() => {
    if (isCameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [isCameraOpen]);

  // HTML5 Geolocation
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPosition(newPos);

        // Reverse geocode the GPS location
        fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newPos.lat}&lon=${newPos.lng}`,
        )
          .then((res) => res.json())
          .then((data) => {
            if (data && data.display_name)
              setForm((prev) => ({ ...prev, address: data.display_name }));
          });

        setIsLocating(false);
      },
      (err) => {
        setError(
          "Failed to fetch location. Please check your browser permissions.",
        );
        setIsLocating(false);
      },
      { enableHighAccuracy: true },
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const location = {
        type: "Point",
        coordinates: [position.lng, position.lat], // MongoDB requires [lng, lat]
        address: form.address || "User specified location",
      };

      const res = await api.post("/donations", { ...form, location });
      setResult(res.data);
      setForm({
        food_title: "",
        quantity: "",
        food_type: "vegetarian",
        expiry_datetime: "",
        notes: "",
        address: "",
        image_url: "",
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to post donation.");
    } finally {
      setLoading(false);
    }
  };

  const inputClasses =
    "mt-1 block w-full rounded-md border-gray-300 dark:border-slate-700 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-3 border bg-gray-50 dark:bg-slate-800 dark:text-slate-100 transition-colors";
  const labelClasses =
    "block text-sm font-medium text-gray-700 dark:text-slate-300";

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight font-serif">
          Post a Food Donation
        </h1>
        <p className="mt-2 text-lg text-gray-500 dark:text-slate-400">
          Provide details about your surplus food to notify nearby NGOs.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 shadow-xl shadow-gray-200/50 dark:shadow-slate-950/30 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800">
        <div className="px-4 py-5 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className={labelClasses}>
                Food Title <span className="text-red-500">*</span>
              </label>
              <input
                name="food_title"
                value={form.food_title}
                onChange={handleChange}
                placeholder="e.g., 2 Trays of Veg Biryani"
                required
                className={inputClasses}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className={labelClasses}>
                  Quantity / Servings <span className="text-red-500">*</span>
                </label>
                <input
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  placeholder="e.g., Serves 20 people"
                  required
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>Dietary Type</label>
                <select
                  name="food_type"
                  value={form.food_type}
                  onChange={handleChange}
                  className={inputClasses}
                >
                  <option value="vegetarian">🥦 Vegetarian</option>
                  <option value="non-vegetarian">🍗 Non-Vegetarian</option>
                  <option value="vegan">🌿 Vegan</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClasses}>
                Expiry Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="expiry_datetime"
                value={form.expiry_datetime}
                onChange={handleChange}
                required
                className={inputClasses}
              />
              <p className="mt-1 text-xs text-gray-500">
                Donation will automatically disappear from the map after this
                time.
              </p>
            </div>

            {/* ================= LOCATION PICKER ================= */}
            <div className="bg-gray-50 dark:bg-slate-800/70 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
              <div className="flex justify-between items-end mb-3">
                <label className={labelClasses}>
                  Pinpoint Pickup Location{" "}
                  <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={isLocating}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-100/50 px-3 py-1.5 rounded-md border border-emerald-200 transition-colors flex items-center gap-1 dark:text-emerald-900"
                >
                  {isLocating ? "Locating..." : "🎯 Get Current GPS"}
                </button>
              </div>

              <div className="h-[250px] w-full rounded-xl overflow-hidden border border-gray-300 dark:border-slate-700 mb-3 relative z-0">
                <MapContainer
                  center={position}
                  zoom={13}
                  className="h-full w-full"
                >
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                  <LocationPicker
                    position={position}
                    setPosition={setPosition}
                    setAddress={(addr) =>
                      setForm((prev) => ({ ...prev, address: addr }))
                    }
                  />
                </MapContainer>
              </div>

              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-2">
                Click anywhere on the map to adjust the pin.
              </p>

              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Full Street Address"
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-3 border bg-white transition-colors"
              />
            </div>
            {/* ============================================================== */}

            <div>
              <label className={labelClasses}>Food Image (optional)</label>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`mt-2 rounded-xl border-2 border-dashed p-4 transition-all ${
                  isDragging
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                    : "border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/70"
                }`}
              >
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-8 text-center hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <div className="text-3xl mb-3">📤</div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                    Drag & drop an image here, or tap to browse your gallery
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                    Photos help receivers recognize the food quickly.
                  </p>
                </label>
              </div>

              <div className="mt-3 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={openCamera}
                  className="flex-1 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300"
                >
                  📷 Open Camera
                </button>

                <div className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-3 text-center text-sm text-gray-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  Or paste an image URL below
                </div>
              </div>

              {cameraError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {cameraError}
                </p>
              )}

              {isCameraOpen && (
                <div className="mt-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full rounded-lg"
                  />
                  <div className="mt-3 flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Capture Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        stopCameraStream();
                        setIsCameraOpen(false);
                      }}
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Close Camera
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-3">
                <input
                  name="image_url"
                  value={form.image_url}
                  onChange={handleChange}
                  placeholder="Or paste an image URL"
                  className={inputClasses}
                />
              </div>

              {form.image_url && (
                <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700">
                  <img
                    src={form.image_url}
                    alt="Food preview"
                    className="max-h-64 w-full object-contain bg-gray-100 dark:bg-slate-950"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <label className={labelClasses}>Additional Instructions</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Gate code, packaging details, contact person, etc."
                rows={3}
                className={inputClasses}
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-950/40 p-4 border border-red-200 dark:border-red-900/50 text-sm font-medium text-red-800 dark:text-red-200">
                {error}
              </div>
            )}

            {result ? (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-6 border border-emerald-200 dark:border-emerald-900/50 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
                  <svg
                    className="h-6 w-6 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-200 mb-2">
                  Donation Published Successfully!
                </h3>
                <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-6">
                  Nearby volunteers have been prioritized and notified.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => navigate("/dashboard")}
                    className="inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-bold rounded-lg shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
                  >
                    Return to Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setResult(null);
                      setForm({
                        food_title: "",
                        quantity: "",
                        food_type: "vegetarian",
                        expiry_datetime: "",
                        notes: "",
                        address: form.address,
                      });
                    }}
                    className="inline-flex items-center justify-center px-6 py-2.5 border-2 border-emerald-600 text-sm font-bold rounded-lg text-emerald-700 bg-white hover:bg-emerald-50 w-full sm:w-auto"
                  >
                    Donate Another Item
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white transition-all ${loading ? "bg-emerald-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"}`}
                >
                  {loading ? "Processing..." : "Publish Donation"}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
