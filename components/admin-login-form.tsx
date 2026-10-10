"use client";

import { FormEvent, useState } from "react";
import {
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { firebaseAuth } from "@/lib/firebase/client";

export function AdminLoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [needsName, setNeedsName] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function establishSession(user: User) {
    const idToken = await user.getIdToken(true);

    const response = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error ?? "Login failed.");
    }

    await signOut(firebaseAuth);

    router.replace("/admin");
    router.refresh();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (needsName) {
        if (!pendingUser) {
          throw new Error("Session expired. Please sign in again.");
        }

        const name = firstName.trim();

        if (!/^[\p{L}\p{M}' -]{1,50}$/u.test(name)) {
          throw new Error("Please enter a valid first name.");
        }

        await updateProfile(pendingUser, {
          displayName: name,
        });

        await establishSession(pendingUser);
        return;
      }

      const credentials = await signInWithEmailAndPassword(
        firebaseAuth,
        email,
        password
      );

      const user = credentials.user;

      if (!user.displayName?.trim()) {
        setPendingUser(user);
        setNeedsName(true);
        return;
      }

      await establishSession(user);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to sign in."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="studio-login__card" onSubmit={handleSubmit}>
      <div className="studio-login__heading">
        <span className="studio-login__eyebrow">
          PHOTOGRAPHER PORTAL
        </span>

        <h1>
          {needsName ? "One last thing." : "Welcome back."}
        </h1>

        <p>
          {needsName
            ? "What should we call you in your studio?"
            : "Sign in to manage your clients, galleries, and photography studio."}
        </p>
      </div>

      <div className="studio-login__fields">
        {needsName ? (
          <>
            <label htmlFor="admin-first-name">
              Your first name
            </label>
            <input
              id="admin-first-name"
              type="text"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="e.g. Kwasi"
              autoComplete="given-name"
              maxLength={50}
              required
            />
          </>
        ) : (
          <>
            <label htmlFor="admin-email">Email address</label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="username"
              required
            />

            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </>
        )}
      </div>

      {error && (
        <p className="studio-login__error" role="alert">
          {error}
        </p>
      )}

      <button
        className="studio-login__button"
        type="submit"
        disabled={submitting}
      >
        {submitting
          ? "Please wait…"
          : needsName
            ? "Continue to Studio →"
            : "Sign in to Studio →"}
      </button>

      <p className="studio-login__secure">
        🔒 Secure access for authorized photographers
      </p>
    </form>
  );
}