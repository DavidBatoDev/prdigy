import { Link } from "@tanstack/react-router";
import { AppBar, Toolbar, Box, Typography, Stack } from "@mui/material";
import { Button } from "../../ui/button";
import Logo from "/prodigylogos/light/logo1.svg";

const Header = () => {
  const navItems = ["Home", "About Us", "Our Services", "Stories"];

  return (
    <AppBar
      position="sticky"
      sx={{
        bgcolor: "white",
        boxShadow: 3,
        height: "102px",
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
          px: { xs: 2, sm: 4, md: 6 },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            gap: { xs: 2, md: 4, lg: 6 },
          }}
        >
          {/* Logo */}
          <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <img src={Logo} alt="Prodigy Logo" />
          </Box>

          {/* Navigation Items */}
          <Stack
            direction="row"
            spacing={{ xs: 2, md: 3, lg: 4 }}
            sx={{
              alignItems: "center",
              flex: "1",
              justifyContent: "center",
            }}
          >
            {navItems.map((item) => (
              <Typography
                key={item}
                component="span"
                sx={{
                  color: "#2F302F",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  fontSize: { xs: "0.9rem", md: "1rem" },
                  "&:hover": {
                    color: "primary.main",
                  },
                }}
              >
                {item}
              </Typography>
            ))}
          </Stack>

          {/* Auth Buttons */}
          <Stack direction="row" spacing={2} sx={{ flexShrink: 0 }}>
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
          </Stack>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
