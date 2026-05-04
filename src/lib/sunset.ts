import SunCalc from "suncalc";

// IANA timezone → primary city [lat, lng]. Approximate; v1.5 swaps to
// user-input lat/lng for higher accuracy. Currently ~50 entries cover the
// majority of likely users; unknowns fall back to Etc/UTC (lat 0, lng 0).
const COORDS: Record<string, [number, number]> = {
  "America/New_York": [40.7128, -74.006],
  "America/Chicago": [41.8781, -87.6298],
  "America/Denver": [39.7392, -104.9903],
  "America/Los_Angeles": [34.0522, -118.2437],
  "America/Phoenix": [33.4484, -112.074],
  "America/Anchorage": [61.2181, -149.9003],
  "America/Toronto": [43.6532, -79.3832],
  "America/Vancouver": [49.2827, -123.1207],
  "America/Mexico_City": [19.4326, -99.1332],
  "America/Sao_Paulo": [-23.5505, -46.6333],
  "America/Argentina/Buenos_Aires": [-34.6037, -58.3816],
  "America/Lima": [-12.0464, -77.0428],
  "America/Bogota": [4.711, -74.0721],
  "America/Santiago": [-33.4489, -70.6693],

  "Europe/London": [51.5074, -0.1278],
  "Europe/Dublin": [53.3498, -6.2603],
  "Europe/Paris": [48.8566, 2.3522],
  "Europe/Berlin": [52.52, 13.405],
  "Europe/Madrid": [40.4168, -3.7038],
  "Europe/Rome": [41.9028, 12.4964],
  "Europe/Amsterdam": [52.3676, 4.9041],
  "Europe/Brussels": [50.8503, 4.3517],
  "Europe/Stockholm": [59.3293, 18.0686],
  "Europe/Oslo": [59.9139, 10.7522],
  "Europe/Copenhagen": [55.6761, 12.5683],
  "Europe/Helsinki": [60.1699, 24.9384],
  "Europe/Warsaw": [52.2297, 21.0122],
  "Europe/Athens": [37.9838, 23.7275],
  "Europe/Istanbul": [41.0082, 28.9784],
  "Europe/Moscow": [55.7558, 37.6173],
  "Europe/Lisbon": [38.7169, -9.1399],
  "Europe/Vienna": [48.2082, 16.3738],
  "Europe/Zurich": [47.3769, 8.5417],

  "Asia/Kolkata": [19.076, 72.8777],
  "Asia/Tokyo": [35.6762, 139.6503],
  "Asia/Shanghai": [31.2304, 121.4737],
  "Asia/Hong_Kong": [22.3193, 114.1694],
  "Asia/Singapore": [1.3521, 103.8198],
  "Asia/Seoul": [37.5665, 126.978],
  "Asia/Bangkok": [13.7563, 100.5018],
  "Asia/Jakarta": [-6.2088, 106.8456],
  "Asia/Manila": [14.5995, 120.9842],
  "Asia/Dubai": [25.2048, 55.2708],
  "Asia/Tehran": [35.6892, 51.389],
  "Asia/Karachi": [24.8607, 67.0011],
  "Asia/Riyadh": [24.7136, 46.6753],
  "Asia/Jerusalem": [31.7683, 35.2137],
  "Asia/Taipei": [25.033, 121.5654],
  "Asia/Dhaka": [23.8103, 90.4125],

  "Australia/Sydney": [-33.8688, 151.2093],
  "Australia/Melbourne": [-37.8136, 144.9631],
  "Australia/Perth": [-31.9505, 115.8605],
  "Pacific/Auckland": [-36.8485, 174.7633],
  "Pacific/Honolulu": [21.3099, -157.8581],

  "Africa/Cairo": [30.0444, 31.2357],
  "Africa/Johannesburg": [-26.2041, 28.0473],
  "Africa/Lagos": [6.5244, 3.3792],
  "Africa/Nairobi": [-1.2921, 36.8219],
  "Africa/Casablanca": [33.5731, -7.5898],
};

const FALLBACK: [number, number] = [0, 0];

export function tzCoords(timezone: string): { lat: number; lng: number } {
  const [lat, lng] = COORDS[timezone] ?? FALLBACK;
  return { lat, lng };
}

const TZ_REGEX = /^([A-Za-z_]+\/[A-Za-z_+\-/]+|UTC|Etc\/[A-Za-z+\-]+)$/;

export function isValidTimezone(tz: string): boolean {
  if (!TZ_REGEX.test(tz)) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export type Frequency = "daily" | "every_2_days" | "weekly" | "off";

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

// Find the next sundown strictly after `after`. Tries up to 5 days forward
// to handle high-latitude polar days/nights where suncalc may return NaN.
function nextSundownAfter(timezone: string, after: Date): Date {
  const { lat, lng } = tzCoords(timezone);
  for (let offset = 0; offset < 5; offset++) {
    const day = new Date(after.getTime() + offset * DAY_MS);
    const sundown = SunCalc.getTimes(day, lat, lng).sunset;
    if (
      sundown instanceof Date &&
      !Number.isNaN(sundown.getTime()) &&
      sundown.getTime() > after.getTime()
    ) {
      return sundown;
    }
  }
  // Polar fallback: 24h after `after`. Rare; only matters for users in
  // Tromsø in midsummer or Antarctica in midwinter.
  return new Date(after.getTime() + DAY_MS);
}

// The single entry point used by settings save + cron after-send.
//
// - On signup or settings change: omit `lastSentAt`. Returns the next
//   sundown after now — that's when the first email fires.
// - After a successful send: pass the send time as `lastSentAt`. Returns
//   the sundown ~frequencyDays after that, which is the next email.
//
// Returns null when frequency is 'off'.
export function nextEmailTime(args: {
  timezone: string;
  frequency: Frequency;
  lastSentAt?: Date | null;
}): Date | null {
  if (args.frequency === "off") return null;
  if (!args.lastSentAt) {
    return nextSundownAfter(args.timezone, new Date());
  }
  const days =
    args.frequency === "daily"
      ? 1
      : args.frequency === "every_2_days"
        ? 2
        : 7;
  // Subtract 4h so we always land on the calendar day's sundown rather
  // than skipping it when lastSentAt was already past the day's sunset.
  const target = new Date(
    args.lastSentAt.getTime() + days * DAY_MS - 4 * HOUR_MS
  );
  return nextSundownAfter(args.timezone, target);
}
