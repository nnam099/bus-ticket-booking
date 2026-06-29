const fs = require('fs');

const file = 'src/pages/customer/MyTicketsPage.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import { formatInvoiceCode, formatTicketCode } from '../../utils/codes';",
  "import { formatInvoiceCode, formatTicketCode } from '../../utils/codes';\nimport { Ticket, Star } from 'lucide-react';"
);

content = content.replace(
  "<div className=\"mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-2xl\">🎫</div>",
  "<div className=\"mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400\"><Ticket className=\"w-6 h-6\" /></div>"
);

content = content.replace(
  "{canReview ? '⭐ Đánh giá' : canCancel ? '🎫 Hủy' : 'Xem vé'}",
  "{canReview ? <span className=\"flex items-center gap-1\"><Star className=\"w-4 h-4\" /> Đánh giá</span> : canCancel ? <span className=\"flex items-center gap-1\"><Ticket className=\"w-4 h-4\" /> Hủy</span> : 'Xem vé'}"
);

fs.writeFileSync(file, content, 'utf8');
console.log('MyTicketsPage updated successfully!');
