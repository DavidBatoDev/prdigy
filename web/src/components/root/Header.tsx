import { Link } from "@tanstack/react-router";
import { Button } from "@/ui/button";
import Logo from "/prodigylogos/light/logo1.svg";
import { useAuthStore } from "@/stores/authStore";
import UserMenu from "../auth/UserMenu";
import { Menu } from "lucide-react";
import { useState } from "react";

export const Header = () => {
  const { isAuthenticated } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "How It Works", href: "#how-it-works" },
    { label: "For Clients", href: "#for-clients" },
    { label: "For Consultants", href: "#for-consultants" },
    { label: "Templates", href: "#templates" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
      <nav className="container mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src={Logo} alt="Prodigy Logo" className="h-8" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-gray-700 hover:text-primary transition-colors font-medium"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <UserMenu />
                <Link to="/dashboard">
                  <Button variant="contained" colorScheme="primary">
                    Dashboard
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/auth/login">
                  <Button variant="text" colorScheme="primary">
                    Login
                  </Button>
                </Link>
                <Link to="/auth/signup" search={{ redirect: undefined }}>
                  <Button variant="contained" colorScheme="primary">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-gray-700 hover:text-primary transition-colors font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <div className="pt-4 border-t flex flex-col space-y-2">
                {isAuthenticated ? (
                  <Link to="/dashboard">
                    <Button
                      variant="contained"
                      colorScheme="primary"
                      className="w-full"
                    >
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/auth/login">
                      <Button
                        variant="outlined"
                        colorScheme="primary"
                        className="w-full"
                      >
                        Login
                      </Button>
                    </Link>
                    <Link to="/auth/signup" search={{ redirect: undefined }}>
                      <Button
                        variant="contained"
                        colorScheme="primary"
                        className="w-full"
                      >
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
