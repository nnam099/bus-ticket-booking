const fallbackCode = (prefix, id) => (id ? `${prefix}-${String(id).slice(0, 8).toUpperCase()}` : '-');

export const formatTicketCode = (ticketOrId) => {
  if (ticketOrId && typeof ticketOrId === 'object') {
    return ticketOrId.publicCode || fallbackCode('VE', ticketOrId.id);
  }
  return fallbackCode('VE', ticketOrId);
};

export const formatInvoiceCode = (orderOrId) => {
  if (orderOrId && typeof orderOrId === 'object') {
    return orderOrId.publicCode || fallbackCode('HD', orderOrId.id);
  }
  return fallbackCode('HD', orderOrId);
};
