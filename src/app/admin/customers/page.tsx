import { redirect } from "next/navigation";

import { routes } from "@/lib/routes";

/**
 * /admin/customers itself is a soft redirect — the page is split into
 * two sub-routes (/accounts and /guests), with the Accounts view as
 * the default landing because that's the more curated dataset.
 */
export default function CustomersIndexPage() {
  redirect(routes.admin.customersAccounts);
}
