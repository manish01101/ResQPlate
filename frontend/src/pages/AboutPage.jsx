import React from "react";
import { Link } from "react-router-dom";

export default function AboutPage() {
  return (
    <div className="font-sans text-gray-800 dark:text-slate-200 bg-white dark:bg-slate-950">
      {/* --- HERO SECTION --- */}
      <section className="relative bg-emerald-700 text-white py-32 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6">
            About <span className="text-emerald-300">ResQPlate</span>
          </h1>
          <p className="text-xl md:text-2xl font-light text-emerald-50">
            Bridging the gap between surplus food and those who need it most.
          </p>
        </div>
      </section>

      {/* --- MISSION SECTION --- */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-serif font-bold mb-6 text-gray-900 dark:text-slate-100">
              Our Mission
            </h2>
            <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-6 text-lg">
              ResQPlate is a technology-driven platform designed to reduce food
              waste and combat hunger. We connect restaurants, event organizers,
              and households with verified NGOs and volunteers in real time.
            </p>
            <p className="text-gray-600 dark:text-slate-400 leading-relaxed text-lg">
              By leveraging geolocation, smart matching, and secure
              authentication, we ensure that surplus food reaches the right
              people before it goes to waste.
            </p>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/30 p-10 rounded-3xl border border-emerald-100 dark:border-emerald-900/40 shadow-sm">
            <h3 className="text-2xl font-bold mb-6 text-emerald-800 dark:text-emerald-300 font-serif">
              Why ResQPlate?
            </h3>
            <ul className="space-y-4 text-gray-700 dark:text-slate-300 text-lg">
              <li className="flex items-center gap-3">
                <span className="bg-emerald-200 text-emerald-700 rounded-full p-1">
                  ✔
                </span>{" "}
                Reduces food wastage efficiently
              </li>
              <li className="flex items-center gap-3">
                <span className="bg-emerald-200 text-emerald-700 rounded-full p-1">
                  ✔
                </span>{" "}
                Supports NGOs & volunteers
              </li>
              <li className="flex items-center gap-3">
                <span className="bg-emerald-200 text-emerald-700 rounded-full p-1">
                  ✔
                </span>{" "}
                Ensures safe & timely food pickup
              </li>
              <li className="flex items-center gap-3">
                <span className="bg-emerald-200 text-emerald-700 rounded-full p-1">
                  ✔
                </span>{" "}
                Promotes sustainable communities
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* --- HOW IT HELPS --- */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-slate-900/70 border-y border-gray-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-serif font-bold mb-16 text-gray-900 dark:text-slate-100">
            How We Make an Impact
          </h2>

          <div className="grid md:grid-cols-3 gap-10">
            <div className="bg-white p-10 rounded-3xl shadow-sm hover:shadow-xl transition-shadow border border-gray-100">
              <div className="text-5xl mb-6 bg-emerald-50 w-20 h-20 mx-auto rounded-2xl flex items-center justify-center">
                🍽️
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-slate-100">
                Food Rescue
              </h3>
              <p className="text-gray-600 dark:text-slate-300 leading-relaxed">
                Prevents edible food from being discarded by redirecting it to
                NGOs in need.
              </p>
            </div>

            <div className="bg-white p-10 rounded-3xl shadow-sm hover:shadow-xl transition-shadow border border-gray-100">
              <div className="text-5xl mb-6 bg-emerald-50 w-20 h-20 mx-auto rounded-2xl flex items-center justify-center">
                📍
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-slate-100">
                Smart Matching
              </h3>
              <p className="text-gray-600 dark:text-slate-300 leading-relaxed">
                Uses location-based algorithms to notify nearby verified
                receivers instantly.
              </p>
            </div>

            <div className="bg-white p-10 rounded-3xl shadow-sm hover:shadow-xl transition-shadow border border-gray-100">
              <div className="text-5xl mb-6 bg-emerald-50 w-20 h-20 mx-auto rounded-2xl flex items-center justify-center">
                🤝
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-slate-100">
                Community Driven
              </h3>
              <p className="text-gray-600 dark:text-slate-300 leading-relaxed">
                Encourages collaboration between donors, NGOs, and volunteers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- VALUES & SAFETY COMMITMENT --- */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-serif font-bold mb-6 text-gray-900 dark:text-slate-100">
            Our Values & Safety Commitment
          </h2>
          <p className="text-gray-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed text-lg mb-16">
            At ResQPlate, trust and responsibility are at the core of everything
            we do. Our platform is built to ensure food safety, transparency,
            and dignity for every individual involved in the donation process.
          </p>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100">
              <div className="text-4xl mb-4">🛡️</div>
              <h4 className="text-xl font-bold mb-3 text-emerald-800">
                Food Safety
              </h4>
              <p className="text-gray-600 text-sm">
                Expiry-based listings ensure only safe and consumable food is
                shared.
              </p>
            </div>
            <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100">
              <div className="text-4xl mb-4">🔐</div>
              <h4 className="text-xl font-bold mb-3 text-emerald-800">
                Secure Access
              </h4>
              <p className="text-gray-600 text-sm">
                Role-based authentication protects donors and verified NGOs.
              </p>
            </div>
            <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100">
              <div className="text-4xl mb-4">⚖️</div>
              <h4 className="text-xl font-bold mb-3 text-emerald-800">
                Transparency
              </h4>
              <p className="text-gray-600 text-sm">
                Every donation follows a clear claim and pickup workflow.
              </p>
            </div>
            <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100">
              <div className="text-4xl mb-4">🌍</div>
              <h4 className="text-xl font-bold mb-3 text-emerald-800">
                Social Impact
              </h4>
              <p className="text-gray-600 text-sm">
                Building sustainable communities through collaboration.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER CTA --- */}
      <section className="bg-gray-900 text-white py-20 text-center">
        <h2 className="text-3xl font-serif font-bold mb-6">
          Together, We Can End Food Waste
        </h2>
        <p className="text-gray-400 mb-10 max-w-lg mx-auto text-lg">
          Join ResQPlate today and be a part of the solution.
        </p>
        <Link to="/register">
          <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-xl font-bold shadow-lg transition-colors text-lg">
            Join ResQPlate Now
          </button>
        </Link>
      </section>
    </div>
  );
}
