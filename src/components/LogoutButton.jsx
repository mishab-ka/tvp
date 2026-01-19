import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "./ui/Button";
import Icon from "./AppIcon";
import { useAuth } from "../contexts/AuthContext";

const LogoutButton = ({
  variant = "default",
  size = "sm",
  showText = true,
  className = "",
}) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      // Use AuthContext logout function
      const logoutSuccess = logout();

      if (logoutSuccess) {
        // Redirect to login page
        navigate("/login");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      loading={isLoading}
      iconName="LogOut"
      className={className}
    >
      {showText && "Logout"}
    </Button>
  );
};

export default LogoutButton;
