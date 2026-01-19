import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import LogoutButton from "./LogoutButton";
import Icon from "./AppIcon";

const UserProfile = ({ variant = "dropdown" }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { currentUser, sessionExpiry } = useAuth();

  if (!currentUser) {
    return null;
  }

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleClickOutside = (e) => {
    if (!e.target.closest(".user-profile-dropdown")) {
      setIsDropdownOpen(false);
    }
  };

  React.useEffect(() => {
    if (isDropdownOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [isDropdownOpen]);

  if (variant === "simple") {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <Icon name="User" size={16} className="text-primary-foreground" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-foreground">
              {currentUser.name || currentUser.email}
            </p>
            <p className="text-xs text-muted-foreground">
              {currentUser.roleName || currentUser.role}
            </p>
          </div>
        </div>
        <LogoutButton variant="ghost" size="sm" showText={false} />
      </div>
    );
  }

  return (
    <div className="relative user-profile-dropdown">
      <button
        onClick={handleDropdownToggle}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted transition-colors"
      >
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
          <Icon name="User" size={16} className="text-primary-foreground" />
        </div>
        <div className="text-left">
          <p className="text-sm font-medium text-foreground">
            {currentUser.name || currentUser.email}
          </p>
          <p className="text-xs text-muted-foreground">
            {currentUser.roleName || currentUser.role}
          </p>
        </div>
        <Icon
          name={isDropdownOpen ? "ChevronUp" : "ChevronDown"}
          size={16}
          className="text-muted-foreground"
        />
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Icon
                  name="User"
                  size={20}
                  className="text-primary-foreground"
                />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {currentUser.name || currentUser.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentUser.roleName || currentUser.role}
                </p>
              </div>
            </div>
          </div>

          <div className="p-2">
            <div className="space-y-1">
              {currentUser.email && (
                <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted">
                  <Icon
                    name="Mail"
                    size={16}
                    className="text-muted-foreground"
                  />
                  <span className="text-sm text-foreground">
                    {currentUser.email}
                  </span>
                </div>
              )}

              {currentUser.phone && (
                <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted">
                  <Icon
                    name="Phone"
                    size={16}
                    className="text-muted-foreground"
                  />
                  <span className="text-sm text-foreground">
                    {currentUser.phone}
                  </span>
                </div>
              )}

              {currentUser.department && (
                <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted">
                  <Icon
                    name="Building"
                    size={16}
                    className="text-muted-foreground"
                  />
                  <span className="text-sm text-foreground">
                    {currentUser.department}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center justify-between p-2">
                <span className="text-xs text-muted-foreground">
                  Session expires
                </span>
                <span className="text-xs text-foreground">
                  {sessionExpiry?.toLocaleTimeString()}
                </span>
              </div>

              <LogoutButton
                variant="ghost"
                size="sm"
                className="w-full justify-start"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
