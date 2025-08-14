import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Web3Provider } from "./context/Web3Context";
import Navbar from "./components/Navbar";
import Homepage from "./pages/Homepage";
import Buy from "./pages/Buy";
import Play from "./pages/Play";
import Leaderboard from "./pages/Leaderboard";

function App() {
  return (
    <Web3Provider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
          <Navbar />
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/buy" element={<Buy />} />
            <Route path="/play" element={<Play />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Routes>

          {/* Toast notifications */}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "rgba(0, 0, 0, 0.8)",
                color: "white",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              },
              success: {
                iconTheme: {
                  primary: "#10B981",
                  secondary: "white",
                },
              },
              error: {
                iconTheme: {
                  primary: "#EF4444",
                  secondary: "white",
                },
              },
            }}
          />
        </div>
      </Router>
    </Web3Provider>
  );
}

export default App;
