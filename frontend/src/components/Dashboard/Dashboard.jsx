import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import NgoDashboard from "./NgoDashboard";
import DonorDashboard from "./DonorDashboard";
import AdminDashboard from "./AdminDashboard";

const Dashboard = () => {
  const { userRole, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  // role based rendering
  if (userRole === "donor") return <DonorDashboard />;
  if (userRole === "ngo") return <NgoDashboard />;
  if (userRole === "admin") return <AdminDashboard />;

  return <Navigate to="/" replace />;
};

export default Dashboard;
