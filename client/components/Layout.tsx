import Header from "./Header";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">{children}</main>
      <footer className="bg-primary text-primary-foreground text-sm py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <p>&copy; 2024 Diamond Co. All rights reserved</p>
          <div className="flex gap-4">
            <a href="#" className="hover:opacity-80 transition-opacity">
              Privacy Policy
            </a>
            <a href="#" className="hover:opacity-80 transition-opacity">
              Terms
            </a>
            <a href="#" className="hover:opacity-80 transition-opacity">
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
