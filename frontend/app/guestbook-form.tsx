"use client";

import { useActionState } from "react";
import { signGuestbook } from "./actions";

export function GuestbookForm() {
  const [state, formAction, pending] = useActionState(signGuestbook, null);

  return (
    <form action={formAction} className="form">
      <input name="name" placeholder="Your name" maxLength={40} required />
      <input name="message" placeholder="Say hello" maxLength={200} required />
      <button type="submit" disabled={pending}>
        {pending ? "Signing..." : "Sign"}
      </button>
      {state && <p className={state.ok ? "note ok" : "note error"}>{state.message}</p>}
    </form>
  );
}
