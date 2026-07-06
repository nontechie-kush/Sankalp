import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Baby,
  BriefcaseBusiness,
  Car,
  Check,
  Clock3,
  CreditCard,
  CalendarDays,
  DoorOpen,
  EyeOff,
  Flame,
  Heart,
  House,
  LoaderCircle,
  ListChecks,
  LogIn,
  LogOut,
  MapPin,
  MessageCircle,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TrendingDown,
  UserRound,
  Video,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "./auth";
import {
  createMyBooking,
  getMyBooking,
  loadAppData,
  loadMyBookings,
  payMyBooking,
  requestOtp,
  updateMyProfile,
  verifyOtp,
} from "./lib/api";
import {
  clearBookingDraft,
  consumeAuthReturnTo,
  createBookingDraft,
  loadBookingDraft,
  saveAuthReturnTo,
  saveBookingDraft,
} from "./lib/draft";
import {
  formatDate,
  formatMoney,
  getBookingFulfilmentExpectation,
  getFulfilmentExpectation,
  readableStatus,
  todayIso,
  type FulfilmentExpectation,
} from "./lib/format";
import type {
  AppData,
  Booking,
  BookingDraft,
  HomeBanner,
  MemberProfile,
  Ritual,
  RitualUseCase,
  Screen,
} from "./types";

const emptyData: AppData = {
  rituals: [],
  banners: [],
  useCases: [],
  slots: [],
  faqs: [],
};

const icons: Record<string, LucideIcon> = {
  briefcase: BriefcaseBusiness,
  car: Car,
  flame: Flame,
  heart: Heart,
  home: House,
  shield: ShieldCheck,
  sparkles: Sparkles,
  video: Video,
  eyeoff: EyeOff,
  trenddown: TrendingDown,
  baby: Baby,
  door: DoorOpen,
  pencil: Pencil,
  chat: MessageCircle,
};

function iconFor(name: string) {
  return icons[name] ?? Sparkles;
}

const activeStatuses = new Set([
  "pending_payment",
  "pending_assignment",
  "pandit_assigned",
  "ritual_scheduled",
]);

function isActiveBooking(booking: Booking) {
  return activeStatuses.has(booking.status);
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const [data, setData] = useState<AppData>(emptyData);
  const [catalogueLoading, setCatalogueLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<BookingDraft | null>(() => loadBookingDraft());
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [profileName, setProfileName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [resendAvailableAt, setResendAvailableAt] = useState(0);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const signingOutRef = useRef(false);

  useEffect(() => {
    let active = true;
    loadAppData()
      .then((nextData) => {
        if (active) setData(nextData);
      })
      .catch((reason: unknown) => {
        if (active) setError(errorMessage(reason) || "Could not load Sankalp");
      })
      .finally(() => {
        if (active) setCatalogueLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!auth.profile) return;
    setProfileName(auth.profile.name ?? "");
    setBirthDate(auth.profile.date_of_birth ?? "");
    setBirthPlace(auth.profile.place_of_birth ?? "");
  }, [auth.profile]);

  useEffect(() => {
    if (!draft) return;
    saveBookingDraft(draft);
  }, [draft]);

  useEffect(() => {
    setClockNow(Date.now());
    const interval = location.pathname === "/auth/otp" ? 1000 : 30_000;
    const timer = window.setInterval(() => setClockNow(Date.now()), interval);
    return () => window.clearInterval(timer);
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname !== "/auth/otp" || phone || auth.status === "initializing") return;
    const target =
      auth.status === "authenticated"
        ? consumeAuthReturnTo(draft ? "/checkout/payment" : "/bookings")
        : "/auth/phone";
    navigate(target, { replace: true });
  }, [auth.status, draft, location.pathname, navigate, phone]);

  const refreshBookings = useCallback(async () => {
    if (auth.status !== "authenticated") return [];
    setBookingsLoading(true);
    setBookingsError(null);
    try {
      const nextBookings = await loadMyBookings();
      setBookings(nextBookings);
      return nextBookings;
    } catch (reason) {
      setBookingsError(errorMessage(reason) || "Could not load your bookings.");
      return [];
    } finally {
      setBookingsLoading(false);
    }
  }, [auth.status]);

  useEffect(() => {
    if (auth.status === "authenticated") {
      void refreshBookings();
    } else if (auth.status === "guest") {
      setBookings([]);
      setCurrentBooking(null);
    }
  }, [auth.status, refreshBookings]);

  const bookingPathMatch = location.pathname.match(
    /^\/(?:bookings|booking-confirmed)\/([0-9a-f-]+)$/i,
  );
  const routeBookingId = bookingPathMatch?.[1] ?? null;

  const refreshCurrentBooking = useCallback(async () => {
    if (!routeBookingId || auth.status !== "authenticated") return null;
    setBookingLoading(true);
    try {
      const booking = await getMyBooking(routeBookingId);
      setCurrentBooking(booking);
      if (!booking) setBookingsError("This booking was not found in your account.");
      return booking;
    } catch (reason) {
      setBookingsError(errorMessage(reason) || "Could not refresh this booking.");
      return null;
    } finally {
      setBookingLoading(false);
    }
  }, [auth.status, routeBookingId]);

  useEffect(() => {
    if (routeBookingId && auth.status === "authenticated") void refreshCurrentBooking();
  }, [auth.status, refreshCurrentBooking, routeBookingId]);

  useEffect(() => {
    if (!routeBookingId || !currentBooking || !isActiveBooking(currentBooking)) return;
    const refresh = () => void refreshCurrentBooking();
    const timer = window.setInterval(refresh, 30_000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [currentBooking, refreshCurrentBooking, routeBookingId]);

  const protectedRoute =
    location.pathname === "/account" ||
    location.pathname.startsWith("/profile/") ||
    location.pathname === "/bookings" ||
    location.pathname.startsWith("/bookings/") ||
    location.pathname.startsWith("/booking-confirmed/") ||
    location.pathname === "/checkout/payment";

  useEffect(() => {
    if (!protectedRoute || auth.status !== "guest" || busy || signingOutRef.current) return;
    saveAuthReturnTo(location.pathname);
    navigate("/auth/phone", { replace: true });
  }, [auth.status, busy, location.pathname, navigate, protectedRoute]);

  const ritualPathMatch = location.pathname.match(/^\/ritual\/([^/]+)$/);
  const routedUseCaseId = ritualPathMatch ? decodeURIComponent(ritualPathMatch[1]) : null;
  const selectedUseCaseId = routedUseCaseId ?? draft?.useCaseId ?? null;
  const selectedUseCase = useMemo(
    () => data.useCases.find((item) => item.id === selectedUseCaseId) ?? null,
    [data.useCases, selectedUseCaseId],
  );
  const selectedRitual = useMemo(
    () =>
      selectedUseCase
        ? (data.rituals.find((item) => item.id === selectedUseCase.ritual_id) ?? null)
        : null,
    [data.rituals, selectedUseCase],
  );
  const fulfilment = useMemo(
    () => getFulfilmentExpectation(new Date(clockNow)),
    [clockNow],
  );
  const selectedSlot = useMemo(
    () =>
      data.slots.find(
        (slot) =>
          (slot.ritual_id === selectedRitual?.id || slot.ritual_id === null) &&
          slot.slot_date === fulfilment.serviceDateIso,
      ) ??
      data.slots.find(
        (slot) => slot.ritual_id === selectedRitual?.id || slot.ritual_id === null,
      ) ??
      data.slots[0] ??
      null,
    [data.slots, fulfilment.serviceDateIso, selectedRitual?.id],
  );
  const groupedUseCases = useMemo(
    () =>
      data.useCases.reduce<Record<string, RitualUseCase[]>>((groups, item) => {
        groups[item.group_label] = [...(groups[item.group_label] ?? []), item];
        return groups;
      }, {}),
    [data.useCases],
  );
  const activeBookings = useMemo(() => bookings.filter(isActiveBooking), [bookings]);

  function go(path: string, replace = false) {
    setError(null);
    navigate(path, { replace });
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }

  function selectUseCase(item: RitualUseCase) {
    const nextDraft = createBookingDraft(item.id);
    setDraft(nextDraft);
    saveBookingDraft(nextDraft);
    setCurrentBooking(null);
    go(`/ritual/${item.id}`);
  }

  function selectBanner(banner: HomeBanner) {
    const useCase =
      data.useCases.find((item) => item.ritual_id === banner.ritual_id && item.is_popular) ??
      data.useCases.find((item) => item.ritual_id === banner.ritual_id) ??
      data.useCases[0];
    if (useCase) selectUseCase(useCase);
  }

  function beginAuth(returnTo: string) {
    saveAuthReturnTo(returnTo);
    go("/auth/phone");
  }

  function continueBooking() {
    if (!draft && selectedUseCase) {
      const nextDraft = createBookingDraft(selectedUseCase.id);
      setDraft(nextDraft);
      saveBookingDraft(nextDraft);
    }
    if (auth.status === "authenticated") {
      go("/checkout/payment");
    } else {
      beginAuth("/checkout/payment");
    }
  }

  async function sendOtp() {
    if (!phone) return;
    setBusy(true);
    setError(null);
    try {
      await requestOtp(phone);
      setOtp("");
      setResendAvailableAt(Date.now() + 60_000);
      setClockNow(Date.now());
      go("/auth/otp");
    } catch (reason) {
      setError(authErrorMessage(reason, "The OTP could not be sent."));
    } finally {
      setBusy(false);
    }
  }

  async function confirmOtp() {
    setBusy(true);
    setError(null);
    try {
      const verifiedLead = await verifyOtp(phone, otp);
      if (!verifiedLead) throw new Error("The OTP could not be verified.");
      const verifiedProfile = await auth.refreshProfile();
      if (!verifiedProfile) throw new Error("Your Sankalp profile could not be loaded.");
      if (!verifiedProfile.profile_completed_at) {
        go("/profile/name", true);
      } else {
        go(consumeAuthReturnTo(draft ? "/checkout/payment" : "/bookings"), true);
      }
    } catch (reason) {
      setError(authErrorMessage(reason, "The OTP could not be verified."));
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile(nextPath: string, complete = false) {
    const cleanName = profileName.trim();
    if (cleanName.length < 2) {
      setError("Enter your full name to continue.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const updated = await updateMyProfile({
        name: cleanName,
        dateOfBirth: birthDate || null,
        placeOfBirth: birthPlace.trim() || null,
        complete,
      });
      if (!updated) throw new Error("Your profile could not be saved.");
      await auth.refreshProfile();
      go(complete ? consumeAuthReturnTo(draft ? "/checkout/payment" : "/bookings") : nextPath, true);
    } catch (reason) {
      setError(errorMessage(reason) || "Your profile could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  function editProfile() {
    saveAuthReturnTo("/account");
    go("/profile/name");
  }

  async function pay() {
    if (!draft || !selectedRitual || !selectedUseCase || auth.status !== "authenticated") return;
    setBusy(true);
    setError(null);
    try {
      const created = await createMyBooking({
        ritualId: selectedRitual.id,
        useCaseId: selectedUseCase.id,
        slotId: selectedSlot?.id ?? null,
        customerName: auth.profile?.name || "Sankalp customer",
        intentNote: `${selectedUseCase.title}. ${fulfilment.title} (${fulfilment.dateLabel}). ${fulfilment.detail}`,
        clientRequestId: draft.clientRequestId,
      });
      await payMyBooking(created.booking_id, draft.paymentIdempotencyKey);
      const confirmedBooking = await getMyBooking(created.booking_id);
      if (!confirmedBooking) throw new Error("The booking could not be retrieved.");
      setCurrentBooking(confirmedBooking);
      clearBookingDraft();
      setDraft(null);
      await refreshBookings();
      go(`/booking-confirmed/${created.booking_id}`, true);
    } catch (reason) {
      setError(errorMessage(reason) || "The payment could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  async function resumePayment(booking: Booking) {
    setBusy(true);
    setBookingsError(null);
    try {
      await payMyBooking(booking.booking_id, crypto.randomUUID());
      await refreshBookings();
      go(`/bookings/${booking.booking_id}`);
    } catch (reason) {
      setBookingsError(errorMessage(reason) || "The payment could not be resumed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    signingOutRef.current = true;
    setBusy(true);
    setError(null);
    go("/", true);
    try {
      await auth.signOut();
      clearBookingDraft();
      setDraft(null);
      setPhone("");
      setOtp("");
      setProfileName("");
      setBirthDate("");
      setBirthPlace("");
      setBookings([]);
      setCurrentBooking(null);
    } catch (reason) {
      signingOutRef.current = false;
      setError(errorMessage(reason) || "Could not sign out.");
    } finally {
      setBusy(false);
      window.setTimeout(() => {
        signingOutRef.current = false;
      }, 0);
    }
  }

  const phoneIsValid = Boolean(phone && isValidPhoneNumber(phone));
  const otpIsValid = /^\d{6}$/.test(otp);
  const resendSeconds = Math.max(0, Math.ceil((resendAvailableAt - clockNow) / 1000));
  const profileStep = location.pathname === "/profile/name"
    ? 1
    : location.pathname === "/profile/birth-date"
      ? 2
      : location.pathname === "/profile/birth-place"
        ? 3
        : null;
  const checkoutScreen: Screen | null = location.pathname.startsWith("/ritual/")
    ? "ritual"
    : location.pathname === "/auth/phone" && draft
      ? "phone"
      : location.pathname === "/auth/otp" && draft
        ? "otp"
        : location.pathname === "/checkout/payment"
          ? "payment"
          : location.pathname.startsWith("/booking-confirmed/")
            ? "confirm"
            : null;

  function checkoutBackPath(screen: Screen) {
    if (screen === "phone") return selectedUseCase ? `/ritual/${selectedUseCase.id}` : "/";
    if (screen === "otp") return "/auth/phone";
    if (screen === "payment") return selectedUseCase ? `/ritual/${selectedUseCase.id}` : "/";
    return "/";
  }

  let content: ReactNode;
  if (catalogueLoading || auth.status === "initializing") {
    content = <LoadingState />;
  } else if (location.pathname === "/") {
    content = (
      <HomeView
        data={data}
        memberName={auth.profile?.name ?? null}
        groupedUseCases={groupedUseCases}
        error={error}
        onBanner={selectBanner}
        onUseCase={selectUseCase}
        onPrimary={() => data.useCases[0] && selectUseCase(data.useCases[0])}
      />
    );
  } else if (location.pathname === "/profile/name" && auth.status === "authenticated") {
    content = (
      <ProfileNameView
        value={profileName}
        busy={busy}
        error={error}
        onChange={setProfileName}
        onContinue={() => void saveProfile("/profile/birth-date")}
      />
    );
  } else if (location.pathname === "/profile/birth-date" && auth.status === "authenticated") {
    content = (
      <ProfileBirthDateView
        value={birthDate}
        busy={busy}
        error={error}
        onChange={setBirthDate}
        onContinue={() => void saveProfile("/profile/birth-place")}
        onSkip={() => void saveProfile("/profile/birth-place")}
      />
    );
  } else if (location.pathname === "/profile/birth-place" && auth.status === "authenticated") {
    content = (
      <ProfileBirthPlaceView
        value={birthPlace}
        busy={busy}
        error={error}
        onChange={setBirthPlace}
        onContinue={() => void saveProfile("", true)}
        onSkip={() => void saveProfile("", true)}
      />
    );
  } else if (location.pathname.startsWith("/ritual/") && selectedRitual && selectedUseCase) {
    content = (
      <RitualView
        ritual={selectedRitual}
        selectedUseCase={selectedUseCase}
        relatedUseCases={data.useCases.filter((item) => item.ritual_id === selectedRitual.id)}
        fulfilment={fulfilment}
        onUseCase={selectUseCase}
        onContinue={continueBooking}
      />
    );
  } else if (location.pathname === "/auth/phone") {
    content = (
      <PhoneView
        phone={phone}
        error={error}
        busy={busy}
        useCase={selectedUseCase}
        fulfilment={draft ? fulfilment : undefined}
        onPhone={setPhone}
        onContinue={sendOtp}
        canContinue={phoneIsValid}
      />
    );
  } else if (location.pathname === "/auth/otp" && phone) {
    content = (
      <OtpView
        phone={phone}
        fulfilment={draft ? fulfilment : undefined}
        otp={otp}
        busy={busy}
        error={error}
        resendSeconds={resendSeconds}
        onOtp={(value) => setOtp(value.replace(/\D/g, ""))}
        onResend={sendOtp}
        onVerify={confirmOtp}
        canVerify={otpIsValid}
      />
    );
  } else if (
    location.pathname === "/checkout/payment" &&
    selectedRitual &&
    selectedUseCase &&
    auth.status === "authenticated"
  ) {
    content = (
      <PaymentView
        ritual={selectedRitual}
        useCase={selectedUseCase}
        fulfilment={fulfilment}
        busy={busy}
        error={error}
        member={auth.profile}
        onPay={pay}
      />
    );
  } else if (location.pathname.startsWith("/booking-confirmed/") && auth.status === "authenticated") {
    content = bookingLoading ? (
      <LoadingState />
    ) : currentBooking ? (
      <ConfirmationView
        booking={currentBooking}
        fulfilment={getBookingFulfilmentExpectation(
          currentBooking.promised_service_date,
          currentBooking.booked_before_cutoff,
        )}
        onStatus={() => go(`/bookings/${currentBooking.booking_id}`)}
        onHome={() => go("/")}
      />
    ) : (
      <MemberEmptyState
        title="Booking not found"
        text={bookingsError || "This booking is not available in your account."}
        action="Back to My Bookings"
        onAction={() => go("/bookings")}
      />
    );
  } else if (location.pathname === "/bookings" && auth.status === "authenticated") {
    content = (
      <MyBookingsView
        bookings={bookings}
        loading={bookingsLoading}
        error={bookingsError}
        busy={busy}
        onOpen={(booking) => go(`/bookings/${booking.booking_id}`)}
        onResume={resumePayment}
        onRefresh={() => void refreshBookings()}
        onExplore={() => go("/")}
      />
    );
  } else if (location.pathname.startsWith("/bookings/") && auth.status === "authenticated") {
    content = bookingLoading ? (
      <LoadingState />
    ) : currentBooking ? (
      <StatusView
        booking={currentBooking}
        fulfilment={getBookingFulfilmentExpectation(
          currentBooking.promised_service_date,
          currentBooking.booked_before_cutoff,
        )}
        onHome={() => go("/bookings")}
        onRefresh={() => void refreshCurrentBooking()}
      />
    ) : (
      <MemberEmptyState
        title="Booking not found"
        text={bookingsError || "This booking is not available in your account."}
        action="Back to My Bookings"
        onAction={() => go("/bookings")}
      />
    );
  } else if (location.pathname === "/account" && auth.status === "authenticated") {
    content = (
      <AccountView
        profile={auth.profile}
        bookingCount={bookings.length}
        busy={busy}
        error={error}
        onBookings={() => go("/bookings")}
        onEditProfile={editProfile}
        onSignOut={handleSignOut}
      />
    );
  } else if (protectedRoute && auth.status !== "authenticated") {
    content = <LoadingState />;
  } else if (location.pathname === "/checkout/payment") {
    content = (
      <MemberEmptyState
        title="Your booking draft expired"
        text="Choose your ritual again and we will restart the booking safely."
        action="Explore rituals"
        onAction={() => go("/")}
      />
    );
  } else {
    content = (
      <MemberEmptyState
        title="Page not found"
        text="The page you requested does not exist."
        action="Back home"
        onAction={() => go("/")}
      />
    );
  }

  return (
    <main className="page">
      <section className="mweb-shell">
        <SiteHeader
          authStatus={auth.status}
          profile={auth.profile}
          activeBookings={activeBookings}
          onHome={() => go("/")}
          onSignIn={() => beginAuth("/bookings")}
          onBookings={() => go("/bookings")}
          onTrack={() =>
            activeBookings.length === 1
              ? go(`/bookings/${activeBookings[0].booking_id}`)
              : go("/bookings")
          }
          onAccount={() => go("/account")}
        />
        {checkoutScreen && (
          <CheckoutNavigation
            screen={checkoutScreen}
            title={screenTitle(checkoutScreen)}
            onBack={() => go(checkoutBackPath(checkoutScreen))}
            muted={checkoutScreen === "confirm"}
          />
        )}
        {profileStep && (
          <ProfileNavigation
            step={profileStep}
            onBack={profileStep === 1 ? undefined : () => go(profileStep === 2 ? "/profile/name" : "/profile/birth-date")}
          />
        )}
        {content}
      </section>
    </main>
  );
}

function authErrorMessage(reason: unknown, fallback: string) {
  const message = errorMessage(reason);
  const normalized = message.toLowerCase();

  if (normalized.includes("rate") || normalized.includes("too many")) {
    return "Too many OTP requests. Please wait a few minutes and try again.";
  }
  if (normalized.includes("expired")) {
    return "This OTP has expired. Request a new code and try again.";
  }
  if (normalized.includes("invalid") && normalized.includes("token")) {
    return "That OTP is incorrect. Check the six digits and try again.";
  }
  if (normalized.includes("phone")) {
    return "Enter a valid mobile number with the correct country code.";
  }

  return message || fallback;
}

function errorMessage(reason: unknown) {
  if (reason instanceof Error) return reason.message;
  if (
    reason &&
    typeof reason === "object" &&
    "message" in reason &&
    typeof reason.message === "string"
  ) {
    return reason.message;
  }
  return "";
}

function screenTitle(screen: Screen) {
  return {
    home: "Sankalp",
    ritual: "Ritual details",
    phone: "Verify phone",
    otp: "Enter OTP",
    payment: "Payment",
    confirm: "Confirmed",
    status: "Booking status",
  }[screen];
}

function SiteHeader({
  authStatus,
  profile,
  activeBookings,
  onHome,
  onSignIn,
  onBookings,
  onTrack,
  onAccount,
}: {
  authStatus: "initializing" | "guest" | "authenticated";
  profile: MemberProfile | null;
  activeBookings: Booking[];
  onHome: () => void;
  onSignIn: () => void;
  onBookings: () => void;
  onTrack: () => void;
  onAccount: () => void;
}) {
  const firstName = profile?.name?.trim().split(/\s+/)[0] || "Account";
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <button className="brand-button" onClick={onHome} aria-label="Sankalp home">
          <span className="brand-symbol">
            <Sparkles />
          </span>
          <span className="brand-copy">
            <strong>Sankalp</strong>
            <small>by Tathastu</small>
          </span>
        </button>

        <div className="site-actions">
          <span className="location-pill">
            <MapPin /> Mumbai
          </span>
          {authStatus === "guest" && (
            <button className="track-button" onClick={onSignIn}>
              <LogIn /> Sign in
            </button>
          )}
          {authStatus === "authenticated" && activeBookings.length > 0 && (
            <button className="track-button" onClick={onTrack}>
              <ListChecks /> {activeBookings.length === 1 ? "Track booking" : "My bookings"}
            </button>
          )}
          {authStatus === "authenticated" && activeBookings.length === 0 && (
            <button className="track-button" onClick={onBookings}>
              <ListChecks /> My bookings
            </button>
          )}
          {authStatus === "authenticated" && (
            <button className="account-button" onClick={onAccount} aria-label={`${firstName} account`}>
              <span>{firstName.slice(0, 1).toUpperCase()}</span>
              <UserRound />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function CheckoutNavigation({
  screen,
  title,
  onBack,
  muted = false,
}: {
  screen: Screen;
  title: string;
  onBack: () => void;
  muted?: boolean;
}) {
  const stepByScreen: Partial<Record<Screen, number>> = {
    ritual: 1,
    phone: 2,
    otp: 2,
    payment: 3,
    confirm: 3,
    status: 3,
  };
  const currentStep = stepByScreen[screen] ?? 1;
  const complete = screen === "confirm" || screen === "status";

  return (
    <nav className="checkout-nav" aria-label="Booking progress">
      <div className="checkout-nav-row">
        <button className="back-button" onClick={onBack} disabled={muted}>
          <ArrowLeft /> Back
        </button>
        <div className="checkout-title">
          <span>{complete ? "Booking complete" : `Step ${currentStep} of 3`}</span>
          <strong>{title}</strong>
        </div>
        <span className="step-count">{complete ? "Done" : `${currentStep}/3`}</span>
      </div>
      <div className="progress-track" aria-hidden="true">
        {[1, 2, 3].map((step) => (
          <i className={step <= currentStep ? "active" : ""} key={step} />
        ))}
      </div>
    </nav>
  );
}

function ProfileNavigation({ step, onBack }: { step: number; onBack?: () => void }) {
  return (
    <nav className="checkout-nav" aria-label="Profile setup progress">
      <div className="checkout-nav-row">
        <button className="back-button" onClick={onBack} disabled={!onBack}>
          <ArrowLeft /> Back
        </button>
        <div className="checkout-title">
          <span>Profile setup</span>
          <strong>{step === 1 ? "Full name" : step === 2 ? "Birth date" : "Birth place"}</strong>
        </div>
        <span className="step-count">{step}/3</span>
      </div>
      <div className="progress-track" aria-hidden="true">
        {[1, 2, 3].map((item) => (
          <i className={item <= step ? "active" : ""} key={item} />
        ))}
      </div>
    </nav>
  );
}

function LoadingState() {
  return (
    <div className="center-state" role="status">
      <LoaderCircle className="spin" />
      <p>Preparing your Sankalp...</p>
    </div>
  );
}

function HomeView({
  data,
  memberName,
  groupedUseCases,
  error,
  onBanner,
  onUseCase,
  onPrimary,
}: {
  data: AppData;
  memberName: string | null;
  groupedUseCases: Record<string, RitualUseCase[]>;
  error: string | null;
  onBanner: (banner: HomeBanner) => void;
  onUseCase: (item: RitualUseCase) => void;
  onPrimary: () => void;
}) {
  const firstGroup = Object.entries(groupedUseCases)[0];
  const faqs = data.faqs.map((faq) =>
    faq.question === "What do I have to do?"
      ? {
          ...faq,
          answer:
            "Choose the moment and ritual, verify your phone, and complete payment. We schedule the auspicious performance and handle pandit assignment for you.",
        }
      : faq,
  );

  return (
    <div className="home-page">
      <section className="greeting">
        <div className="hero-layout">
          <div className="hero-message">
            <span>{memberName ? `Namaste, ${memberName}` : "Trusted ritual booking"}</span>
            <h1>Choose the moment. We handle the ritual.</h1>
            <p>
              Book a verified pandit for life&rsquo;s important moments. We schedule the ritual and
              keep you updated from confirmation to completion.
            </p>
            <div className="hero-actions">
              <button className="primary-button" onClick={onPrimary} disabled={!data.useCases.length}>
                Find your ritual <ArrowRight />
              </button>
              <small>No calls. Secure phone verification only.</small>
            </div>
            <div className="hero-assurances" aria-label="Service assurances">
              <span>
                <ShieldCheck /> Verified pandits
              </span>
              <span>
                <Sparkles /> Auspiciously scheduled
              </span>
              <span>
                <Smartphone /> Status updates
              </span>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <RitualArt />
            <div className="hero-visual-card">
              <span>Simple booking</span>
              <strong>Ritual to confirmation</strong>
              <small>in a few guided steps</small>
            </div>
          </div>
        </div>
      </section>

      <div className="content-container">
        {error && <InlineError message={error} />}

        <SectionTitle eyebrow="Featured services" title="Rituals for the moment you are in" />
        <section className="banner-track" aria-label="Featured rituals">
          {data.banners.map((banner) => (
            <button
              className={`hero-card tone-${banner.visual_tone}`}
              onClick={() => onBanner(banner)}
              key={banner.id}
            >
              <div className="hero-art">
                <RitualArt />
                <span>{banner.badge}</span>
              </div>
              <div className="hero-copy">
                <h2>{banner.title}</h2>
                <p>{banner.subtitle}</p>
              </div>
            </button>
          ))}
        </section>

        <SectionTitle eyebrow="Browse by moment" title="What is happening right now?" />

        <div className="moment-groups-grid">
          {Object.entries(groupedUseCases).map(([group, items]) => (
            <section className="moment-group" key={group}>
              <h3>{group}</h3>
              {items.slice(0, group === firstGroup?.[0] ? 4 : 3).map((item) => (
                <UseCaseRow item={item} onClick={() => onUseCase(item)} key={item.id} />
              ))}
            </section>
          ))}
        </div>

        <div className="home-info-grid">
          <section className="trust-card">
            <div>
              <ShieldCheck />
              <strong>How it works</strong>
            </div>
            <ol>
              <li>Tell us what the moment is.</li>
              <li>Choose the ritual; we schedule the auspicious performance.</li>
              <li>Verify your phone and confirm the booking.</li>
              <li>Track pandit assignment and completion.</li>
            </ol>
          </section>

          <div className="faq-block">
            <SectionTitle eyebrow="Questions" title="Before you book" />
            <section className="faq-list">
              {faqs.map((faq) => (
                <details key={faq.id}>
                  <summary>{faq.question}</summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </section>
          </div>
        </div>
      </div>

      <footer className="site-footer">
        <span>Sankalp by Tathastu</span>
        <small>Thoughtful rituals, clearly coordinated.</small>
      </footer>
    </div>
  );
}

function RitualView({
  ritual,
  selectedUseCase,
  relatedUseCases,
  fulfilment,
  onUseCase,
  onContinue,
}: {
  ritual: Ritual;
  selectedUseCase: RitualUseCase;
  relatedUseCases: RitualUseCase[];
  fulfilment: FulfilmentExpectation;
  onUseCase: (item: RitualUseCase) => void;
  onContinue: () => void;
}) {
  const SelectedIcon = iconFor(selectedUseCase.icon_name);

  return (
    <>
      <div className="scroll-area with-bar">
        <section className="ritual-hero">
          <RitualArt />
          <span>{selectedUseCase.group_label}</span>
          <h1>{ritual.title}</h1>
          <p>{ritual.short_description ?? ritual.description}</p>
        </section>

        <section className="selected-card">
          <div className="mini-icon">
            <SelectedIcon />
          </div>
          <div>
            <span>Selected sankalp</span>
            <h2>{selectedUseCase.title}</h2>
            <p>{selectedUseCase.subtitle}</p>
          </div>
          <strong>{formatMoney(selectedUseCase.price_minor, selectedUseCase.currency)}</strong>
        </section>

        <ServicePromise fulfilment={fulfilment} compact />

        <SectionTitle eyebrow="Includes" title="Built for low-friction booking" />
        <section className="info-grid">
          <InfoTile icon={<ShieldCheck />} title="Verified pandit" text="Manually assigned for quality." />
          <InfoTile icon={<Sparkles />} title="Status tracking" text="Follow every booking step." />
          <InfoTile icon={<Smartphone />} title="Phone verified" text="Secure SMS verification." />
        </section>

        {relatedUseCases.length > 1 && (
          <>
            <SectionTitle eyebrow="Similar moments" title="Tune the intent" />
            <section className="compact-list">
              {relatedUseCases.map((item) => (
                <UseCaseRow
                  item={item}
                  active={item.id === selectedUseCase.id}
                  onClick={() => onUseCase(item)}
                  key={item.id}
                />
              ))}
            </section>
          </>
        )}
      </div>

      <BottomBar
        label={fulfilment.title}
        value={formatMoney(selectedUseCase.price_minor, selectedUseCase.currency)}
        action="Continue booking"
        onAction={onContinue}
      />
    </>
  );
}

function PhoneView({
  phone,
  error,
  busy,
  useCase,
  fulfilment,
  onPhone,
  onContinue,
  canContinue,
}: {
  phone: string;
  error: string | null;
  busy: boolean;
  useCase: RitualUseCase | null;
  fulfilment?: FulfilmentExpectation;
  onPhone: (value: string) => void;
  onContinue: () => void;
  canContinue: boolean;
}) {
  return (
    <div className="form-screen">
      <section className="form-card">
        <span>Phone verification</span>
        <h1>Where should we send the OTP?</h1>
        <p>
          {useCase
            ? `Booking ${useCase.title}. We will schedule the auspicious performance for you.`
            : "Sign in to view your bookings and continue securely on any device."}
        </p>
        {fulfilment && <ServicePromise fulfilment={fulfilment} compact />}
        <label htmlFor="mobile-number">Mobile number</label>
        <PhoneInput
          id="mobile-number"
          className="phone-number-input"
          value={phone || undefined}
          onChange={(value) => onPhone(value ?? "")}
          defaultCountry="IN"
          international
          countryCallingCodeEditable={false}
          placeholder="Enter mobile number"
          autoComplete="tel"
        />
        <p className="field-note">
          Use the same phone number each time. We will securely sign you in after verification.
        </p>
        {error && <InlineError message={error} />}
        <button
          className="primary-button full"
          onClick={onContinue}
          disabled={!canContinue || busy}
        >
          {busy ? <LoaderCircle className="spin" /> : <Smartphone />}
          Send OTP
        </button>
      </section>
    </div>
  );
}

function ProfileNameView({
  value,
  busy,
  error,
  onChange,
  onContinue,
}: {
  value: string;
  busy: boolean;
  error: string | null;
  onChange: (value: string) => void;
  onContinue: () => void;
}) {
  return (
    <ProfileFormShell
      eyebrow="Your ritual profile"
      title="What is your full name?"
      text="We will save it to your account and use it for this and future ritual bookings."
      error={error}
    >
      <label htmlFor="profile-full-name">Full name</label>
      <input
        id="profile-full-name"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Enter your full name"
        autoComplete="name"
        autoFocus
      />
      <ProfilePrivacyNote />
      <button
        className="primary-button full"
        onClick={onContinue}
        disabled={value.trim().length < 2 || busy}
      >
        {busy ? <LoaderCircle className="spin" /> : <ArrowRight />}
        Continue
      </button>
    </ProfileFormShell>
  );
}

function ProfileBirthDateView({
  value,
  busy,
  error,
  onChange,
  onContinue,
  onSkip,
}: {
  value: string;
  busy: boolean;
  error: string | null;
  onChange: (value: string) => void;
  onContinue: () => void;
  onSkip: () => void;
}) {
  return (
    <ProfileFormShell
      eyebrow="Optional"
      title="Your date of birth"
      text="This helps the pandit prepare the ritual details accurately. Add it once and we will remember it for future bookings."
      error={error}
    >
      <label htmlFor="profile-birth-date">Date of birth <em>Optional</em></label>
      <input
        id="profile-birth-date"
        type="date"
        value={value}
        max={todayIso()}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="bday"
      />
      <ProfilePrivacyNote />
      <button className="primary-button full" onClick={onContinue} disabled={busy}>
        {busy ? <LoaderCircle className="spin" /> : <ArrowRight />}
        Save and continue
      </button>
      <button className="text-button profile-skip" onClick={onSkip} disabled={busy}>
        Skip for now
      </button>
    </ProfileFormShell>
  );
}

function ProfileBirthPlaceView({
  value,
  busy,
  error,
  onChange,
  onContinue,
  onSkip,
}: {
  value: string;
  busy: boolean;
  error: string | null;
  onChange: (value: string) => void;
  onContinue: () => void;
  onSkip: () => void;
}) {
  return (
    <ProfileFormShell
      eyebrow="Optional"
      title="Your place of birth"
      text="This may be useful for rituals that need birth details. Save it once so you do not have to enter it every time."
      error={error}
    >
      <label htmlFor="profile-birth-place">Place of birth <em>Optional</em></label>
      <input
        id="profile-birth-place"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="City, State or Country"
        autoComplete="off"
      />
      <ProfilePrivacyNote />
      <button className="primary-button full" onClick={onContinue} disabled={busy}>
        {busy ? <LoaderCircle className="spin" /> : <Check />}
        Save profile
      </button>
      <button className="text-button profile-skip" onClick={onSkip} disabled={busy}>
        Skip for now
      </button>
    </ProfileFormShell>
  );
}

function ProfileFormShell({
  eyebrow,
  title,
  text,
  error,
  children,
}: {
  eyebrow: string;
  title: string;
  text: string;
  error: string | null;
  children: ReactNode;
}) {
  return (
    <div className="form-screen profile-form-screen">
      <section className="form-card">
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{text}</p>
        {children}
        {error && <InlineError message={error} />}
      </section>
    </div>
  );
}

function ProfilePrivacyNote() {
  return (
    <p className="profile-privacy-note">
      <ShieldCheck /> Saved securely to your Sankalp account. You can update it later.
    </p>
  );
}

function OtpView({
  phone,
  fulfilment,
  otp,
  busy,
  error,
  resendSeconds,
  onOtp,
  onResend,
  onVerify,
  canVerify,
}: {
  phone: string;
  fulfilment?: FulfilmentExpectation;
  otp: string;
  busy: boolean;
  error: string | null;
  resendSeconds: number;
  onOtp: (value: string) => void;
  onResend: () => void;
  onVerify: () => void;
  canVerify: boolean;
}) {
  return (
    <div className="form-screen">
      <section className="form-card">
        <span>OTP sent</span>
        <h1>Enter the verification code</h1>
        <p>
          We sent a 6-digit code to <strong>{phone}</strong>. It expires shortly.
        </p>
        {fulfilment && <ServicePromise fulfilment={fulfilment} compact />}
        <label>
          OTP
          <input
            value={otp}
            onChange={(event) => onOtp(event.target.value)}
            inputMode="numeric"
            maxLength={6}
            placeholder="6-digit OTP"
            autoComplete="one-time-code"
          />
        </label>
        <button
          type="button"
          className="text-button"
          onClick={onResend}
          disabled={busy || resendSeconds > 0}
        >
          {resendSeconds > 0 ? `Resend OTP in ${resendSeconds}s` : "Resend OTP"}
        </button>
        {error && <InlineError message={error} />}
        <button
          className="primary-button full"
          onClick={onVerify}
          disabled={!canVerify || busy}
        >
          {busy ? <LoaderCircle className="spin" /> : <Check />}
          Verify
        </button>
      </section>
    </div>
  );
}

function PaymentView({
  ritual,
  useCase,
  fulfilment,
  busy,
  error,
  member,
  onPay,
}: {
  ritual: Ritual;
  useCase: RitualUseCase;
  fulfilment: FulfilmentExpectation;
  busy: boolean;
  error: string | null;
  member: MemberProfile | null;
  onPay: () => void;
}) {
  return (
    <>
      <div className="scroll-area with-bar">
        <section className="payment-card">
          <CreditCard />
          <span>Secure checkout</span>
          <h1>{formatMoney(useCase.price_minor, useCase.currency)}</h1>
          <p>Payment confirms your booking and the fulfilment window shown below.</p>
        </section>
        <ServicePromise fulfilment={fulfilment} compact />
        <section className="receipt">
          <ReceiptRow label="Account" value={member?.name || maskPhone(member?.phone)} />
          <ReceiptRow label="Ritual" value={ritual.title} />
          <ReceiptRow label="Intent" value={useCase.title} />
          <ReceiptRow label="Expected" value={fulfilment.dateLabel} />
          <ReceiptRow
            label="Total"
            value={formatMoney(useCase.price_minor, useCase.currency)}
            strong
          />
        </section>
        {error && <InlineError message={error} />}
      </div>

      <BottomBar
        label="Pay now"
        value={formatMoney(useCase.price_minor, useCase.currency)}
        action={busy ? "Processing" : "Confirm booking"}
        onAction={onPay}
        disabled={busy}
      />
    </>
  );
}

function ConfirmationView({
  booking,
  fulfilment,
  onStatus,
  onHome,
}: {
  booking: Booking;
  fulfilment: FulfilmentExpectation;
  onStatus: () => void;
  onHome: () => void;
}) {
  return (
    <div className="success-screen">
      <div className="success-orb">
        <Check />
      </div>
      <span>Booking confirmed</span>
      <h1>{booking.booking_number}</h1>
      <p>
        Your {booking.ritual_title} booking is now <strong>{readableStatus(booking.status)}</strong>.
      </p>
      <ServicePromise fulfilment={fulfilment} compact />
      <section className="receipt">
        <ReceiptRow label="Intent" value={booking.use_case_title ?? "Sankalp"} />
        <ReceiptRow label="Expected" value={fulfilment.dateLabel} />
        <ReceiptRow label="Amount" value={formatMoney(booking.amount_minor, booking.currency)} />
      </section>
      <div className="action-row">
        <button className="secondary-button" onClick={onHome}>
          Home
        </button>
        <button className="primary-button" onClick={onStatus}>
          Track status <ArrowRight />
        </button>
      </div>
    </div>
  );
}

function StatusView({
  booking,
  fulfilment,
  onHome,
  onRefresh,
}: {
  booking: Booking;
  fulfilment: FulfilmentExpectation;
  onHome: () => void;
  onRefresh: () => void;
}) {
  const stages = [
    "pending_payment",
    "pending_assignment",
    "pandit_assigned",
    "ritual_scheduled",
    "completed",
  ];
  const currentStage = stages.indexOf(booking.status);
  const cancelled = booking.status === "cancelled";

  return (
    <div className="scroll-area status-view">
      <section className="status-card">
        <span>{booking.booking_number}</span>
        <h1>{booking.ritual_title}</h1>
        <p>Current status: {readableStatus(booking.status)}</p>
      </section>
      <ServicePromise fulfilment={fulfilment} compact />
      {cancelled ? (
        <section className="cancelled-card" aria-label="Cancellation status">
          <h2>Booking cancelled</h2>
          <p>This booking is no longer scheduled. Contact support if you need assistance.</p>
        </section>
      ) : (
        <section className="timeline" aria-label="Booking progress">
          {stages.map((stage, index) => (
            <div className={currentStage >= 0 && index <= currentStage ? "done" : ""} key={stage}>
              <i>{currentStage >= 0 && index <= currentStage ? <Check /> : index + 1}</i>
              <span>{readableStatus(stage)}</span>
            </div>
          ))}
        </section>
      )}
      <div className="action-row status-actions">
        <button className="secondary-button" onClick={onHome}>
          My Bookings
        </button>
        <button className="primary-button" onClick={onRefresh}>
          Refresh status
        </button>
      </div>
    </div>
  );
}

function MyBookingsView({
  bookings,
  loading,
  error,
  busy,
  onOpen,
  onResume,
  onRefresh,
  onExplore,
}: {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  busy: boolean;
  onOpen: (booking: Booking) => void;
  onResume: (booking: Booking) => void;
  onRefresh: () => void;
  onExplore: () => void;
}) {
  const active = bookings.filter(isActiveBooking);
  const history = bookings.filter((booking) => !isActiveBooking(booking));

  return (
    <div className="member-page">
      <MemberPageHeading
        eyebrow="Your account"
        title="My Bookings"
        action="Refresh"
        onAction={onRefresh}
      />
      {error && <InlineError message={error} />}
      {loading ? (
        <LoadingState />
      ) : bookings.length === 0 ? (
        <MemberEmptyState
          title="No bookings yet"
          text="When you book a ritual, its confirmation and live status will appear here on every device."
          action="Explore rituals"
          onAction={onExplore}
        />
      ) : (
        <>
          {active.length > 0 && (
            <BookingGroup
              title="Active"
              bookings={active}
              busy={busy}
              onOpen={onOpen}
              onResume={onResume}
            />
          )}
          {history.length > 0 && (
            <BookingGroup
              title="History"
              bookings={history}
              busy={busy}
              onOpen={onOpen}
              onResume={onResume}
            />
          )}
        </>
      )}
    </div>
  );
}

function BookingGroup({
  title,
  bookings,
  busy,
  onOpen,
  onResume,
}: {
  title: string;
  bookings: Booking[];
  busy: boolean;
  onOpen: (booking: Booking) => void;
  onResume: (booking: Booking) => void;
}) {
  return (
    <section className="booking-group" aria-label={`${title} bookings`}>
      <h2>{title}</h2>
      <div className="booking-list">
        {bookings.map((booking) => (
          <article
            className="booking-list-card"
            aria-label={`${booking.booking_number} ${booking.ritual_title}`}
            key={booking.booking_id}
          >
            <button onClick={() => onOpen(booking)}>
              <span className="booking-list-icon"><CalendarDays /></span>
              <span>
                <small>{booking.booking_number}</small>
                <strong>{booking.ritual_title}</strong>
                <em>{readableStatus(booking.status)}</em>
              </span>
              <span className="booking-date">
                {formatDate(booking.promised_service_date || booking.preferred_date)}
                <ArrowRight />
              </span>
            </button>
            {booking.status === "pending_payment" && (
              <button
                className="resume-payment"
                onClick={() => onResume(booking)}
                disabled={busy}
              >
                Resume payment
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function AccountView({
  profile,
  bookingCount,
  busy,
  error,
  onBookings,
  onEditProfile,
  onSignOut,
}: {
  profile: MemberProfile | null;
  bookingCount: number;
  busy: boolean;
  error: string | null;
  onBookings: () => void;
  onEditProfile: () => void;
  onSignOut: () => void;
}) {
  return (
    <div className="member-page account-page">
      <MemberPageHeading eyebrow="Signed in" title="Your account" />
      <section className="account-card">
        <span className="account-avatar">{(profile?.name || "S").slice(0, 1).toUpperCase()}</span>
        <div>
          <h2>{profile?.name || "Sankalp member"}</h2>
          <p>{maskPhone(profile?.phone)}</p>
          <small>Phone verified</small>
        </div>
      </section>
      <section className="profile-summary" aria-label="Ritual profile">
        <div>
          <span>Full name</span>
          <strong>{profile?.name || "Not added"}</strong>
        </div>
        <div>
          <span>Date of birth</span>
          <strong>{formatProfileBirthDate(profile?.date_of_birth)}</strong>
        </div>
        <div>
          <span>Place of birth</span>
          <strong>{profile?.place_of_birth || "Not added"}</strong>
        </div>
        <button className="text-button" onClick={onEditProfile}>
          <Pencil /> Edit ritual profile
        </button>
      </section>
      <button className="account-row" onClick={onBookings}>
        <ListChecks />
        <span><strong>My Bookings</strong><small>{bookingCount} total</small></span>
        <ArrowRight />
      </button>
      {error && <InlineError message={error} />}
      <button className="secondary-button full sign-out-button" onClick={onSignOut} disabled={busy}>
        <LogOut /> {busy ? "Signing out" : "Sign out on this device"}
      </button>
    </div>
  );
}

function MemberPageHeading({
  eyebrow,
  title,
  action,
  onAction,
}: {
  eyebrow: string;
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <header className="member-page-heading">
      <div><span>{eyebrow}</span><h1>{title}</h1></div>
      {action && onAction && (
        <button onClick={onAction}><RefreshCw /> {action}</button>
      )}
    </header>
  );
}

function MemberEmptyState({
  title,
  text,
  action,
  onAction,
}: {
  title: string;
  text: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <section className="member-empty-state">
      <ListChecks />
      <h1>{title}</h1>
      <p>{text}</p>
      <button className="primary-button" onClick={onAction}>{action}</button>
    </section>
  );
}

function maskPhone(phone: string | null | undefined) {
  if (!phone) return "Verified phone";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return phone;
  return `••••••${digits.slice(-4)}`;
}

function formatProfileBirthDate(value: string | null | undefined) {
  if (!value) return "Not added";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <header className="section-title">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
    </header>
  );
}

function ServicePromise({
  fulfilment,
  compact = false,
}: {
  fulfilment: FulfilmentExpectation;
  compact?: boolean;
}) {
  return (
    <section className={`service-promise ${compact ? "compact" : ""}`}>
      <span className="promise-icon">
        <Clock3 />
      </span>
      <div>
        <small>Performance timeline</small>
        <strong>
          {fulfilment.title}
          <em>{fulfilment.dateLabel}</em>
        </strong>
        <p>{fulfilment.detail}</p>
      </div>
    </section>
  );
}

function UseCaseRow({
  item,
  onClick,
  active = false,
}: {
  item: RitualUseCase;
  onClick: () => void;
  active?: boolean;
}) {
  const Icon = iconFor(item.icon_name);

  return (
    <button className={`use-case-row ${active ? "active" : ""}`} onClick={onClick}>
      <span className="mini-icon">
        <Icon />
      </span>
      <span className="use-case-copy">
        <strong>
          {item.title}
          {item.is_popular && <em>Popular</em>}
        </strong>
        <small>{item.subtitle}</small>
      </span>
      <span className="row-price">{formatMoney(item.price_minor, item.currency)}</span>
      <ArrowRight />
    </button>
  );
}

function InfoTile({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <article className="info-tile">
      {icon}
      <strong>{title}</strong>
      <span>{text}</span>
    </article>
  );
}

function ReceiptRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={strong ? "strong" : ""}>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <div className="inline-error" role="alert">
      {message}
    </div>
  );
}

function BottomBar({
  label,
  value,
  action,
  onAction,
  disabled = false,
}: {
  label: string;
  value: string;
  action: string;
  onAction: () => void;
  disabled?: boolean;
}) {
  return (
    <footer className="bottom-bar">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <button className="primary-button" onClick={onAction} disabled={disabled}>
        {action} <ArrowRight />
      </button>
    </footer>
  );
}

function RitualArt() {
  return (
    <svg viewBox="0 0 240 120" aria-hidden="true" focusable="false">
      <circle cx="120" cy="78" r="58" />
      <circle cx="120" cy="78" r="34" />
      <path d="M31 98c25-30 48-45 69-45 18 0 31 9 39 26 12-24 31-34 56-29 14 3 27 11 40 24" />
      <path d="M120 18v18M84 29l10 16M156 29l-10 16M70 78h100" />
    </svg>
  );
}
