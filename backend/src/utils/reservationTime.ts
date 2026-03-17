export const RESTAURANT_OPEN_HOUR = 10;
export const RESTAURANT_LAST_RESERVATION_HOUR = 23;
export const RESTAURANT_LAST_RESERVATION_MINUTE = 30;
export const RESTAURANT_TIMEZONE_OFFSET_MS = -3 * 60 * 60 * 1000;
export const RESERVATION_DURATION_MS = 90 * 60 * 1000;
export const AVAILABILITY_SLOT_MS = 15 * 60 * 1000;
export const RESERVATION_WINDOW_LABEL = '10:00 AM a 11:30 PM';

const DATE_QUERY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface ParsedDateQuery {
  year: number;
  month: number;
  day: number;
}

export const parseDateQuery = (value: string): ParsedDateQuery | null => {
  if (!DATE_QUERY_PATTERN.test(value)) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);
  const candidate = new Date(Date.UTC(year, month - 1, day));

  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
};

export const toRestaurantLocalTime = (value: Date | number) => {
  const date = value instanceof Date ? value : new Date(value);
  return new Date(date.getTime() + RESTAURANT_TIMEZONE_OFFSET_MS);
};

export const isWithinRestaurantHours = (value: Date | number) => {
  const localDate = toRestaurantLocalTime(value);
  const localHour = localDate.getUTCHours();
  const localMinutes = localDate.getUTCMinutes();

  const isAfterClosing =
    localHour > RESTAURANT_LAST_RESERVATION_HOUR ||
    (localHour === RESTAURANT_LAST_RESERVATION_HOUR &&
      localMinutes > RESTAURANT_LAST_RESERVATION_MINUTE);
  const isBeforeOpening = localHour < RESTAURANT_OPEN_HOUR;

  return !(isBeforeOpening || isAfterClosing);
};

export const buildAvailabilityIntervals = ({ year, month, day }: ParsedDateQuery) => {
  const intervals: Array<{ start: number; end: number }> = [];
  const openMinutes = RESTAURANT_OPEN_HOUR * 60;
  const lastReservationMinutes =
    RESTAURANT_LAST_RESERVATION_HOUR * 60 + RESTAURANT_LAST_RESERVATION_MINUTE;

  for (let minutes = openMinutes; minutes <= lastReservationMinutes; minutes += 15) {
    const localTimeAsUtc = Date.UTC(
      year,
      month - 1,
      day,
      Math.floor(minutes / 60),
      minutes % 60,
      0
    );
    const slotStartUtc = localTimeAsUtc - RESTAURANT_TIMEZONE_OFFSET_MS;
    intervals.push({
      start: slotStartUtc,
      end: slotStartUtc + AVAILABILITY_SLOT_MS
    });
  }

  return intervals;
};

export const getRestaurantDayWindow = ({ year, month, day }: ParsedDateQuery) => {
  const localMidnight = Date.UTC(year, month - 1, day, 0, 0, 0);

  return {
    dateStart: new Date(localMidnight - RESTAURANT_TIMEZONE_OFFSET_MS),
    dateEnd: new Date(localMidnight - RESTAURANT_TIMEZONE_OFFSET_MS + 24 * 60 * 60 * 1000)
  };
};
