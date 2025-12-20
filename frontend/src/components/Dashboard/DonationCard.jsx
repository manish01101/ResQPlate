const DonationCard = ({
  location,
  food,
  time,
  donation,
  mode = "ngo", // "ngo" | "donor"
}) => {
  // NGO CARD
  if (mode === "ngo") {
    return (
      <div className="border rounded-xl p-5 hover:shadow-md transition">
        <h3 className="font-semibold">{location}</h3>
        <p className="text-gray-600">{food}</p>
        <p className="text-sm text-gray-500">{time}</p>

        <button className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg cursor-pointer">
          Accept Pickup
        </button>
      </div>
    );
  }

  // DONOR CARD
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-gray-800">
            {donation.foodTitle}
          </h3>
          <p className="text-sm text-gray-500">Quantity: {donation.quantity}</p>
        </div>

        <span
          className={`text-xs px-3 py-1 rounded-full font-semibold ${
            donation.status === "available"
              ? "bg-green-100 text-green-700"
              : donation.status === "claimed"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          {donation.status.toUpperCase()}
        </span>
      </div>

      <div className="mt-4 text-sm text-gray-600 space-y-1">
        <p>⏰ Expires at: {donation.expiryTime}</p>
        <p>📍 Pickup Location: {donation.location}</p>
      </div>

      <div className="mt-6 flex gap-3">
        <button className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer">
          View Details
        </button>

        {donation.status === "available" && (
          <button className="flex-1 bg-red-500 text-white py-2 rounded-lg font-semibold hover:bg-red-600 cursor-pointer">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default DonationCard;
