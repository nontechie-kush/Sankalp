export type Screen =
  | "home"
  | "ritual"
  | "phone"
  | "otp"
  | "payment"
  | "confirm"
  | "status";

export interface Ritual {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  short_description: string | null;
  description: string | null;
  duration_minutes: number | null;
  starting_price_minor: number;
  currency: string;
}

export interface HomeBanner {
  id: string;
  ritual_id: string;
  badge: string;
  title: string;
  subtitle: string;
  visual_tone: "clay" | "gold" | "green" | "blue" | string;
}

export interface RitualUseCase {
  id: string;
  ritual_id: string;
  group_label: string;
  icon_name: string;
  title: string;
  subtitle: string;
  price_minor: number;
  currency: string;
  is_popular: boolean;
}

export interface TimeSlot {
  id: string;
  ritual_id: string | null;
  slot_date: string;
  slot_time: string;
  label: string | null;
  is_auspicious: boolean;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
}

export interface AppData {
  rituals: Ritual[];
  banners: HomeBanner[];
  useCases: RitualUseCase[];
  slots: TimeSlot[];
  faqs: Faq[];
}

export interface VerifiedLead {
  lead_id: string;
  phone: string;
  name: string | null;
}

export interface MemberProfile extends VerifiedLead {
  user_id?: string;
  date_of_birth: string | null;
  place_of_birth: string | null;
  place_of_birth_id: string | null;
  place_of_birth_provider: "google" | "legacy" | null;
  profile_completed_at: string | null;
}

export interface PlaceSuggestion {
  id: string;
  text: string;
  mainText: string;
  secondaryText: string;
}

export interface RazorpayOrder {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  bookingNumber: string;
  description: string;
}

export interface RazorpayCheckoutResult {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface BookingDraft {
  useCaseId: string;
  startedAt: string;
  clientRequestId: string;
  paymentIdempotencyKey: string;
}

export interface CreatedBooking {
  booking_id: string;
  booking_number: string;
}

export interface Booking {
  booking_id: string;
  booking_number: string;
  ritual_title: string;
  use_case_title: string | null;
  preferred_date: string;
  preferred_time: string;
  booked_before_cutoff: boolean;
  promised_service_date: string | null;
  promised_by: string | null;
  amount_minor: number;
  currency: string;
  status: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
}
