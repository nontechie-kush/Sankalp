import { supabase } from "./supabase";
import { todayIso } from "./format";
import type {
  AppData,
  Booking,
  CreatedBooking,
  OtpChallenge,
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

export async function requestOtp(rawPhone: string) {
  const { data, error } = await supabase.rpc("request_mweb_otp", {
    raw_phone: rawPhone,
  });
  if (error) throw error;
  return (data?.[0] ?? null) as OtpChallenge | null;
}

export async function verifyOtp(
  challengeId: string,
  rawPhone: string,
  code: string,
  leadName: string,
) {
  const { data, error } = await supabase.rpc("verify_mweb_otp", {
    challenge_id: challengeId,
    raw_phone: rawPhone,
    code,
    lead_name: leadName || null,
  });
  if (error) throw error;
  return (data?.[0] ?? null) as VerifiedLead | null;
}

export async function createAndPayBooking(input: {
  leadId: string;
  ritualId: string;
  useCaseId: string | null;
  slotId: string | null;
  customerName: string;
  intentNote: string | null;
}) {
  const { data, error } = await supabase.rpc("create_mweb_booking", {
    p_lead_id: input.leadId,
    p_ritual_id: input.ritualId,
    p_use_case_id: input.useCaseId,
    p_slot_id: input.slotId,
    p_customer_name: input.customerName || "Sankalp customer",
    p_intent_note: input.intentNote,
  });
  if (error) throw error;

  const created = (data?.[0] ?? null) as CreatedBooking | null;
  if (!created) throw new Error("The booking could not be created.");

  const payment = await supabase.rpc("mock_pay_mweb_booking", {
    p_lead_id: input.leadId,
    p_booking_id: created.booking_id,
  });
  if (payment.error) throw payment.error;

  const booking = await supabase.rpc("get_mweb_booking", {
    p_lead_id: input.leadId,
    p_booking_id: created.booking_id,
  });
  if (booking.error) throw booking.error;

  return (booking.data?.[0] ?? null) as Booking | null;
}
