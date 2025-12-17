import { Link } from "react-router-dom";

const Logo = ({ className = "text-gray-800" }) => {
  return (
    <Link
      to="/"
      className={`flex items-center gap-2 group ${className} transition-opacity hover:opacity-90`}
    >
      <span className="text-2xl font-extrabold tracking-tight font-sans">
        ResQ<span className="text-green-600">Plate</span>
      </span>
    </Link>
  );
};

export default Logo;
