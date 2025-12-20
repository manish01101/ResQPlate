import StatCard from "./StatCard";
import DonationCard from "./DonationCard";

const NgoDashboard = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* MAIN CONTENT */}
      <main className="flex-1 space-y-8 p-6">
        {/* Welcome */}
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome, NGO Partner 👋
          </h1>
          <p className="text-gray-600 mt-2">
            View available food donations and manage your pickups efficiently.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard title="Available Donations" value="3" color="green" />
          <StatCard title="Accepted Today" value="0" color="blue" />
          <StatCard title="Completed Pickups" value="128" color="emerald" />
          <StatCard title="Pending Pickups" value="3" color="yellow" />
        </div>

        {/* Donations */}
        <section className="bg-white p-6 rounded-2xl shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Available Food Donations
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <DonationCard
              mode="ngo"
              location="Hotel GreenLeaf"
              food="Veg Meals (30 plates)"
              time="Pickup before 8 PM"
            />
            <DonationCard
              mode="ngo"
              location="Event Hall Royal"
              food="Snacks & Juice (50 packs)"
              time="Pickup before 7 PM"
            />
            <DonationCard
              mode="ngo"
              location="ABC Restaurant"
              food="Cooked Rice & Curry"
              time="Pickup before 9 PM"
            />
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-center py-4 text-sm text-white">
        Together, we’re ensuring food reaches those who need it most 🤝
      </footer>
    </div>
  );
};

export default NgoDashboard;
