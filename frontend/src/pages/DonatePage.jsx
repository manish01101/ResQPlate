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

function LocationPicker({ position, setPosition, setAddress }) {
  const map = useMap();

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());

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

  const handleImageChange = (e) => handleImageSelection(e.target.files?.[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleImageSelection(e.dataTransfer.files?.[0]);
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
    setForm((prev) => ({
      ...prev,
      image_url: canvas.toDataURL("image/jpeg", 0.9),
    }));
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
      () => {
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
        coordinates: [position.lng, position.lat],
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

  // Updated Styling Variables for better contrast and visibility
  const inputClasses =
    "mt-2 block w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3.5 text-gray-900 dark:text-slate-100 placeholder-gray-400 shadow-sm outline-none transition-all duration-200 hover:border-gray-400 dark:hover:border-slate-500 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:focus:border-emerald-500 sm:text-sm";
  const labelClasses =
    "block text-sm font-bold text-gray-800 dark:text-slate-200 tracking-wide";
  const sectionClasses =
    "bg-gray-50/60 dark:bg-slate-800/40 p-6 sm:p-8 rounded-[1.5rem] border border-gray-200 dark:border-slate-700/80";

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight mb-3">
          Share Your Surplus
        </h1>
        <p className="text-lg text-gray-500 dark:text-slate-400 max-w-xl mx-auto">
          Provide a few details about your food to notify verified NGOs and
          community fridges nearby.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 shadow-2xl shadow-emerald-900/5 dark:shadow-slate-950/50 rounded-[2rem] overflow-hidden border border-gray-100 dark:border-slate-800">
        <div className="p-6 sm:p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* --- SECTION 1: FOOD DETAILS --- */}
            <div className={sectionClasses}>
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 p-2 rounded-lg">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </span>
                Food Details
              </h2>
              <div className="space-y-6">
                <div>
                  <label className={labelClasses}>
                    What are you donating?{" "}
                    <span className="text-red-500">*</span>
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
                      Quantity / Servings{" "}
                      <span className="text-red-500">*</span>
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
                      <option value="vegetarian">Vegetarian</option>
                      <option value="non-vegetarian">Non-Vegetarian</option>
                      <option value="vegan">Vegan</option>
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
                  <p className="mt-2 text-sm text-gray-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                    <svg
                      className="w-4 h-4 text-emerald-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Listing will be auto-removed after this time.
                  </p>
                </div>
              </div>
            </div>

            {/* --- SECTION 2: LOCATION --- */}
            <div className={sectionClasses}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 p-2 rounded-lg">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </span>
                  Pickup Location
                </h2>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={isLocating}
                  className="text-sm font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 hover:border-emerald-500 dark:hover:border-emerald-500 hover:text-emerald-600 shadow-sm px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                    />
                  </svg>
                  {isLocating ? "Locating..." : "Use Current Location"}
                </button>
              </div>

              <div className="space-y-4">
                <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-gray-300 dark:border-slate-600 shadow-inner relative z-0 group">
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
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-5 py-2 rounded-full shadow-md border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-700 dark:text-slate-300 pointer-events-none transition-opacity opacity-100 group-hover:opacity-0">
                    Tap map to adjust pin
                  </div>
                </div>

                <div>
                  <label className="sr-only">Address</label>
                  <input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Full Street Address"
                    required
                    className={inputClasses}
                  />
                </div>
              </div>
            </div>

            {/* --- SECTION 3: MEDIA & NOTES --- */}
            <div className={sectionClasses}>
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 p-2 rounded-lg">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </span>
                Media & Instructions
              </h2>

              <div className="space-y-6">
                <div>
                  <label className={labelClasses}>
                    Food Image (Recommended)
                  </label>
                  {!form.image_url && !isCameraOpen ? (
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      className={`mt-2 rounded-2xl border-2 border-dashed p-8 transition-all ${
                        isDragging
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                          : "border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:border-gray-400 dark:hover:border-slate-500"
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="bg-gray-100 dark:bg-slate-800 p-3 rounded-full mb-4">
                          <svg
                            className="w-8 h-8 text-gray-500 dark:text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                        </div>
                        <p className="text-sm font-bold text-gray-700 dark:text-slate-200">
                          Drag & drop or{" "}
                          <label className="text-emerald-600 dark:text-emerald-400 cursor-pointer hover:underline">
                            browse
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="hidden"
                            />
                          </label>
                        </p>

                        <div className="flex items-center gap-4 mt-6 w-full max-w-xs">
                          <div className="h-px bg-gray-200 dark:bg-slate-700 flex-1"></div>
                          <span className="text-xs font-bold text-gray-400 dark:text-slate-500">
                            OR
                          </span>
                          <div className="h-px bg-gray-200 dark:bg-slate-700 flex-1"></div>
                        </div>

                        <button
                          type="button"
                          onClick={openCamera}
                          className="mt-6 px-6 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-gray-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm flex items-center gap-2"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          Take a Picture
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {/* Camera View */}
                  {isCameraOpen && (
                    <div className="mt-2 rounded-2xl border border-gray-300 dark:border-slate-600 bg-gray-900 overflow-hidden relative shadow-inner">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-auto max-h-[400px] object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex gap-3 justify-center">
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-full font-bold shadow-lg transition-transform hover:scale-105"
                        >
                          Capture
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            stopCameraStream();
                            setIsCameraOpen(false);
                          }}
                          className="bg-white/20 hover:bg-white/30 text-white px-8 py-3 rounded-full font-bold backdrop-blur-md transition-all border border-white/20"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Image Preview */}
                  {form.image_url && !isCameraOpen && (
                    <div className="mt-3 relative rounded-2xl overflow-hidden border border-gray-300 dark:border-slate-600 shadow-sm group">
                      <img
                        src={form.image_url}
                        alt="Food preview"
                        className="w-full h-72 object-cover bg-gray-100 dark:bg-slate-900"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <button
                          type="button"
                          onClick={() =>
                            setForm((p) => ({ ...p, image_url: "" }))
                          }
                          className="bg-red-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Remove Image
                        </button>
                      </div>
                    </div>
                  )}

                  {!isCameraOpen && !form.image_url && (
                    <div className="mt-4">
                      <input
                        name="image_url"
                        value={form.image_url}
                        onChange={handleChange}
                        placeholder="Or paste an image URL here..."
                        className={inputClasses}
                      />
                    </div>
                  )}
                  {cameraError && (
                    <p className="mt-2 text-sm font-medium text-red-500">
                      {cameraError}
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelClasses}>
                    Pickup Instructions (Optional)
                  </label>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Gate code, packaging details, contact person..."
                    rows={3}
                    className={`${inputClasses} resize-none`}
                  />
                </div>
              </div>
            </div>

            {/* --- ERROR & SUBMIT --- */}
            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-sm font-bold text-red-800 dark:text-red-200 shadow-sm">
                <svg
                  className="w-5 h-5 text-red-500 shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {error}
              </div>
            )}

            {result ? (
              <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 p-8 border border-emerald-200 dark:border-emerald-800 text-center shadow-inner animate-in fade-in zoom-in duration-300">
                <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-white dark:bg-emerald-800/50 shadow-sm border border-emerald-100 dark:border-emerald-700/50 mb-6">
                  <svg
                    className="h-10 w-10 text-emerald-600 dark:text-emerald-400"
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
                <h3 className="text-3xl font-extrabold text-emerald-900 dark:text-emerald-100 mb-3">
                  Donation Published!
                </h3>
                <p className="text-lg text-emerald-700 dark:text-emerald-300 mb-8 font-medium">
                  Nearby volunteers and NGOs have been notified. Thank you for
                  your generosity.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => navigate("/dashboard")}
                    className="px-8 py-3.5 rounded-xl shadow-lg shadow-emerald-600/20 text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto transition-all hover:-translate-y-0.5"
                  >
                    Return to Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setResult(null);
                      setForm({
                        ...form,
                        food_title: "",
                        quantity: "",
                        image_url: "",
                        notes: "",
                      });
                    }}
                    className="px-8 py-3.5 border-2 border-emerald-200 dark:border-emerald-800 text-base font-bold rounded-xl text-emerald-700 dark:text-emerald-300 bg-white dark:bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-900/30 w-full sm:w-auto transition-all"
                  >
                    Donate Another Item
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center items-center gap-3 py-4 px-4 border border-transparent rounded-xl shadow-xl text-lg font-extrabold text-white transition-all duration-200 ${
                    loading
                      ? "bg-emerald-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
                  }`}
                >
                  {loading && (
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  )}
                  {loading ? "Publishing..." : "Publish Donation"}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
