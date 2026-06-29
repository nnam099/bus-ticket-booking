const fs = require('fs');

const file = 'src/pages/customer/TicketDetailPage.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import { formatInvoiceCode, formatTicketCode } from '../../utils/codes';",
  "import { formatInvoiceCode, formatTicketCode } from '../../utils/codes';\nimport { Ticket, Star } from 'lucide-react';"
);

content = content.replace(
  "          <div className=\"mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm\">\r\n            🎫\r\n          </div>",
  "          <div className=\"mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-orange-600 shadow-sm\">\r\n            <Ticket className=\"w-6 h-6\" />\r\n          </div>"
);

content = content.replace(
  "                  <button\r\n                    key={n}\r\n                    onClick={() => setRating(n)}\r\n                    className={`text-2xl transition-transform hover:scale-110 ${n <= rating ? '' : 'opacity-30'}`}\r\n                  >\r\n                    ★\r\n                  </button>",
  "                  <button\r\n                    key={n}\r\n                    onClick={() => setRating(n)}\r\n                    className={`transition-transform hover:scale-110 ${n <= rating ? 'text-yellow-500' : 'text-gray-300'}`}\r\n                  >\r\n                    <Star className=\"w-6 h-6\" fill=\"currentColor\" />\r\n                  </button>"
);

fs.writeFileSync(file, content, 'utf8');
console.log('TicketDetailPage updated successfully!');
