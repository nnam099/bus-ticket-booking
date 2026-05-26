export const formatTicketCode = (id) => (id ? `VE-${String(id).slice(0, 8).toUpperCase()}` : '—');

export const formatInvoiceCode = (id) => (id ? `HD-${String(id).slice(0, 8).toUpperCase()}` : '—');
