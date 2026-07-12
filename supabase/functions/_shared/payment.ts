import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://sankkalp.com",
  "https://www.sankkalp.com",
  "https://web-orcin-seven-45.vercel.app",
  "http://127.0.0.1:4173",
  "http://localhost:4173",
]);

export function corsHeaders(request: Request) {
  const origin = request.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Origin": allowedOrigins.has(origin)
      ? origin
      : "https://web-orcin-seven-45.vercel.app",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
    Vary: "Origin",
  };
}

export function json(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders(request),
  });
}

export function paymentEnvironment() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
  const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey || !razorpayKeyId || !razorpayKeySecret) {
    return null;
  }
  return { supabaseUrl, supabaseAnonKey, supabaseServiceKey, razorpayKeyId, razorpayKeySecret };
}

export async function authenticatedPaymentClients(request: Request) {
  const environment = paymentEnvironment();
  const authorization = request.headers.get("authorization");
  if (!environment || !authorization) return null;

  const authClient = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: { user }, error } = await authClient.auth.getUser();
  if (error || !user) return null;

  const serviceClient = createClient(environment.supabaseUrl, environment.supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return { environment, serviceClient, user };
}

export async function razorpayRequest(
  path: string,
  environment: NonNullable<ReturnType<typeof paymentEnvironment>>,
  init: RequestInit = {},
) {
  return fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${btoa(`${environment.razorpayKeyId}:${environment.razorpayKeySecret}`)}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

export function validUuid(value: unknown): value is string {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
