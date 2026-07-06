import { supabase } from "./supabase";
import { todayIso } from "./format";
import type {
  AppData,
  Booking,
  CreatedBooking,
  MemberProfile,
  PlaceSuggestion,
  VerifiedLead,
} from "../types";

export async function loadAppData(): Promise<AppData> {
  const [rituals, banners, useCases, slots, faqs] = await Promise.all([
    supabase
      .from("rituals")
      .select(
        "id,slug,title,subtitle,short_description,description,duration_minutes,starting_price_minor,currency",
      )
      .eq("status", "active")
      .order("trending_rank", { ascending: true, nullsFirst: false }),
    supabase
      .from("mweb_home_banners")
      .select("id,ritual_id,badge,title,subtitle,visual_tone")
      .eq("status", "active")
      .order("display_order"),
    supabase
      .from("mweb_ritual_use_cases")
      .select(
        "id,ritual_id,group_label,icon_name,title,subtitle,price_minor,currency,is_popular",
      )
      .eq("status", "active")
      .order("display_order"),
    supabase
      .from("mweb_time_slots")
      .select("id,ritual_id,slot_date,slot_time,label,is_auspicious")
      .eq("status", "open")
      .gte("slot_date", todayIso())
      .order("slot_date")
      .order("slot_time"),
    supabase
      .from("faqs")
      .select("id,question,answer")
      .eq("status", "active")
      .eq("category", "mweb")
      .order("display_order"),
  ]);

  for (const result of [rituals, banners, useCases, slots, faqs]) {
    if (result.error) throw result.error;
  }

  return {
    rituals: rituals.data ?? [],
    banners: banners.data ?? [],
    useCases: useCases.data ?? [],
    slots: slots.data ?? [],
    faqs: faqs.data ?? [],
  };
}

export async function requestOtp(phone: string) {
  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: {
      shouldCreateUser: true,
    },
  });
  if (error) throw error;
}

export async function verifyOtp(phone: string, code: string) {
  const verification = await supabase.auth.verifyOtp({
    phone,
    token: code,
    type: "sms",
  });
  if (verification.error) throw verification.error;

  const { data, error } = await supabase.rpc("upsert_mweb_authenticated_lead", {
    lead_name: null,
  });
  if (error) throw error;
  return (data?.[0] ?? null) as VerifiedLead | null;
}

export async function getMyProfile() {
  const { data, error } = await supabase.rpc("get_my_mweb_profile");
  if (error) throw error;
  return (data?.[0] ?? null) as MemberProfile | null;
}

export async function updateMyProfile(input: {
  name: string;
  dateOfBirth: string | null;
  placeOfBirth: string | null;
  placeOfBirthId: string | null;
  placeOfBirthProvider: "google" | "legacy" | null;
  complete?: boolean;
}) {
  const { data, error } = await supabase.rpc("update_my_mweb_profile_v2", {
    p_name: input.name,
    p_date_of_birth: input.dateOfBirth,
    p_place_of_birth: input.placeOfBirth,
    p_place_of_birth_id: input.placeOfBirthId,
    p_place_of_birth_provider: input.placeOfBirthProvider,
    p_complete: input.complete ?? false,
  });
  if (error) throw error;
  return (data?.[0] ?? null) as MemberProfile | null;
}

export async function searchBirthPlaces(input: string): Promise<PlaceSuggestion[]> {
  const { data, error } = await supabase.functions.invoke("place-autocomplete", {
    body: { input },
  });
  if (error) {
    let message = error.message;
    const context = "context" in error ? error.context : null;
    if (context instanceof Response) {
      const body = await context.clone().json().catch(() => null) as { error?: string } | null;
      message = body?.error || message;
    }
    throw new Error(message);
  }
  return (data?.suggestions ?? []) as PlaceSuggestion[];
}

export async function loadMyBookings() {
  const { data, error } = await supabase.rpc("list_my_mweb_bookings");
  if (error) throw error;
  return (data ?? []) as Booking[];
}

export async function getMyBooking(bookingId: string) {
  const { data, error } = await supabase.rpc("get_my_mweb_booking", {
    p_booking_id: bookingId,
  });
  if (error) throw error;
  return (data?.[0] ?? null) as Booking | null;
}

export async function createMyBooking(input: {
  ritualId: string;
  useCaseId: string | null;
  slotId: string | null;
  customerName: string;
  intentNote: string | null;
  clientRequestId: string;
}) {
  const { data, error } = await supabase.rpc("create_my_mweb_booking", {
    p_ritual_id: input.ritualId,
    p_use_case_id: input.useCaseId,
    p_slot_id: input.slotId,
    p_customer_name: input.customerName || "Sankalp customer",
    p_intent_note: input.intentNote,
    p_client_request_id: input.clientRequestId,
  });
  if (error) throw error;

  const created = (data?.[0] ?? null) as CreatedBooking | null;
  if (!created) throw new Error("The booking could not be created.");
  return created;
}

export async function payMyBooking(bookingId: string, idempotencyKey: string) {
  const { data, error } = await supabase.rpc("pay_my_mweb_booking", {
    p_booking_id: bookingId,
    p_idempotency_key: idempotencyKey,
  });
  if (error) throw error;
  return data?.[0] ?? null;
}
