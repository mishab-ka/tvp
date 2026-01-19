import React from "react";
import Button from "../../../components/ui/Button";
import Icon from "../../../components/AppIcon";

/**
 * Format date to YYYY-MM-DD in local timezone (avoids UTC timezone issues)
 */
const formatDateLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Calculate previous week (last Monday to last Sunday)
 */
export const calculatePreviousWeek = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate current week's Monday
  const currentWeekMonday = new Date(today);
  if (dayOfWeek === 0) {
    // If today is Sunday, go back 6 days to get Monday
    currentWeekMonday.setDate(today.getDate() - 6);
  } else {
    // Otherwise go back (dayOfWeek - 1) days to get Monday
    currentWeekMonday.setDate(today.getDate() - (dayOfWeek - 1));
  }
  
  // Calculate previous week's Monday (7 days before current week's Monday)
  const previousWeekMonday = new Date(currentWeekMonday);
  previousWeekMonday.setDate(currentWeekMonday.getDate() - 7);
  
  // Calculate previous week's Sunday (6 days after previous week's Monday)
  const previousWeekSunday = new Date(previousWeekMonday);
  previousWeekSunday.setDate(previousWeekMonday.getDate() + 6);
  
  return {
    weekStart: formatDateLocal(previousWeekMonday),
    weekEnd: formatDateLocal(previousWeekSunday),
    weekDate: formatDateLocal(previousWeekMonday),
  };
};

/**
 * Calculate week dates from a given date
 */
export const calculateWeekFromDate = (date) => {
  // Parse the date string (YYYY-MM-DD) in local timezone
  const dateParts = date.split("-");
  const d = new Date(
    parseInt(dateParts[0]),
    parseInt(dateParts[1]) - 1,
    parseInt(dateParts[2])
  );
  d.setHours(0, 0, 0, 0);
  const dayOfWeek = d.getDay();
  
  // Calculate Monday of the week
  const monday = new Date(d);
  if (dayOfWeek === 0) {
    // If date is Sunday, go back 6 days to get Monday
    monday.setDate(d.getDate() - 6);
  } else {
    // Otherwise go back (dayOfWeek - 1) days to get Monday
    monday.setDate(d.getDate() - (dayOfWeek - 1));
  }
  
  // Calculate Sunday of the week (6 days after Monday)
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  return {
    weekStart: formatDateLocal(monday),
    weekEnd: formatDateLocal(sunday),
    weekDate: formatDateLocal(monday),
  };
};

const WeekSelector = ({ value, onChange }) => {
  const weekData = value || calculatePreviousWeek();

  const handlePreviousWeek = () => {
    const currentMonday = new Date(weekData.weekStart);
    currentMonday.setDate(currentMonday.getDate() - 7);
    const newWeek = calculateWeekFromDate(currentMonday);
    onChange(newWeek);
  };

  const handleNextWeek = () => {
    const currentMonday = new Date(weekData.weekStart);
    currentMonday.setDate(currentMonday.getDate() + 7);
    const newWeek = calculateWeekFromDate(currentMonday);
    onChange(newWeek);
  };

  const handleToday = () => {
    const newWeek = calculatePreviousWeek();
    onChange(newWeek);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Week Selection</h3>
          <p className="text-sm text-muted-foreground">
            Select the week for bill generation
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleToday}
          iconName="Calendar"
          iconPosition="left"
        >
          Previous Week
        </Button>
      </div>

      <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePreviousWeek}
          iconName="ChevronLeft"
        />

        <div className="text-center flex-1">
          <p className="text-sm font-medium text-foreground">
            Week of {formatDate(weekData.weekStart)} - {formatDate(weekData.weekEnd)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {weekData.weekStart} to {weekData.weekEnd}
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextWeek}
          iconName="ChevronRight"
        />
      </div>

      <div className="mt-4">
        <label className="text-sm font-medium text-foreground mb-2 block">
          Week Start Date
        </label>
        <input
          type="date"
          value={weekData.weekStart}
          onChange={(e) => {
            const newWeek = calculateWeekFromDate(e.target.value);
            onChange(newWeek);
          }}
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
    </div>
  );
};

export default WeekSelector;

