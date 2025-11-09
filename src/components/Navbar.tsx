import { Link, useLocation } from "react-router-dom";
import { Database, Wallet,RefreshCw} from "lucide-react";

const Navbar = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="glass-card border-b sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center glow-effect">
              <Database className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold gradient-text">Proof of Reserve</span>
          </Link>
          
          <div className="flex gap-2">
            <Link
              to="/"
              className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                isActive("/")
                  ? "bg-primary text-primary-foreground glow-effect"
                  : "bg-secondary/50 text-foreground hover:bg-secondary"
              }`}
            >
              Submit Proof
            </Link>
            <Link
              to="/assets"
              className={`px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                isActive("/assets")
                  ? "bg-primary text-primary-foreground glow-effect"
                  : "bg-secondary/50 text-foreground hover:bg-secondary"
              }`}
            >
              <Wallet className="w-4 h-4" />
              Assets
            </Link>

            <Link
              to="/pegstatus"
              className={`px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                isActive("/pegstatus")
                  ? "bg-primary text-primary-foreground glow-effect"
                  : "bg-secondary/50 text-foreground hover:bg-secondary"
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              Peg Status
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
