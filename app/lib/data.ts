import postgres from 'postgres';
import {
  CustomerField,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
} from './definitions';
import { formatCurrency } from './utils';
import { unstable_noStore as noStore } from 'next/cache';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function fetchRevenue() {
  noStore();
  try {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const data = await sql<Revenue[]>`SELECT * FROM revenue`;
    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  noStore();
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const data = await sql<LatestInvoiceRaw[]>`
      SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      ORDER BY invoices.date DESC
      LIMIT 5`;

    const coolNames = ['Alex Rivera', 'Sophia Thorne', 'Marcus Chen', 'Elena Rodriguez', 'Jordan Vance'];
    const coolEmails = ['alex@rivera.com', 'sophia@thorne.io', 'marcus@dev.co', 'elena@studio.com', 'jordan@vance.net'];
    
    // LIST FOTO: Saya pastikan Elena Rodriguez (index 3) dapet foto michael-novotny 
    // karena file ini biasanya selalu ada dan terbaca.
    const localImages = [
      '/customers/amy-burns.png',      // Alex Rivera
      '/customers/balazs-orban.png',   // Sophia Thorne
      '/customers/evil-rabbit.png',    // Marcus Chen
      '/customers/michael-novotny.png', // Elena Rodriguez (FIX: Pasti Muncul)
      '/customers/lee-robinson.png'    // Jordan Vance
    ];

    const latestInvoices = data.map((invoice, index) => ({
      ...invoice,
      name: coolNames[index] || invoice.name,
      email: coolEmails[index] || invoice.email,
      // Jika index di luar list, default ke amy-burns agar tidak pecah
      image_url: localImages[index] || '/customers/amy-burns.png',
      amount: formatCurrency(invoice.amount + (index * 42000) + 15000), 
    }));

    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  noStore();
  try {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const invoiceCountPromise = sql`SELECT COUNT(*) FROM invoices`;
    const customerCountPromise = sql`SELECT COUNT(*) FROM customers`;
    const invoiceStatusPromise = sql`SELECT
         SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
         SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
         FROM invoices`;

    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);

    return {
      numberOfInvoices: Number(data[0][0].count ?? '0'),
      numberOfCustomers: Number(data[1][0].count ?? '0'),
      totalPaidInvoices: formatCurrency(data[2][0].paid ?? '0'),
      totalPendingInvoices: formatCurrency(data[2][0].pending ?? '0'),
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(query: string, currentPage: number) {
  noStore();
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  try {
    const invoices = await sql<InvoicesTable[]>`
      SELECT invoices.id, invoices.amount, invoices.date, invoices.status,
        customers.name, customers.email, customers.image_url
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE
        customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`} OR
        invoices.amount::text ILIKE ${`%${query}%`} OR
        invoices.date::text ILIKE ${`%${query}%`} OR
        invoices.status ILIKE ${`%${query}%`}
      ORDER BY invoices.date DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}`;
    return invoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string) {
  noStore();
  try {
    const data = await sql`SELECT COUNT(*) FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE
        customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`} OR
        invoices.amount::text ILIKE ${`%${query}%`} OR
        invoices.date::text ILIKE ${`%${query}%`} OR
        invoices.status ILIKE ${`%${query}%`}`;
    return Math.ceil(Number(data[0].count) / ITEMS_PER_PAGE);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  noStore();
  try {
    const data = await sql<InvoiceForm[]>`
      SELECT invoices.id, invoices.customer_id, invoices.amount, invoices.status
      FROM invoices WHERE invoices.id = ${id}`;
    return data.map((invoice) => ({ ...invoice, amount: invoice.amount / 100 }))[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  noStore();
  try {
    return await sql<CustomerField[]>`SELECT id, name FROM customers ORDER BY name ASC`;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}