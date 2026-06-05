"use client";

import { http } from "@/lib/api/http";
import type { ApiContactMessage } from "@/lib/api/contact";

export type { ApiContactMessage };

interface ListResponse {
  data: ApiContactMessage[];
  meta: { unread: number };
}

/**
 * Admin CRUD for the /contact inbox. Public submit lives in
 * lib/api/contact.ts; this module is for /admin/customers/messages.
 */
export const contactMessagesApi = {
  list(): Promise<ListResponse> {
    return http.get<ListResponse>("/api/admin/contact-messages", {
      auth: "admin",
    });
  },
  setRead(id: number, isRead: boolean): Promise<ApiContactMessage> {
    return http
      .patch<{ data: ApiContactMessage }>(
        `/api/admin/contact-messages/${id}`,
        { isRead },
        { auth: "admin" },
      )
      .then((r) => r.data);
  },
  remove(id: number): Promise<void> {
    return http
      .delete(`/api/admin/contact-messages/${id}`, { auth: "admin" })
      .then(() => undefined);
  },
};
