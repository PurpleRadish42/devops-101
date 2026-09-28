"use server";

import { revalidatePath } from "next/cache";
import { BACKEND_URL } from "@/lib/backend";

export type FormState = { ok: boolean; message: string } | null;

// Server Action: runs on the server when the guestbook form is submitted.
export async function signGuestbook(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  try {
    const res = await fetch(`${BACKEND_URL}/api/guestbook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, message }),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      return { ok: false, message: "Name must be 1-40 characters and message 1-200." };
    }
  } catch {
    return { ok: false, message: "Backend unreachable, please try again." };
  }

  revalidatePath("/"); // re-render the page so the new entry shows up
  return { ok: true, message: "Thanks for signing!" };
}
