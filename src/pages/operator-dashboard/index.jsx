import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";

const OperatorDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex-shrink-0 border-b border-border bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon name="UserCog" size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Operator Dashboard</h1>
            <p className="text-xs text-muted-foreground">
              {currentUser?.name || currentUser?.email}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" iconName="LogOut" iconSize={14} onClick={handleLogout}>
          Logout
        </Button>
      </header>

      <main className="flex-1 p-6">
        <div className="max-w-2xl mx-auto rounded-2xl border border-border/80 bg-card shadow-sm p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Icon name="UserCog" size={32} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Welcome, Operator</h2>
          <p className="text-muted-foreground">
            You are signed in as an operator. Use this space for operator-specific tasks and information.
          </p>
        </div>
      </main>
    </div>
  );
};

export default OperatorDashboard;
