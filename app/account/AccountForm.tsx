"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import type { FormEvent } from "react";
import {
  getServerServicesSnapshot,
  getServicesSnapshot,
  parseServices,
  saveServices,
  starterServices,
  subscribeToServices,
} from "../lib/services";
import type { Service } from "../lib/services";

type AccountMode = "signin" | "signup";

type StoredAccount = {
  email: string;
  salt: string;
  passwordHash: string;
};

const masterAccount = {
  email: "master@marynasalamatina.test",
  password: "SkinCare2026!",
};

const sampleAppointments = [
  { day: 0, time: "09:30", client: "Emma Wilson", service: "Skin consultation" },
  { day: 1, time: "11:00", client: "Sofia Martin", service: "Hydrating facial" },
  { day: 2, time: "14:30", client: "Olivia Chen", service: "Chemical peel" },
  { day: 3, time: "10:00", client: "Isabella Brown", service: "Follow-up visit" },
  { day: 4, time: "13:00", client: "Mia Taylor", service: "Sensitive skin facial" },
];

const accountsKey = "cosmetolog-demo-accounts";
const sessionKey = "cosmetolog-demo-session";

function subscribeToSession(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("cosmetolog-demo-session-change", callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("cosmetolog-demo-session-change", callback);
  };
}

function getSessionSnapshot() {
  return localStorage.getItem(sessionKey) ?? "";
}

function getServerSessionSnapshot() {
  return "";
}

function updateSession(email: string | null) {
  if (email) {
    localStorage.setItem(sessionKey, email);
  } else {
    localStorage.removeItem(sessionKey);
  }

  window.dispatchEvent(new Event("cosmetolog-demo-session-change"));
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(value: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(value.length / 2);

  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }

  return bytes;
}

function isStoredAccount(account: unknown): account is StoredAccount {
  return (
    typeof account === "object" &&
    account !== null &&
    "email" in account &&
    typeof account.email === "string" &&
    "salt" in account &&
    typeof account.salt === "string" &&
    "passwordHash" in account &&
    typeof account.passwordHash === "string"
  );
}

async function hashPassword(password: string, salt: Uint8Array<ArrayBuffer>) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const result = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 310_000, hash: "SHA-256" },
    key,
    256,
  );

  return bytesToHex(new Uint8Array(result));
}

function readAccounts(): StoredAccount[] {
  const storedValue = localStorage.getItem(accountsKey);

  if (!storedValue) {
    return [];
  }

  const parsedValue: unknown = JSON.parse(storedValue);
  if (!Array.isArray(parsedValue) || !parsedValue.every(isStoredAccount)) {
    throw new Error("Saved prototype accounts are invalid. Clear this site's local storage and try again.");
  }

  return parsedValue;
}

export default function AccountForm() {
  const [mode, setMode] = useState<AccountMode>("signin");
  const signedInEmail = useSyncExternalStore(subscribeToSession, getSessionSnapshot, getServerSessionSnapshot);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsError(false);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email")).trim().toLowerCase();
    const password = String(formData.get("password"));
    const confirmation = String(formData.get("confirmPassword") ?? "");

    try {
      if (mode === "signup") {
        const accounts = readAccounts();

        if (password !== confirmation) {
          setIsError(true);
          setMessage("Those passwords do not match.");
          return;
        }

        if (email === masterAccount.email || accounts.some((account) => account.email === email)) {
          setIsError(true);
          setMessage("An account with this email already exists. Sign in instead.");
          return;
        }

        const salt = crypto.getRandomValues(new Uint8Array(16));
        accounts.push({
          email,
          salt: bytesToHex(salt),
          passwordHash: await hashPassword(password, salt),
        });
        localStorage.setItem(accountsKey, JSON.stringify(accounts));
        updateSession(email);
        setMessage("Your account is ready. You are signed in.");
        return;
      }

      if (email === masterAccount.email && password === masterAccount.password) {
        updateSession(email);
        setMessage("You are signed in.");
        return;
      }

      const accounts = readAccounts();
      const account = accounts.find((savedAccount) => savedAccount.email === email);
      if (!account || (await hashPassword(password, hexToBytes(account.salt))) !== account.passwordHash) {
        setIsError(true);
        setMessage("The email or password is incorrect.");
        return;
      }

      updateSession(email);
      setMessage("You are signed in.");
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function changeMode(nextMode: AccountMode) {
    setMode(nextMode);
    setMessage("");
    setIsError(false);
  }

  function signOut() {
    updateSession(null);
    setMessage("You have been signed out.");
    setIsError(false);
  }

  return (
    <main className="account-page">
      <header className="account-header">
        <Link className="account-brand" href="/" aria-label="Maryna Salamatina Cosmetology home">
          Maryna Salamatina
        </Link>
        <Link className="account-back-link" href="/">
          Back to home
        </Link>
      </header>

      {signedInEmail === masterAccount.email ? (
        <MasterDashboard onSignOut={signOut} />
      ) : signedInEmail ? (
        <section className="account-layout" aria-label="Your account">
          <div className="account-panel">
            <div className="account-panel-inner">
              <div className="account-signed-in">
                <p className="account-eyebrow">Your account</p>
                <h1>You’re signed in.</h1>
                <p className="account-intro">Signed in as {signedInEmail}</p>
                {message && (
                  <p className="account-feedback" role="status">
                    {message}
                  </p>
                )}
                <button className="account-submit" type="button" onClick={signOut}>
                  Sign out
                </button>
              </div>
            </div>
          </div>
          <aside className="account-story">
            <Image
              className="account-story-image"
              src="/images/cosmetologist-hero.png"
              alt="A calm, welcoming cosmetology studio"
              fill
              priority
              sizes="(max-width: 760px) 100vw, 48vw"
            />
            <div className="account-story-copy">
              <p>Thoughtful care, at your pace.</p>
              <span>Personalized skincare with Maryna Salamatina</span>
            </div>
          </aside>
        </section>
      ) : (
        <section className="account-layout" aria-label="Your account">
          <div className="account-panel">
            <div className="account-panel-inner">
              <p className="account-eyebrow">A little care, just for you</p>
              <h1>{mode === "signup" ? "Create your account" : "Welcome back"}</h1>
              <p className="account-intro">
                {mode === "signup"
                  ? "Create an account to make your next visit feel even easier."
                  : "Sign in to continue to your account."}
              </p>

              <div className="account-tabs" role="tablist" aria-label="Account options">
                <button
                  className={mode === "signin" ? "account-tab is-active" : "account-tab"}
                  id="signin-tab"
                  type="button"
                  role="tab"
                  aria-selected={mode === "signin"}
                  aria-controls="account-form"
                  onClick={() => changeMode("signin")}
                >
                  Sign in
                </button>
                <button
                  className={mode === "signup" ? "account-tab is-active" : "account-tab"}
                  id="signup-tab"
                  type="button"
                  role="tab"
                  aria-selected={mode === "signup"}
                  aria-controls="account-form"
                  onClick={() => changeMode("signup")}
                >
                  Create account
                </button>
              </div>

              <form className="account-form" id="account-form" onSubmit={handleSubmit}>
                <label className="account-field">
                  Email address
                  <input
                    autoComplete="email"
                    autoFocus
                    name="email"
                    placeholder="you@example.com"
                    required
                    type="email"
                  />
                </label>
                <label className="account-field">
                  Password
                  <input
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    minLength={8}
                    name="password"
                    placeholder="At least 8 characters"
                    required
                    type={showPassword ? "text" : "password"}
                  />
                </label>
                {mode === "signup" && (
                  <label className="account-field">
                    Confirm password
                    <input
                      autoComplete="new-password"
                      minLength={8}
                      name="confirmPassword"
                      placeholder="Enter your password again"
                      required
                      type={showPassword ? "text" : "password"}
                    />
                  </label>
                )}
                <button
                  className="account-password-toggle"
                  type="button"
                  onClick={() => setShowPassword((isVisible) => !isVisible)}
                >
                  {showPassword ? "Hide password" : "Show password"}
                </button>
                {message && (
                  <p className={isError ? "account-feedback is-error" : "account-feedback"} role={isError ? "alert" : "status"}>
                    {message}
                  </p>
                )}
                <button className="account-submit" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
                </button>
              </form>

              {mode === "signin" && (
                <div className="account-test-credentials">
                  <p>Master testing account</p>
                  <span>Email: {masterAccount.email}</span>
                  <span>Password: {masterAccount.password}</span>
                </div>
              )}
              <p className="account-demo-note">
                Prototype only: accounts and the master schedule are demo data stored in this browser, not a secure service.
              </p>
            </div>
          </div>
          <aside className="account-story">
            <Image
              className="account-story-image"
              src="/images/cosmetologist-hero.png"
              alt="A calm, welcoming cosmetology studio"
              fill
              priority
              sizes="(max-width: 760px) 100vw, 48vw"
            />
            <div className="account-story-copy">
              <p>Thoughtful care, at your pace.</p>
              <span>Personalized skincare with Maryna Salamatina</span>
            </div>
          </aside>
        </section>
      )}
    </main>
  );
}

type MasterTab = "timetable" | "services";
type ServiceDraft = {
  name: string;
  description: string;
  cost: string;
  duration: string;
  notes: string;
};

const newServiceId = "__new_service__";

function MasterDashboard({ onSignOut }: { onSignOut: () => void }) {
  const [activeTab, setActiveTab] = useState<MasterTab>("timetable");

  return (
    <section className="master-dashboard" aria-label="Master account">
      <div className="master-dashboard-heading">
        <div>
          <p className="account-eyebrow">Master account</p>
          <h1>Welcome back</h1>
        </div>
        <button className="master-sign-out" type="button" onClick={onSignOut}>
          Sign out
        </button>
      </div>

      <div className="master-tabs" role="tablist" aria-label="Master account sections">
        <button
          id="timetable-tab"
          className={activeTab === "timetable" ? "master-tab is-active" : "master-tab"}
          type="button"
          role="tab"
          aria-selected={activeTab === "timetable"}
          aria-controls="master-tab-panel"
          onClick={() => setActiveTab("timetable")}
        >
          Timetable
        </button>
        <button
          id="services-tab"
          className={activeTab === "services" ? "master-tab is-active" : "master-tab"}
          type="button"
          role="tab"
          aria-selected={activeTab === "services"}
          aria-controls="master-tab-panel"
          onClick={() => setActiveTab("services")}
        >
          Services
        </button>
      </div>

      <div
        className="master-tab-panel"
        id="master-tab-panel"
        role="tabpanel"
        aria-labelledby={activeTab === "timetable" ? "timetable-tab" : "services-tab"}
      >
        {activeTab === "timetable" ? <MasterScheduleView /> : <MasterServiceSettings />}
      </div>
    </section>
  );
}

function MasterScheduleView() {
  const today = new Date();
  const monday = new Date(today);
  const dayOfWeek = (today.getDay() + 6) % 7;
  monday.setDate(today.getDate() - dayOfWeek);
  monday.setHours(0, 0, 0, 0);

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });

  const formatDate = (date: Date, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en", options).format(date);

  return (
    <section className="master-schedule-view" aria-label="Weekly timetable">
      <div className="master-schedule-heading">
        <div>
          <h2>Your weekly schedule</h2>
          <p className="master-week-range">
            {formatDate(days[0], { month: "long", day: "numeric" })} – {formatDate(days[6], { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </div>
      <div className="master-schedule-summary" aria-label="Schedule summary">
        <div>
          <strong>{sampleAppointments.length}</strong>
          <span>appointments this week</span>
        </div>
        <div>
          <strong>{new Set(sampleAppointments.map((appointment) => appointment.day)).size}</strong>
          <span>working days</span>
        </div>
      </div>

      <div className="master-week-scroll">
        <div className="master-week-grid">
          {days.map((date, index) => {
            const appointments = sampleAppointments.filter((appointment) => appointment.day === index);
            const isToday = date.toDateString() === today.toDateString();

            return (
              <section className={isToday ? "master-day is-today" : "master-day"} key={date.toISOString()}>
                <header className="master-day-heading">
                  <span>{formatDate(date, { weekday: "short" })}</span>
                  <strong>{formatDate(date, { day: "numeric" })}</strong>
                </header>
                <div className="master-day-appointments">
                  {appointments.length ? (
                    appointments.map((appointment) => (
                      <article className="master-appointment" key={`${appointment.time}-${appointment.client}`}>
                        <time>{appointment.time}</time>
                        <strong>{appointment.client}</strong>
                        <span>{appointment.service}</span>
                      </article>
                    ))
                  ) : (
                    <p className="master-day-empty">No appointments</p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
      <p className="master-schedule-note">Sample appointments for testing. Your real schedule will appear here when booking is connected.</p>
    </section>
  );
}

function MasterServiceSettings() {
  const serviceSnapshot = useSyncExternalStore(
    subscribeToServices,
    getServicesSnapshot,
    getServerServicesSnapshot,
  );
  const { services, error: dataError } = parseServices(serviceSnapshot);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ServiceDraft | null>(null);
  const [saveError, setSaveError] = useState("");

  const selectedService = services.find((service) => service.id === selectedServiceId);

  function selectService(serviceId: string) {
    setSelectedServiceId((currentId) => (currentId === serviceId ? null : serviceId));
    setEditingServiceId(null);
    setDraft(null);
    setSaveError("");
  }

  function startEditing(service: Service) {
    setSelectedServiceId(service.id);
    setEditingServiceId(service.id);
    setDraft({
      name: service.name,
      description: service.description,
      cost: String(service.cost),
      duration: String(service.duration),
      notes: service.notes,
    });
    setSaveError("");
  }

  function startAddingService() {
    setSelectedServiceId(null);
    setEditingServiceId(newServiceId);
    setDraft({ name: "", description: "", cost: "", duration: "", notes: "" });
    setSaveError("");
  }

  function updateDraft<K extends keyof ServiceDraft>(field: K, value: ServiceDraft[K]) {
    setDraft((currentDraft) => (currentDraft ? { ...currentDraft, [field]: value } : currentDraft));
  }

  function handleSaveService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || !editingServiceId) {
      return;
    }

    const name = draft.name.trim();
    const description = draft.description.trim();
    const cost = Number(draft.cost);
    const duration = Number(draft.duration);

    if (!name || !description) {
      setSaveError("Enter a service name and description.");
      return;
    }
    if (!Number.isFinite(cost) || cost < 0 || !Number.isInteger(duration) || duration < 1) {
      setSaveError("Enter a valid cost and a duration of at least one minute.");
      return;
    }

    const previousService = services.find((service) => service.id === editingServiceId);
    if (editingServiceId !== newServiceId && !previousService) {
      setSaveError("This service is no longer available. Select it again and retry.");
      return;
    }

    const id = editingServiceId === newServiceId ? crypto.randomUUID() : editingServiceId;
    const updatedService: Service = {
      id,
      name,
      description,
      cost,
      duration,
      notes: draft.notes.trim(),
      isVisible: previousService?.isVisible ?? false,
      isSample: false,
    };
    const updatedServices =
      editingServiceId === newServiceId
        ? [...services, updatedService]
        : services.map((service) => (service.id === editingServiceId ? updatedService : service));

    try {
      saveServices(updatedServices);
      setSelectedServiceId(id);
      setEditingServiceId(null);
      setDraft(null);
      setSaveError("");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "The service could not be saved.");
    }
  }

  function toggleVisibility(service: Service) {
    if (service.isSample) {
      setSaveError("Edit and save this sample service before publishing it.");
      return;
    }

    const updatedServices = services.map((item) =>
      item.id === service.id ? { ...item, isVisible: !item.isVisible } : item,
    );

    try {
      saveServices(updatedServices);
      setSaveError("");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Visibility could not be updated.");
    }
  }

  function resetSampleServices() {
    try {
      saveServices(starterServices);
      setSelectedServiceId(null);
      setEditingServiceId(null);
      setDraft(null);
      setSaveError("");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "The sample services could not be restored.");
    }
  }

  return (
    <section className="master-services-settings" aria-label="Service settings">
      <div className="master-schedule-heading">
        <div>
          <h2>Service list settings</h2>
          <p className="master-week-range">Manage your services and choose which ones appear on your website.</p>
        </div>
      </div>

      {(dataError || saveError) && (
        <p className="master-service-error" role="alert">
          {saveError || dataError}
        </p>
      )}
      {dataError && (
        <button className="master-add-service" type="button" onClick={resetSampleServices}>
          Restore sample services
        </button>
      )}

      <div className="master-services-layout">
        <div className="master-services-list">
          <h3>Your services</h3>
          {services.length ? (
            <div className="master-service-dropdowns">
              {services.map((service) => (
                <button
                  className={selectedServiceId === service.id ? "master-service-dropdown is-selected" : "master-service-dropdown"}
                  type="button"
                  key={service.id}
                  aria-expanded={selectedServiceId === service.id}
                  onClick={() => selectService(service.id)}
                >
                  <span>{service.name}</span>
                  {service.isSample && <span className="master-service-sample-tag">Sample</span>}
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="m7 10 5 5 5-5" />
                  </svg>
                </button>
              ))}
            </div>
          ) : (
            <p className="master-service-empty">No services yet. Add your first service below.</p>
          )}
          <button
            className="master-add-service"
            type="button"
            onClick={startAddingService}
            disabled={Boolean(editingServiceId)}
          >
            + Add a service
          </button>
        </div>

        <div className="master-service-overview">
          {editingServiceId && draft ? (
            <form className="master-service-form" onSubmit={handleSaveService}>
              <h3>{editingServiceId === newServiceId ? "Add a service" : "Edit service"}</h3>
              <label className="master-service-field" htmlFor="service-name">
                Service name
                <input
                  id="service-name"
                  name="name"
                  required
                  value={draft.name}
                  onChange={(event) => updateDraft("name", event.currentTarget.value)}
                />
              </label>
              <label className="master-service-field" htmlFor="service-description">
                Description
                <textarea
                  id="service-description"
                  name="description"
                  required
                  rows={4}
                  value={draft.description}
                  onChange={(event) => updateDraft("description", event.currentTarget.value)}
                />
              </label>
              <div className="master-service-form-row">
                <label className="master-service-field" htmlFor="service-cost">
                  Cost (CZK)
                  <input
                    id="service-cost"
                    name="cost"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={draft.cost}
                    onChange={(event) => updateDraft("cost", event.currentTarget.value)}
                  />
                </label>
                <label className="master-service-field" htmlFor="service-duration">
                  Duration (minutes)
                  <input
                    id="service-duration"
                    name="duration"
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={draft.duration}
                    onChange={(event) => updateDraft("duration", event.currentTarget.value)}
                  />
                </label>
              </div>
              <label className="master-service-field" htmlFor="service-notes">
                Specific notes (master only)
                <textarea
                  id="service-notes"
                  name="notes"
                  rows={3}
                  value={draft.notes}
                  onChange={(event) => updateDraft("notes", event.currentTarget.value)}
                />
              </label>
              <div className="master-service-form-actions">
                <button className="master-service-save" type="submit">
                  Save service
                </button>
                <button
                  className="master-service-cancel"
                  type="button"
                  onClick={() => {
                    setEditingServiceId(null);
                    setDraft(null);
                    setSaveError("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : selectedService ? (
            <article className="master-service-detail">
              <div className="master-service-detail-heading">
                <div>
                  <p className="account-eyebrow">Service overview</p>
                  <h3>{selectedService.name}</h3>
                </div>
                <div className="master-service-actions">
                  <button
                    className={selectedService.isVisible ? "master-service-visibility is-visible" : "master-service-visibility"}
                    type="button"
                    aria-label={
                      selectedService.isSample
                        ? `Edit sample service ${selectedService.name} before publishing`
                        : selectedService.isVisible
                          ? `Hide ${selectedService.name} from the website`
                          : `Show ${selectedService.name} on the website`
                    }
                    aria-pressed={selectedService.isVisible}
                    title={
                      selectedService.isSample
                        ? "Edit and save this sample service before publishing"
                        : selectedService.isVisible
                          ? "Visible on the website"
                          : "Hidden from the website"
                    }
                    disabled={selectedService.isSample}
                    onClick={() => toggleVisibility(selectedService)}
                  >
                    <EyeIcon />
                  </button>
                  <button
                    className="master-service-edit"
                    type="button"
                    aria-label={`Edit ${selectedService.name}`}
                    onClick={() => startEditing(selectedService)}
                  >
                    <EditIcon />
                  </button>
                </div>
              </div>
              {selectedService.isSample && (
                <p className="master-service-sample-warning">
                  This is example content. Edit and save the details before publishing it.
                </p>
              )}
              <p className="master-service-description">{selectedService.description}</p>
              <dl className="master-service-meta">
                <div>
                  <dt>Cost</dt>
                  <dd>{formatServiceCost(selectedService.cost)}</dd>
                </div>
                <div>
                  <dt>Duration</dt>
                  <dd>{selectedService.duration} minutes</dd>
                </div>
              </dl>
              <div className="master-service-notes">
                <h4>Specific notes</h4>
                <p>{selectedService.notes || "No notes added."}</p>
              </div>
              <p className="master-service-visibility-status">
                {selectedService.isVisible ? "Visible on the public website" : "Hidden from the public website"}
              </p>
            </article>
          ) : (
            <p className="master-service-placeholder">
              {editingServiceId === newServiceId ? "Add your service details." : "Choose a service to see its details."}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function formatServiceCost(cost: number) {
  return cost === 0 ? "Free" : `${cost.toLocaleString("en")} CZK`;
}

function EyeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M2.5 12s3.2-6 9.5-6 9.5 6 9.5 6-3.2 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m14 5 5 5M4 20l4.2-.8L20 7.4 16.6 4 4.8 15.8 4 20Z" />
    </svg>
  );
}
