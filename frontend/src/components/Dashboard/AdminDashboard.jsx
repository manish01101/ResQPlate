import StatCard from "./StatCard";

const AdminDashboard = () => {
  const recentClaims = [
    {
      id: 1,
      ngo: "Helping Hands NGO",
      donor: "Hotel GreenLeaf",
      food: "Veg Meals (30 plates)",
      status: "Completed",
    },
    {
      id: 2,
      ngo: "Care & Share",
      donor: "Royal Event Hall",
      food: "Snacks & Juice (50 packs)",
      status: "Pending",
    },
    {
      id: 3,
      ngo: "FoodForAll",
      donor: "ABC Restaurant",
      food: "Rice & Dal",
      status: "Flagged",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 p-6 space-y-8">
        {/* Welcome */}
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800">
            Admin Dashboard 🛠️
          </h1>
          <p className="text-gray-600 mt-2">
            Monitor food donations, claims, NGOs, and donors
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard title="Total Donations" value="1,240" color="green" />
          <StatCard title="Food Claims" value="980" color="blue" />
          <StatCard title="Successful Pickups" value="910" color="emerald" />
          <StatCard title="Flagged Claims" value="12" color="yellow" />
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Active Donors" value="210" color="green" />
          <StatCard title="Registered NGOs" value="58" color="blue" />
          <StatCard title="Suspended Accounts" value="3" color="yellow" />
        </div>

        {/* Recent Claims Table */}
        <section className="bg-white p-6 rounded-2xl shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Recent Food Claims
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-gray-500 border-b">
                <tr>
                  <th className="py-2">NGO</th>
                  <th>Donor</th>
                  <th>Food</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentClaims.map((claim) => (
                  <tr key={claim.id} className="border-b">
                    <td className="py-3">{claim.ngo}</td>
                    <td>{claim.donor}</td>
                    <td>{claim.food}</td>
                    <td
                      className={`font-medium ${
                        claim.status === "Completed"
                          ? "text-green-600"
                          : claim.status === "Pending"
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {claim.status}
                    </td>
                    <td>
                      <button className="text-purple-600 font-semibold hover:underline cursor-pointer">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Admin Actions */}
        <section className="bg-white p-6 rounded-2xl shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Admin Controls
          </h2>

          <div className="flex flex-wrap gap-4">
            <button className="bg-purple-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-purple-700 cursor-pointer">
              Manage NGOs
            </button>
            <button className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 cursor-pointer">
              Manage Donors
            </button>
            <button className="bg-red-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-red-700 cursor-pointer">
              Review Flagged Claims
            </button>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 py-4 text-center text-white text-sm">
        Admin Panel • ResQPlate
      </footer>
    </div>
  );
};

export default AdminDashboard;
