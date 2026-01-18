import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-accent"></div>
            <span className="font-semibold text-sm md:text-base">DIAMOND CO.</span>
          </Link>

          <h1 className="text-xl md:text-2xl font-bold">Jewelry Design Specification Portal</h1>

          <nav className="flex items-center gap-6">
            <Link
              to="/"
              className="text-sm hover:opacity-80 transition-opacity font-medium"
            >
              Form
            </Link>
            <Link
              to="/admin"
              className="text-sm hover:opacity-80 transition-opacity font-medium"
            >
              Admin
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
