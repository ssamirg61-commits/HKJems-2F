import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, Settings } from "lucide-react";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-90 transition-opacity flex-shrink-0"
          >
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-accent"></div>
            <span className="font-semibold text-xs md:text-base">
              DIAMOND CO.
            </span>
          </Link>

          <h1 className="hidden md:block text-xl lg:text-2xl font-bold flex-1 text-center mx-4">
            Jewelry Design Specification Portal
          </h1>
          <h1 className="md:hidden text-sm font-bold flex-1 text-center mx-4">
            Design Portal
          </h1>

          <nav className="flex items-center gap-3 md:gap-6 flex-shrink-0">
            {user ? (
              <>
                {/* Role-based navigation */}
                {user.role === "USER" && (
                  <Link
                    to="/"
                    className="text-xs md:text-sm hover:opacity-80 transition-opacity font-medium"
                  >
                    My Designs
                  </Link>
                )}

                {user.role === "ADMIN" && (
                  <>
                    <Link
                      to="/admin"
                      className="text-xs md:text-sm hover:opacity-80 transition-opacity font-medium"
                    >
                      Admin Panel
                    </Link>
                    <Link
                      to="/admin/users"
                      className="text-xs md:text-sm hover:opacity-80 transition-opacity font-medium"
                    >
                      Users
                    </Link>
                  </>
                )}

                {/* User menu */}
                <div className="flex items-center gap-2 md:gap-3 pl-3 md:pl-6 border-l border-primary-foreground/20">
                  <div className="hidden md:flex flex-col items-end">
                    <p className="text-xs font-medium">{user.name}</p>
                    <p className="text-xs opacity-75 capitalize">{user.role}</p>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="text-xs md:text-sm hover:opacity-80 transition-opacity font-medium flex items-center gap-1"
                    title="Logout"
                  >
                    <LogOut size={16} />
                    <span className="hidden md:inline">Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs md:text-sm"
                  >
                    Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm" className="text-xs md:text-sm bg-accent">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
