"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import type { FormEvent } from "react";

type AccountMode = "signin" | "signup";

type StoredAccount = {
  email: string;
  salt: string;
  passwordHash: string;
};

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
  const [mode, setMode] = useState<AccountMode>("signup");
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
      const accounts = readAccounts();

      if (mode === "signup") {
        if (password !== confirmation) {
          setIsError(true);
          setMessage("Those passwords do not match.");
          return;
        }

        if (accounts.some((account) => account.email === email)) {
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

      <section className="account-layout" aria-label="Your account">
        <div className="account-panel">
          <div className="account-panel-inner">
            {signedInEmail ? (
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
            ) : (
              <>
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

                <p className="account-demo-note">
                  Prototype only: accounts are saved in this browser and are not connected to a secure service.
                </p>
              </>
            )}
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
    </main>
  );
}
