import { CustomersTable } from "@/components/admin/CustomersTable";

/**
 * /admin/customers/accounts — registered customers. Includes
 * customers who have signed up but never placed an order yet.
 */
export default function CustomersAccountsPage() {
  return <CustomersTable kind="registered" />;
}
