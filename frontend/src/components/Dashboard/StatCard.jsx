const colorMap = {
  green: "text-green-600",
  blue: "text-blue-600",
  emerald: "text-emerald-600",
  yellow: "text-yellow-600",
};

const StatCard = ({ title, value, color = "green" }) => {
  return (
    <div className="bg-gray-200 p-6 rounded-2xl shadow-sm  hover:shadow-lg transition">
      <p className="text-gray-500 text-sm mb-1">{title}</p>
      <h3 className={`text-3xl font-bold ${colorMap[color]}`}>{value}</h3>
    </div>
  );
};

export default StatCard;
