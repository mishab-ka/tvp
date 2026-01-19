import React from "react";
import Icon from "../../../components/AppIcon";

const ProcessingStatus = ({ status }) => {
  if (!status) return null;

  const getStatusIcon = () => {
    switch (status.stage) {
      case "parsing":
      case "matching":
      case "creating":
        return <Icon name="Loader2" size={20} className="animate-spin text-primary" />;
      case "completed":
        return <Icon name="CheckCircle" size={20} className="text-success" />;
      case "error":
        return <Icon name="AlertTriangle" size={20} className="text-error" />;
      default:
        return <Icon name="Info" size={20} className="text-primary" />;
    }
  };

  const getStatusColor = () => {
    switch (status.stage) {
      case "completed":
        return "bg-success/10 border-success/20 text-success";
      case "error":
        return "bg-error/10 border-error/20 text-error";
      default:
        return "bg-primary/10 border-primary/20 text-primary";
    }
  };

  return (
    <div className={`mb-4 rounded-lg border p-4 ${getStatusColor()}`}>
      <div className="flex items-center gap-3">
        {getStatusIcon()}
        <div className="flex-1">
          <p className="font-medium">{status.message}</p>
          {status.matchedCount !== undefined && status.unmatchedCount !== undefined && (
            <div className="mt-2 text-sm opacity-90">
              <span className="font-medium">{status.matchedCount}</span> matched,{" "}
              <span className="font-medium">{status.unmatchedCount}</span> unmatched
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProcessingStatus;



