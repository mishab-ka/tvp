import React from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../../components/AppIcon";

export default function MobileHeader({
  title,
  onBack,
  rightIcon = "Settings",
  onRightClick,
  showBack = true,
}) {
  const navigate = useNavigate();
  const handleBack = onBack || (() => navigate(-1));

  return (
    <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        {showBack && (
          <button
            type="button"
            onClick={handleBack}
            className="p-2 -ml-2 rounded-lg text-foreground hover:bg-muted/50"
          >
            <Icon name="ArrowLeft" size={20} />
          </button>
        )}
        <h1 className="text-lg font-bold text-foreground truncate">{title}</h1>
      </div>
      {onRightClick && (
        <button
          type="button"
          onClick={onRightClick}
          className="p-2 rounded-lg text-foreground hover:bg-muted/50"
        >
          <Icon name={rightIcon} size={20} />
        </button>
      )}
    </header>
  );
}
