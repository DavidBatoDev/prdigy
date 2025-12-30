import { Link } from "@tanstack/react-router";
import { AppBar, Toolbar, Box, Typography, Stack, IconButton, InputBase } from "@mui/material";
import { Button } from "../../ui/button";
import Logo from "/prodigylogos/light/logo1.svg";
import { useAuthStore } from "@/stores/authStore";
import UserMenu from "./UserMenu";
import { MessageCircle, Bell, Search } from "lucide-react";

const Header = () => {
  const { isAuthenticated } = useAuthStore();
  const navItems = [
    { label: "Home", href: "/dashboard" },
    { label: "Projects", href: "/" },
    { label: "Market place", href: "/" },
  ];

  return (
    <AppBar
      position="static"
      sx={{
        bgcolor: "transparent",
        boxShadow: 0,
        height: "80px",
        justifyContent: "center",
        top: 0,
        zIndex: 1000,
      }}
    >
      <Toolbar
        sx={{
          justifyContent: "center",
          maxWidth: "1400px",
          width: "100%",
          margin: "0 auto",
          px: { xs: 2, sm: 3, md: 4 },
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
                <img src={Logo} alt="Prodigy Logo" style={{ height: "60px" }} />
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
                      fontSize: { xs: "0.9rem", md: "1rem" },
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
            </Stack>
          </Box>

          {/* Right Side: Search + Icons + Auth */}
          <Stack direction="row" spacing={2} sx={{ flexShrink: 0, alignItems: "center" }}>
            {isAuthenticated ? (
              <>
                {/* Search Bar */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "#F5F5F5",
                    borderRadius: "24px",
                    px: 2,
                    py: 0.75,
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
                  <Search size={20} style={{ color: "#666", marginRight: "8px" }} />
                  <InputBase
                    placeholder="Search..."
                    sx={{
                      flex: 1,
                      fontSize: "0.95rem",
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
                  <MessageCircle size={24} />
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
                  <Bell size={24} />
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
