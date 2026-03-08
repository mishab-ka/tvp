import React from "react";
import Icon from "../../components/AppIcon";
import MobileHeader from "./components/MobileHeader";

export default function DriverSupport({ driver }) {
  return (
    <div className="min-h-full bg-muted/30">
      <MobileHeader title="Support" />
      <div className="p-4 space-y-4">
        <p className="text-sm text-muted-foreground">Get help 24/7 from our support team.</p>
        <div className="space-y-2">
          <a
            href="mailto:support@tawaaq.com"
            className="block rounded-xl bg-card border border-border shadow-sm p-4 flex items-center gap-4 text-left hover:bg-muted/30 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon name="Mail" size={24} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">Contact admin</p>
              <p className="text-xs text-muted-foreground">Send an email</p>
            </div>
            <Icon name="ChevronRight" size={18} className="text-muted-foreground shrink-0" />
          </a>
          <a
            href="tel:+919876543210"
            className="block rounded-xl bg-card border border-border shadow-sm p-4 flex items-center gap-4 text-left hover:bg-muted/30 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
              <Icon name="Phone" size={24} className="text-success" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">Call support</p>
              <p className="text-xs text-muted-foreground">+91 98765 43210</p>
            </div>
            <Icon name="ChevronRight" size={18} className="text-muted-foreground shrink-0" />
          </a>
          <button
            type="button"
            className="w-full rounded-xl bg-card border border-border shadow-sm p-4 flex items-center gap-4 text-left hover:bg-muted/30 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon name="MessageCircle" size={24} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">Send message</p>
              <p className="text-xs text-muted-foreground">Chat with support</p>
            </div>
            <Icon name="ChevronRight" size={18} className="text-muted-foreground shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}
