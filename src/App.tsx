import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Baby,
  BriefcaseBusiness,
  CalendarDays,
  Car,
  Check,
  CreditCard,
  DoorOpen,
  EyeOff,
  Flame,
  Heart,
  House,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Pencil,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TrendingDown,
  Video,
  type LucideIcon,
} from "lucide-react";
import { createAndPayBooking, loadAppData, requestOtp, verifyOtp } from "./lib/api";
import { formatDate, formatMoney, formatTime, readableStatus } from "./lib/format";
import type {
  AppData,
  Booking,
  HomeBanner,
  OtpChallenge,
  Ritual,
  RitualUseCase,
  Screen,
  TimeSlot,
  VerifiedLead,
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

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [data, setData] = useState<AppData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUseCaseId, setSelectedUseCaseId] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const [lead, setLead] = useState<VerifiedLead | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    loadAppData()
      .then((nextData) => {
        if (!active) return;
        setData(nextData);
        setSelectedUseCaseId(nextData.useCases[0]?.id ?? null);
        setSelectedSlotId(nextData.slots[0]?.id ?? null);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : "Could not load Sankalp");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const selectedUseCase = useMemo(
    () => data.useCases.find((item) => item.id === selectedUseCaseId) ?? data.useCases[0] ?? null,
    [data.useCases, selectedUseCaseId],
  );

  const selectedRitual = useMemo(
    () =>
      selectedUseCase
        ? (data.rituals.find((item) => item.id === selectedUseCase.ritual_id) ??
          data.rituals[0] ??
          null)
        : (data.rituals[0] ?? null),
    [data.rituals, selectedUseCase],
  );

  const ritualSlots = useMemo(() => {
    const matching = data.slots.filter(
      (slot) => slot.ritual_id === selectedRitual?.id || slot.ritual_id === null,
    );
    return matching.length ? matching : data.slots;
  }, [data.slots, selectedRitual?.id]);

  const selectedSlot = useMemo(
    () =>
      ritualSlots.find((slot) => slot.id === selectedSlotId) ??
      ritualSlots[0] ??
      data.slots[0] ??
      null,
    [data.slots, ritualSlots, selectedSlotId],
  );

  const groupedUseCases = useMemo(
    () =>
      data.useCases.reduce<Record<string, RitualUseCase[]>>((groups, item) => {
        groups[item.group_label] = [...(groups[item.group_label] ?? []), item];
        return groups;
      }, {}),
    [data.useCases],
  );

  function goTo(nextScreen: Screen) {
    setError(null);
    setScreen(nextScreen);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }

  function selectUseCase(item: RitualUseCase) {
    setSelectedUseCaseId(item.id);
    const firstSlot = data.slots.find((slot) => slot.ritual_id === item.ritual_id);
    setSelectedSlotId(firstSlot?.id ?? data.slots[0]?.id ?? null);
    setLead(null);
    setBooking(null);
    goTo("ritual");
  }

  function selectBanner(banner: HomeBanner) {
    const useCase =
      data.useCases.find((item) => item.ritual_id === banner.ritual_id && item.is_popular) ??
      data.useCases.find((item) => item.ritual_id === banner.ritual_id) ??
      data.useCases[0];
    if (useCase) selectUseCase(useCase);
  }

  async function sendOtp() {
    setBusy(true);
    setError(null);
    try {
      const nextChallenge = await requestOtp(phone);
      if (!nextChallenge) throw new Error("The OTP could not be sent.");
      setChallenge(nextChallenge);
      setOtp("");
      setScreen("otp");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The OTP could not be sent.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmOtp() {
    if (!challenge) return;
    setBusy(true);
    setError(null);
    try {
      const verifiedLead = await verifyOtp(challenge.challenge_id, phone, otp, name);
      if (!verifiedLead) throw new Error("The OTP could not be verified.");
      setLead(verifiedLead);
      setScreen("payment");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The OTP could not be verified.");
    } finally {
      setBusy(false);
    }
  }

  async function pay() {
    if (!lead || !selectedRitual || !selectedUseCase || !selectedSlot) return;
    setBusy(true);
    setError(null);
    try {
      const confirmedBooking = await createAndPayBooking({
        leadId: lead.lead_id,
        ritualId: selectedRitual.id,
        useCaseId: selectedUseCase.id,
        slotId: selectedSlot.id,
        customerName: name,
        intentNote: selectedUseCase.title,
      });
      if (!confirmedBooking) throw new Error("The booking could not be retrieved.");
      setBooking(confirmedBooking);
      setScreen("confirm");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The payment could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  const phoneIsValid = phone.replace(/\D/g, "").length >= 10 && name.trim().length > 1;
  const otpIsValid = otp.trim().length >= 4;

  return (
    <main className="page">
      <section className="mweb-shell">
        <SiteHeader
          onHome={() => goTo("home")}
          onTrack={() => booking && goTo("status")}
          canTrack={Boolean(booking)}
        />

        {screen !== "home" && (
          <CheckoutNavigation
            screen={screen}
            title={screenTitle(screen)}
            onBack={() => goTo(previousScreen(screen))}
            muted={screen === "confirm" || screen === "status"}
          />
        )}

        {loading && <LoadingState />}

        {!loading && screen === "home" && (
          <HomeView
            data={data}
            groupedUseCases={groupedUseCases}
            error={error}
            onBanner={selectBanner}
            onUseCase={selectUseCase}
            onPrimary={() => data.useCases[0] && selectUseCase(data.useCases[0])}
          />
        )}

        {!loading && screen === "ritual" && selectedRitual && selectedUseCase && (
          <RitualView
            ritual={selectedRitual}
            selectedUseCase={selectedUseCase}
            relatedUseCases={data.useCases.filter(
              (item) => item.ritual_id === selectedRitual.id,
            )}
            onUseCase={selectUseCase}
            onContinue={() => goTo("time")}
          />
        )}

        {!loading && screen === "time" && selectedRitual && selectedUseCase && (
          <TimeView
            ritual={selectedRitual}
            useCase={selectedUseCase}
            slots={ritualSlots}
            selectedSlotId={selectedSlot?.id ?? null}
            onSlot={setSelectedSlotId}
            onContinue={() => selectedSlot && goTo("phone")}
          />
        )}

        {!loading && screen === "phone" && selectedUseCase && selectedSlot && (
          <PhoneView
            phone={phone}
            name={name}
            error={error}
            busy={busy}
            useCase={selectedUseCase}
            slot={selectedSlot}
            onName={setName}
            onPhone={setPhone}
            onContinue={sendOtp}
            canContinue={phoneIsValid}
          />
        )}

        {!loading && screen === "otp" && challenge && (
          <OtpView
            challenge={challenge}
            otp={otp}
            busy={busy}
            error={error}
            onOtp={(value) => setOtp(value.replace(/\D/g, ""))}
            onVerify={confirmOtp}
            canVerify={otpIsValid}
          />
        )}

        {!loading &&
          screen === "payment" &&
          selectedRitual &&
          selectedUseCase &&
          selectedSlot && (
            <PaymentView
              ritual={selectedRitual}
              useCase={selectedUseCase}
              slot={selectedSlot}
              busy={busy}
              error={error}
              onPay={pay}
            />
          )}

        {!loading && screen === "confirm" && booking && (
          <ConfirmationView
            booking={booking}
            onStatus={() => goTo("status")}
            onHome={() => goTo("home")}
          />
        )}

        {!loading && screen === "status" && booking && (
          <StatusView booking={booking} onHome={() => goTo("home")} />
        )}
      </section>
    </main>
  );
}

function screenTitle(screen: Screen) {
  return {
    home: "Sankalp",
    ritual: "Ritual details",
    time: "Choose time",
    phone: "Verify phone",
    otp: "Enter OTP",
    payment: "Payment",
    confirm: "Confirmed",
    status: "Booking status",
  }[screen];
}

function previousScreen(screen: Screen): Screen {
  return {
    home: "home",
    ritual: "home",
    time: "ritual",
    phone: "time",
    otp: "phone",
    payment: "otp",
    confirm: "home",
    status: "confirm",
  }[screen] as Screen;
}

function SiteHeader({
  onHome,
  onTrack,
  canTrack,
}: {
  onHome: () => void;
  onTrack: () => void;
  canTrack: boolean;
}) {
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
          {canTrack && (
            <button className="track-button" onClick={onTrack}>
              Track booking
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
    time: 2,
    phone: 3,
    otp: 3,
    payment: 4,
    confirm: 4,
    status: 4,
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
          <span>{complete ? "Booking complete" : `Step ${currentStep} of 4`}</span>
          <strong>{title}</strong>
        </div>
        <span className="step-count">{complete ? "Done" : `${currentStep}/4`}</span>
      </div>
      <div className="progress-track" aria-hidden="true">
        {[1, 2, 3, 4].map((step) => (
          <i className={step <= currentStep ? "active" : ""} key={step} />
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
  groupedUseCases,
  error,
  onBanner,
  onUseCase,
  onPrimary,
}: {
  data: AppData;
  groupedUseCases: Record<string, RitualUseCase[]>;
  error: string | null;
  onBanner: (banner: HomeBanner) => void;
  onUseCase: (item: RitualUseCase) => void;
  onPrimary: () => void;
}) {
  const firstGroup = Object.entries(groupedUseCases)[0];

  return (
    <div className="home-page">
      <section className="greeting">
        <div className="hero-layout">
          <div className="hero-message">
            <span>Trusted ritual booking</span>
            <h1>Choose the moment. We handle the ritual.</h1>
            <p>
              Book a verified pandit for life&rsquo;s important moments, choose an auspicious time,
              and track every step online.
            </p>
            <div className="hero-actions">
              <button className="primary-button" onClick={onPrimary} disabled={!data.useCases.length}>
                Find your ritual <ArrowRight />
              </button>
              <small>No calls or account setup required</small>
            </div>
            <div className="hero-assurances" aria-label="Service assurances">
              <span>
                <ShieldCheck /> Verified pandits
              </span>
              <span>
                <CalendarDays /> Clear muhurat slots
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
              <li>Choose a ritual and suitable muhurat.</li>
              <li>Verify your phone and confirm the booking.</li>
              <li>Track pandit assignment and completion.</li>
            </ol>
          </section>

          <div className="faq-block">
            <SectionTitle eyebrow="Questions" title="Before you book" />
            <section className="faq-list">
              {data.faqs.map((faq) => (
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
  onUseCase,
  onContinue,
}: {
  ritual: Ritual;
  selectedUseCase: RitualUseCase;
  relatedUseCases: RitualUseCase[];
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

        <SectionTitle eyebrow="Includes" title="Built for low-friction booking" />
        <section className="info-grid">
          <InfoTile icon={<ShieldCheck />} title="Verified pandit" text="Manually assigned for quality." />
          <InfoTile icon={<Sparkles />} title="Status tracking" text="Follow every booking step." />
          <InfoTile icon={<Smartphone />} title="Phone verified" text="Dummy OTP now, SMS later." />
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
        label="Starts at"
        value={formatMoney(selectedUseCase.price_minor, selectedUseCase.currency)}
        action="Choose time"
        onAction={onContinue}
      />
    </>
  );
}

function TimeView({
  ritual,
  useCase,
  slots,
  selectedSlotId,
  onSlot,
  onContinue,
}: {
  ritual: Ritual;
  useCase: RitualUseCase;
  slots: TimeSlot[];
  selectedSlotId: string | null;
  onSlot: (id: string) => void;
  onContinue: () => void;
}) {
  return (
    <>
      <div className="scroll-area with-bar">
        <section className="time-summary">
          <span>{ritual.title}</span>
          <h1>{useCase.title}</h1>
          <p>Choose a slot. The backend reserves capacity after your phone is verified.</p>
        </section>

        <section className="slot-list">
          {slots.length === 0 && (
            <InlineError message="No upcoming slots are available for this ritual yet." />
          )}
          {slots.map((slot) => (
            <button
              className={`slot-card ${slot.id === selectedSlotId ? "active" : ""}`}
              onClick={() => onSlot(slot.id)}
              key={slot.id}
            >
              <CalendarDays />
              <div>
                <strong>{formatDate(slot.slot_date)}</strong>
                <span>{slot.label ?? "Open slot"}</span>
              </div>
              <em>{formatTime(slot.slot_time)}</em>
              {slot.is_auspicious && <small>Auspicious</small>}
            </button>
          ))}
        </section>
      </div>

      <BottomBar
        label="For"
        value={formatMoney(useCase.price_minor, useCase.currency)}
        action="Verify phone"
        onAction={onContinue}
        disabled={!selectedSlotId}
      />
    </>
  );
}

function PhoneView({
  phone,
  name,
  error,
  busy,
  useCase,
  slot,
  onName,
  onPhone,
  onContinue,
  canContinue,
}: {
  phone: string;
  name: string;
  error: string | null;
  busy: boolean;
  useCase: RitualUseCase;
  slot: TimeSlot;
  onName: (value: string) => void;
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
          Booking {useCase.title} for {formatDate(slot.slot_date)} at {formatTime(slot.slot_time)}.
        </p>
        <label>
          Name
          <input
            value={name}
            onChange={(event) => onName(event.target.value)}
            placeholder="Your name"
            autoComplete="name"
          />
        </label>
        <label>
          Mobile number
          <input
            value={phone}
            onChange={(event) => onPhone(event.target.value)}
            inputMode="tel"
            placeholder="98765 43210"
            autoComplete="tel"
          />
        </label>
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

function OtpView({
  challenge,
  otp,
  busy,
  error,
  onOtp,
  onVerify,
  canVerify,
}: {
  challenge: OtpChallenge;
  otp: string;
  busy: boolean;
  error: string | null;
  onOtp: (value: string) => void;
  onVerify: () => void;
  canVerify: boolean;
}) {
  return (
    <div className="form-screen">
      <section className="form-card">
        <span>OTP sent</span>
        <h1>Enter the verification code</h1>
        <p>
          Development OTP for {challenge.phone}: <strong>{challenge.dev_otp}</strong>
        </p>
        <label>
          OTP
          <input
            value={otp}
            onChange={(event) => onOtp(event.target.value)}
            inputMode="numeric"
            maxLength={6}
            placeholder="1234"
            autoComplete="one-time-code"
          />
        </label>
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
  slot,
  busy,
  error,
  onPay,
}: {
  ritual: Ritual;
  useCase: RitualUseCase;
  slot: TimeSlot;
  busy: boolean;
  error: string | null;
  onPay: () => void;
}) {
  return (
    <>
      <div className="scroll-area with-bar">
        <section className="payment-card">
          <CreditCard />
          <span>Secure checkout</span>
          <h1>{formatMoney(useCase.price_minor, useCase.currency)}</h1>
          <p>Mock payment for Phase 1. A live payment provider can replace it later.</p>
        </section>
        <section className="receipt">
          <ReceiptRow label="Ritual" value={ritual.title} />
          <ReceiptRow label="Intent" value={useCase.title} />
          <ReceiptRow label="Date" value={formatDate(slot.slot_date)} />
          <ReceiptRow label="Time" value={formatTime(slot.slot_time)} />
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
        action={busy ? "Processing" : "Mock pay"}
        onAction={onPay}
        disabled={busy}
      />
    </>
  );
}

function ConfirmationView({
  booking,
  onStatus,
  onHome,
}: {
  booking: Booking;
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
      <section className="receipt">
        <ReceiptRow label="Intent" value={booking.use_case_title ?? "Sankalp"} />
        <ReceiptRow label="Date" value={formatDate(booking.preferred_date)} />
        <ReceiptRow label="Time" value={formatTime(booking.preferred_time)} />
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

function StatusView({ booking, onHome }: { booking: Booking; onHome: () => void }) {
  const stages = [
    "pending_payment",
    "pending_assignment",
    "pandit_assigned",
    "ritual_scheduled",
    "completed",
  ];
  const currentStage = Math.max(stages.indexOf(booking.status), 1);

  return (
    <div className="scroll-area status-view">
      <section className="status-card">
        <span>{booking.booking_number}</span>
        <h1>{booking.ritual_title}</h1>
        <p>Current status: {readableStatus(booking.status)}</p>
      </section>
      <section className="timeline">
        {stages.map((stage, index) => (
          <div className={index <= currentStage ? "done" : ""} key={stage}>
            <i>{index <= currentStage ? <Check /> : index + 1}</i>
            <span>{readableStatus(stage)}</span>
          </div>
        ))}
      </section>
      <button className="primary-button full" onClick={onHome}>
        Back home
      </button>
    </div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <header className="section-title">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
    </header>
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
