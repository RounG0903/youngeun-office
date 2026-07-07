import { ReservationCalendar } from "@/components/ReservationCalendar";

export default function AdminCalendarPage() {
  return <ReservationCalendar apiPath="/api/admin/calendar" showBooker />;
}
