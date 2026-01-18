import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity flex-shrink-0">
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-accent"></div>
            <span className="font-semibold text-xs md:text-base">DIAMOND CO.</span>
          </Link>

          <h1 className="hidden md:block text-xl lg:text-2xl font-bold flex-1 text-center mx-4">
            Jewelry Design Specification Portal
          </h1>
          <h1 className="md:hidden text-sm font-bold flex-1 text-center mx-4">
            Design Portal
          </h1>

          <nav className="flex items-center gap-3 md:gap-6 flex-shrink-0">
            <Link
              to="/"
              className="text-xs md:text-sm hover:opacity-80 transition-opacity font-medium"
            >
              Form
            </Link>
            <Link
              to="/admin"
              className="text-xs md:text-sm hover:opacity-80 transition-opacity font-medium"
            >
              Admin
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
