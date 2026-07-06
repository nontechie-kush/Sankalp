import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://web-orcin-seven-45.vercel.app",
  "http://127.0.0.1:4173",
  "http://localhost:4173",
]);

function corsHeaders(request: Request) {
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

function json(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders(request),
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(request) });
  }
  if (request.method !== "POST") return json(request, { error: "Method not allowed." }, 405);

  const authorization = request.headers.get("authorization");
  if (!authorization) return json(request, { error: "Sign in before searching." }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const googleApiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    return json(request, { error: "Place search is not configured." }, 503);
  }
  if (!googleApiKey) {
    return json(request, { error: "Google Places is awaiting configuration." }, 503);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return json(request, { error: "Your session has expired." }, 401);

  let input = "";
  try {
    const body = await request.json();
    input = typeof body?.input === "string" ? body.input.trim() : "";
  } catch {
    return json(request, { error: "Invalid request." }, 400);
  }

  if (input.length < 3 || input.length > 80 || /[\u0000-\u001f]/.test(input)) {
    return json(request, { error: "Enter at least 3 characters of a place name." }, 400);
  }

  const { error: rateError } = await supabase.rpc("check_mweb_place_search_rate_limit");
  if (rateError) {
    const limited = rateError.message.toLowerCase().includes("limit") ||
      rateError.message.toLowerCase().includes("too many");
    return json(request, { error: rateError.message }, limited ? 429 : 403);
  }

  const googleResponse = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": googleApiKey,
      "X-Goog-FieldMask": [
        "suggestions.placePrediction.placeId",
        "suggestions.placePrediction.text.text",
        "suggestions.placePrediction.structuredFormat.mainText.text",
        "suggestions.placePrediction.structuredFormat.secondaryText.text",
      ].join(","),
    },
    body: JSON.stringify({
      input,
      includedPrimaryTypes: ["(regions)"],
      languageCode: "en",
      regionCode: "IN",
    }),
  });

  if (!googleResponse.ok) {
    const googleError = await googleResponse.json().catch(() => null) as {
      error?: { status?: string; message?: string };
    } | null;
    console.error("Google Places error", googleResponse.status, googleError);
    return json(request, {
      error: googleResponse.status === 403
        ? "Google Places configuration is not active yet."
        : "Place suggestions are temporarily unavailable.",
      code: googleError?.error?.status ?? `HTTP_${googleResponse.status}`,
    }, 502);
  }

  const googleData = await googleResponse.json();
  const suggestions = (googleData.suggestions ?? [])
    .map((item: Record<string, any>) => item.placePrediction)
    .filter(Boolean)
    .map((prediction: Record<string, any>) => ({
      id: prediction.placeId,
      text: prediction.text?.text,
      mainText: prediction.structuredFormat?.mainText?.text ?? prediction.text?.text,
      secondaryText: prediction.structuredFormat?.secondaryText?.text ?? "",
    }))
    .filter((item: { id?: string; text?: string }) => item.id && item.text);

  return json(request, { suggestions, attribution: "Google Maps" });
});
