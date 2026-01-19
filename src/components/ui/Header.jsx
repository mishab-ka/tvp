import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import Icon from "../AppIcon";
import Button from "./Button";

const Header = ({
  title,
  subtitle,
  onMenuToggle,
  onMenuClick,
  onSidebarToggle,
  isMenuOpen = false,
}) => {
  const location = useLocation();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const primaryNavItems = [
    { label: "Dashboard", path: "/dashboard", icon: "BarChart3" },
    { label: "TVP Management", path: "/tvp-owners-management", icon: "Users" },
    {
      label: "Financial Reports",
      path: "/hissab-accounting-generator",
      icon: "FileText",
    },
    {
      label: "User Management",
      path: "/admin-user-management",
      icon: "UserCog",
    },
  ];

  const secondaryNavItems = [
    { label: "Settings", path: "/settings", icon: "Settings" },
    { label: "Help", path: "/help", icon: "HelpCircle" },
  ];

  const isActivePath = (path) => {
    return location?.pathname === path || location?.pathname?.startsWith(path);
  };

  const handleNavigation = (path) => {
    window.location.href = path;
  };

  const handleMenuClick = onMenuClick || onMenuToggle;
  const handleSidebarToggle = onSidebarToggle;

  return (
    // <header className="fixed top-0 left-0 right-0 z-50 bg-surface border-b border-border">
    //   <div className="flex items-center justify-between h-16 px-4">
    //     {/* Left side - Menu toggle and title */}
    //     <div className="flex items-center space-x-4">
    //       <Button
    //         variant="ghost"
    //         size="icon"
    //         onClick={handleMenuClick}
    //         className="lg:hidden"
    //         iconName="Menu"
    //         iconSize={20}
    //       >
    //         <span className="sr-only">Toggle menu</span>
    //       </Button>

    //       <Button
    //         variant="ghost"
    //         size="icon"
    //         onClick={handleSidebarToggle}
    //         className="hidden lg:flex"
    //         iconName="Menu"
    //         iconSize={20}
    //       >
    //         <span className="sr-only">Toggle sidebar</span>
    //       </Button>

    //       {title && (
    //         <div className="hidden sm:block">
    //           <h1 className="text-lg font-semibold text-foreground">{title}</h1>
    //           {subtitle && (
    //             <p className="text-xs text-muted-foreground -mt-1">
    //               {subtitle}
    //             </p>
    //           )}
    //         </div>
    //       )}

    //       {!title && (
    //         <div className="flex items-center space-x-3">
    //           <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
    //             <span className="text-primary-foreground font-semibold">T</span>
    //           </div>
    //           <div className="hidden sm:block">
    //             <h1 className="text-lg font-semibold text-foreground">
    //               Tawaaq
    //             </h1>
    //             <p className="text-xs text-muted-foreground -mt-1">
    //               Admin Portal
    //             </p>
    //           </div>
    //         </div>
    //       )}
    //     </div>

    //     {/* Right side - User actions or navigation */}
    //     <div className="flex items-center space-x-2">
    //       {/* Can add user menu, notifications, etc. here */}
    //     </div>
    //   </div>
    // </header>
    <></>
  );
};

export default Header;
