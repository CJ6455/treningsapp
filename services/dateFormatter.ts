// utils/dateFormatter.ts
import { isToday, isThisWeek, parseISO, subDays, startOfDay, endOfDay, isWithinInterval, isThisYear } from "date-fns";

/**
 * Formats a date string based on its relation to the current date.
 * - Today: "Today"
 * - Within the Last Week: "EEEE, MMM d"
 * - Older: "EEEE, MMM d, yyyy"
 *
 * @param dateString - The date string to format.
 * @returns The formatted date string or "Unknown Date" if invalid.
 */

function isWithinLast7Days(date: Date): boolean {
  const now = new Date(); // Current date and time
  const sixDaysAgo = subDays(now, 6); // Date 6 days ago

  // Define the interval from sixDaysAgo (start) to now (end)
  const interval = {
    start: startOfDay(sixDaysAgo), // Start of the day 6 days ago
    end: endOfDay(now),            // End of today
  };

  // Check if the date is within the interval
  return isWithinInterval(date, interval);
}
export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "Unknown Date";

  let date: Date;

  try {
    date = new Date(dateString);
    if (isNaN(date.getTime())) throw new Error("Invalid Date");
  } catch {
    return "Unknown Date";
  }
  
  if (isToday(date)) {
    return (
        
        date.toLocaleTimeString('no-NO', {
        hour: "2-digit",
        minute: "2-digit",
    }));
  } else if (isWithinLast7Days(date)) { // Assuming week starts on Monday
    return date.toLocaleDateString('no-NO', {
      weekday: "long",
     
    });
  } else if(isThisYear(date)){
    return date.toLocaleDateString('no-NO', {
   
      month: "long",
      day: "numeric",
      
  
    });
  }else{return date.toLocaleDateString('no-NO', {
   
    month: "numeric",
    day: "numeric",
    year: "numeric",

  });}
};
