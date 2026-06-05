"use client";

import { http } from "@/lib/api/http";

export interface ContactSubmitPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
  /** Google reCAPTCHA v2 token. Required in production; the backend
   *  skips verification when RECAPTCHA_SECRET_KEY is empty (local dev). */
  recaptchaToken?: string | null;
}

export interface ApiContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  ip: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string | null;
}

export const contactApi = {
  /** Public — POST /api/contact. Returns the stored row on success. */
  submit(payload: ContactSubmitPayload): Promise<ApiContactMessage> {
    return http
      .post<{ data: ApiContactMessage }>(
        "/api/contact",
        {
          name: payload.name,
          email: payload.email,
          subject: payload.subject,
          message: payload.message,
          recaptcha_token: payload.recaptchaToken ?? null,
        },
        { auth: "none" },
      )
      .then((r) => r.data);
  },
};
