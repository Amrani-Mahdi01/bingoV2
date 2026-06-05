import { CustomersTable } from "@/components/admin/CustomersTable";

/**
 * /admin/customers/guests — guest checkouts. Customers who placed
 * an order without creating an account.
 */
export default function CustomersGuestsPage() {
  return <CustomersTable kind="guest" />;
}
