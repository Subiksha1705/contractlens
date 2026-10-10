import { subDays, isAfter, startOfDay } from "date-fns";

export interface ReminderNotification {
  daysBefore: number;
  reminderDate: Date;
}

const REMINDER_INTERVALS = [30, 14, 7, 1];

/**
 * Pure function: calculates upcoming reminders for a deadline date.
 * Only future reminders relative to `today` are returned.
 * @param deadline Target deadline Date
 * @param today Injected reference Date for deterministic testing
 */
export function calculateUpcomingReminders(
  deadline: Date,
  today: Date = new Date()
): ReminderNotification[] {
  const cleanToday = startOfDay(today);
  const cleanDeadline = startOfDay(deadline);

  const reminders: ReminderNotification[] = [];

  for (const daysBefore of REMINDER_INTERVALS) {
    const reminderDate = subDays(cleanDeadline, daysBefore);
    // Only return future or same-day reminders
    if (isAfter(reminderDate, cleanToday) || reminderDate.getTime() === cleanToday.getTime()) {
      reminders.push({
        daysBefore,
        reminderDate,
      });
    }
  }

  // Sort chronological
  return reminders.sort((a, b) => a.reminderDate.getTime() - b.reminderDate.getTime());
}
