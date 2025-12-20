import StatCard from "./StatCard";
import DonationCard from "./DonationCard";

const DonorDashboard = () => {
  const donations = [
    {
      id: 1,
      foodTitle: "Veg Biryani",
      quantity: "For 20 people",
      status: "available",
      expiryTime: "Today, 9:00 PM",
      location: "Sector 21, Noida",
    },
    {
      id: 2,
      foodTitle: "Paneer Butter Masala",
      quantity: "For 15 people",
      status: "claimed",
      expiryTime: "Today, 8:30 PM",
      location: "DLF Phase 3, Gurgaon",
    },
    {
      id: 3,
      foodTitle: "Chapati & Dal",
      quantity: "For 10 people",
      status: "completed",
      expiryTime: "Yesterday",
      location: "Indirapuram, Ghaziabad",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Welcome, Donor!</h1>
          <p className="text-gray-500 mt-1">
            Manage your food donations and impact
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <StatCard title="Total Donations" value="24" />
          <StatCard title="Meals Saved" value="550+" />
          <StatCard title="NGOs Helped" value="15" />
        </div>

        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Recent Donations
          </h3>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {donations.map((donation) => (
              <DonationCard
                key={donation.id}
                mode="donor"
                donation={donation}
              />
            ))}
          </div>
        </div>
      </main>

      <footer className="bg-gray-900 py-4 text-center text-white text-sm">
        Thank you for being part of{" "}
        <span className="font-semibold text-green-600">ResQPlate</span>
      </footer>
    </div>
  );
};

export default DonorDashboard;
