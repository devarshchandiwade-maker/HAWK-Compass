import { Routes, Route } from "react-router-dom";
import "./index.css";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Settings from "./pages/Settings";
import Footer from "./components/Footer";

function App() {

    return (

        <>

      

        <Routes>

            <Route
                path="/"
                element={<Login />}
            />

            <Route
                path="/dashboard"
                element={<Dashboard />}
            />

            <Route
                path="/admin"
                element={<AdminLogin />}
            />

            <Route
                path="/admin/dashboard"
                element={<AdminDashboard />}
            />

            <Route
                path="/settings"
                element={<Settings />}
            />

        </Routes>
        <Footer/>
        </>
      
    );

}

export default App;