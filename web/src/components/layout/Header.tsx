import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { AppBar, Toolbar, Box, Typography, Stack, IconButton, InputBase } from "@mui/material";
import { Button } from "../../ui/button";
import Logo from "/prodigylogos/light/logovector.svg";
import { useAuthStore, useIsLoading } from "@/stores/authStore";
import UserMenu from "./UserMenu";
import { MessageCircle, Bell, Search, ChevronDown } from "lucide-react";

const Header = () => {
  const { isAuthenticated, profile } = useAuthStore();
  const isAuthLoading = useIsLoading();
  const isLoading = isAuthLoading || (isAuthenticated && !profile);
  const [consultantsMenuOpen, setConsultantsMenuOpen] = useState(false);
  
  const navItems = [
    { label: "Home", href: "/dashboard" },
    { label: "Projects", href: "/" },
    { label: "Market place", href: "/" },
  ];

  const getPersonaMenu = () => {
    const persona = profile?.active_persona || 'client';
    const isConsultantVerified = profile?.is_consultant_verified;

    // Shared CTA — only shown when not yet a verified consultant
    const applyItem = !isConsultantVerified
      ? [{ label: "Apply as Consultant", href: "/consultant/apply", divider: true }]
      : [];
    
    switch (persona) {
      case 'freelancer':
        return {
          label: 'Mentorship',
          items: [
            { label: "Find a Mentor", href: "/mentors" },
            { label: "My Applications", href: "/applications" },
            { label: "Saved Mentors", href: "/saved-mentors" },
            ...applyItem,
          ]
        };
      case 'consultant':
        return {
          label: 'My Clients',
          items: [
            { label: "Browse Opportunities", href: "/projects" },
            { label: "My Clients", href: "/clients" },
            { label: "Active Contracts", href: "/contracts" },
          ]
        };
      case 'client':
      default:
        return {
          label: 'My Consultants',
          items: [
            { label: "Post a Project", href: "/client/project-posting" },
            { label: "Browse Professional Consultants", href: "/consultant/browse" },
            { label: "My Consultant Pool", href: "/consultant-pool" },
            { label: "Direct Contacts", href: "/direct-contacts" },
            ...applyItem,
          ]
        };
    }
  };

  const menuConfig = getPersonaMenu();

  return (
    <AppBar
      position="fixed"
      data-tutorial="header"
      sx={{
        bgcolor: "rgba(255, 255, 255, 0.9)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid #EAEAEA",
        boxShadow: "none",
        height: "56px",
        justifyContent: "center",
        top: 0,
        zIndex: 1000,
        overflow: "visible",
      }}
    >
      <Toolbar
        sx={{
          justifyContent: "center",
          maxWidth: "1400px",
          width: "100%",
          margin: "0 auto",
          px: { xs: 2, sm: 3, md: 4 },
          overflow: "visible",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            gap: { xs: 2, md: 3 },
          }}
        >
          {/* Left Side: Logo + Navigation */}
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 2, md: 3, lg: 4 } }}>
            {/* Logo */}
            <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
              <Link to="/" className="cursor-pointer">
                <img src={Logo} alt="Prodigy Logo" style={{ height: "24px" }} />
              </Link>
            </Box>

            {/* Navigation Items */}
            <Stack
              direction="row"
              spacing={{ xs: 1.5, md: 2, lg: 3 }}
              sx={{
                alignItems: "center",
              }}
            >
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  style={{ textDecoration: "none" }}
                >
                  <Typography
                    component="span"
                    sx={{
                      color: "#2F302F",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      fontSize: { xs: "0.8rem", md: "0.85rem" },
                      fontWeight: 600,
                      "&:hover": {
                        color: "var(--primary)",
                      },
                    }}
                  >
                    {item.label}
                  </Typography>
                </Link>
              ))}
              
              {/* My Consultants Dropdown */}
              <Box
                sx={{ position: "relative" }}
                onMouseEnter={() => setConsultantsMenuOpen(true)}
                onMouseLeave={() => setConsultantsMenuOpen(false)}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    cursor: "pointer",
                  }}
                >
                  <Typography
                    component="span"
                    sx={{
                      color: "#2F302F",
                      whiteSpace: "nowrap",
                      fontSize: { xs: "0.8rem", md: "0.85rem" },
                      fontWeight: 600,
                      "&:hover": {
                        color: "var(--primary)",
                      },
                    }}
                  >
                    {menuConfig.label}
                  </Typography>
                  <ChevronDown
                    size={16}
                    color="#2F302F"
                    style={{
                      transition: "transform 0.2s ease",
                      transform: consultantsMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  />
                </Box>
                
                {/* Dropdown Menu */}
                {consultantsMenuOpen && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      pt: 1, // Padding top acts as a transparent bridge
                      zIndex: 10004,
                    }}
                  >
                    <Box
                      sx={{
                        bgcolor: "white",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        minWidth: "250px",
                        py: 1,
                      }}
                    >
                      {menuConfig.items.map((item) => (
                      <Box key={item.label}>
                        {/* Divider before special items */}
                        {(item as any).divider && (
                          <Box sx={{ my: 1, borderTop: "1px solid #eee", mx: 2 }} />
                        )}
                        <Link
                          to={item.href}
                          style={{ textDecoration: "none" }}
                        >
                          <Box
                            sx={{
                              px: 3,
                              py: 1.5,
                              cursor: "pointer",
                              "&:hover": {
                                bgcolor: "#f5f5f5",
                              },
                            }}
                          >
                            <Typography
                              sx={{
                                color: "#2F302F",
                                fontSize: "0.95rem",
                                fontWeight: 500,
                              }}
                            >
                              {item.label}
                            </Typography>
                          </Box>
                        </Link>
                      </Box>
                    ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </Stack>
          </Box>

          {/* Right Side: Search + Icons + Auth */}
          <Stack direction="row" spacing={2} sx={{ flexShrink: 0, alignItems: "center" }}>
            {isLoading ? (
              // Skeleton Loader
              <Stack direction="row" spacing={2} alignItems="center">
                {/* Search Skeleton */}
                <Box
                  sx={{
                    width: { xs: "150px", md: "250px" },
                    height: "32px",
                    bgcolor: "rgba(0,0,0,0.05)",
                    borderRadius: "16px",
                  }}
                  className="animate-pulse"
                />
                {/* Icons Skeleton */}
                <Box sx={{ width: 32, height: 32, bgcolor: "rgba(0,0,0,0.05)", borderRadius: "50%" }} className="animate-pulse" />
                <Box sx={{ width: 32, height: 32, bgcolor: "rgba(0,0,0,0.05)", borderRadius: "50%" }} className="animate-pulse" />
                {/* Avatar Skeleton */}
                <Box sx={{ width: 32, height: 32, bgcolor: "rgba(0,0,0,0.05)", borderRadius: "50%" }} className="animate-pulse" />
              </Stack>
            ) : isAuthenticated ? (
              <>
                {/* Search Bar */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "#F5F5F5",
                    borderRadius: "16px",
                    px: 1.5,
                    py: 0.5,
                    minWidth: { xs: "150px", md: "250px" },
                    transition: "all 0.3s ease",
                    "&:hover": {
                      backgroundColor: "#EBEBEB",
                    },
                    "&:focus-within": {
                      backgroundColor: "#FFFFFF",
                      boxShadow: "0 0 0 2px var(--primary)",
                    },
                  }}
                >
                  <Search size={18} style={{ color: "#666", marginRight: "6px" }} />
                  <InputBase
                    placeholder="Search..."
                    sx={{
                      flex: 1,
                      fontSize: "0.85rem",
                      color: "#2F302F",
                      "& input::placeholder": {
                        color: "#999",
                        opacity: 1,
                      },
                    }}
                  />
                </Box>

                {/* Message Icon */}
                <IconButton
                  sx={{
                    color: "#2F302F",
                    "&:hover": {
                      backgroundColor: "rgba(0, 0, 0, 0.04)",
                    },
                  }}
                  aria-label="Messages"
                >
                  <MessageCircle size={20} />
                </IconButton>

                {/* Notification Icon */}
                <IconButton
                  sx={{
                    color: "#2F302F",
                    "&:hover": {
                      backgroundColor: "rgba(0, 0, 0, 0.04)",
                    },
                  }}
                  aria-label="Notifications"
                >
                  <Bell size={20} />
                </IconButton>

                {/* User Menu */}
                <UserMenu />
              </>
            ) : (
              <>
                <Link to="/auth/login">
                  <Button variant="outlined" colorScheme="primary">
                    Login
                  </Button>
                </Link>
                <Link to="/auth/signup">
                  <Button variant="contained" colorScheme="primary">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </Stack>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
