const fs = require('fs');
let c = fs.readFileSync('src/pages/customer/TicketDetailPage.jsx', 'utf8');
c = c.replace(/import \{ formatInvoiceCode, formatTicketCode \} from '\.\.\/\.\.\/utils\/codes';/g, 'import { formatInvoiceCode, formatTicketCode } from \'../../utils/codes\';\nimport { Ticket, Star } from \'lucide-react\';');
c = c.replace(/<div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">\s*🎫\s*<\/div>/g, '<div className=\"mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-orange-600 shadow-sm\">\n            <Ticket className=\"w-6 h-6\" />\n          </div>');
c = c.replace(/className={`text-2xl transition-transform hover:scale-110 \$\{n <= rating \? '' : 'opacity-30'}`}\s*>\s*★/g, 'className={`transition-transform hover:scale-110 ${n <= rating ? \\'text-yellow-400\\' : \\'text-gray-300\\'}`}>\n                    <Star className=\"w-6 h-6\" fill=\"currentColor\" />');
fs.writeFileSync('src/pages/customer/TicketDetailPage.jsx', c);
