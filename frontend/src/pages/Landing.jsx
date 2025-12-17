import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="font-sans text-gray-800">
      {/* --- HERO SECTION --- */}
      <section className="relative bg-green-600 text-white h-[90vh] flex flex-col justify-center items-center text-center px-6">
        <div className="absolute inset-0 bg-black opacity-40"></div>{" "}
        {/* Overlay */}
        <div className="relative z-10 max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            Share Food, <span className="text-green-300">Save Lives.</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto font-light">
            Connect your surplus food with local NGOs in real-time. Join the
            movement to end hunger and reduce waste today.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/register?role=donor">
              <button className="bg-white text-green-700 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition shadow-lg transform hover:-translate-y-1">
                Donate Food
              </button>
            </Link>
            <Link to="/register?role=ngo">
              <button className="border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-green-700 transition shadow-lg">
                I Need Food
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* --- STATS SECTION --- */}
      <section className="bg-white py-12 shadow-md -mt-16 relative z-20 mx-4 md:mx-20 rounded-xl flex justify-around text-center border-b-4 border-green-500">
        <div>
          <h3 className="text-4xl font-extrabold text-green-600">1,200+</h3>
          <p className="text-gray-500 font-medium mt-2">Meals Saved</p>
        </div>
        <div>
          <h3 className="text-4xl font-extrabold text-green-600">50+</h3>
          <p className="text-gray-500 font-medium mt-2">Partner NGOs</p>
        </div>
        <div>
          <h3 className="text-4xl font-extrabold text-green-600">500 kg</h3>
          <p className="text-gray-500 font-medium mt-2">CO2 Reduced</p>
        </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-16 text-gray-800">
            How ResQPlate Works
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            {/* Step 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition duration-300">
              <div className="bg-green-100 w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 text-4xl">
                🍽️
              </div>
              <h3 className="text-xl font-bold mb-3">1. Post Food</h3>
              <p className="text-gray-600 leading-relaxed">
                Restaurants or event hosts enter details of leftover food,
                quantity, and pickup time.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition duration-300">
              <div className="bg-blue-100 w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 text-4xl">
                📍
              </div>
              <h3 className="text-xl font-bold mb-3">2. Locate Match</h3>
              <p className="text-gray-600 leading-relaxed">
                Our system notifies nearby verified NGOs and volunteers
                instantly via the Map.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition duration-300">
              <div className="bg-orange-100 w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 text-4xl">
                🚚
              </div>
              <h3 className="text-xl font-bold mb-3">3. Pickup & Feed</h3>
              <p className="text-gray-600 leading-relaxed">
                Volunteers claim the donation, pick it up, and distribute it to
                those in need.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- CALL TO ACTION (Footer Style) --- */}
      <section className="bg-gray-900 text-white py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to make a difference?</h2>
        <p className="text-gray-400 mb-8 max-w-lg mx-auto">
          Join hundreds of other donors and volunteers making our city
          hunger-free.
        </p>
        <Link to="/register">
          <button className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-lg font-semibold transition">
            Join ResQPlate Now
          </button>
        </Link>
        <p className="mt-12 text-gray-600 text-sm">
          © 2025 ResQPlate Project. Built for Social Good.
        </p>
      </section>
    </div>
  );
};

export default Landing;
