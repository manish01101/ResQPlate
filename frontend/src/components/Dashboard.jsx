import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// import DonorDashboard from "./DonorDashboard";
// import NgoDashboard from "./NgoDashboard";
// import AdminDashboard from "./AdminDashboard";

const Dashboard = () => {
  const { userRole, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  // role based rendering
  if (userRole === "donor") return <div>hi donor dashboard</div>; //<DonorDashboard />;
  if (userRole === "ngo") return <div>hi ngo dashboard</div>; // <NgoDashboard />;
  if (userRole === "admin") return <div>hi admin dashboard</div>; //<AdminDashboard />;

  return <Navigate to="/" replace />;
};

export default Dashboard;
