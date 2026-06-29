const fs = require('fs');

function replaceFile(path, replacements, importStatement) {
  let content = fs.readFileSync(path, 'utf8');
  
  if (importStatement) {
    if (content.includes("import { format } from 'date-fns';")) {
      content = content.replace("import { format } from 'date-fns';", "import { format } from 'date-fns';\n" + importStatement);
    } else if (content.includes("import { useState, useRef, useEffect } from 'react';")) {
      content = content.replace("import { useState, useRef, useEffect } from 'react';", "import { useState, useRef, useEffect } from 'react';\n" + importStatement);
    } else if (content.includes("import { Link } from 'react-router-dom';")) {
      content = content.replace("import { Link } from 'react-router-dom';", "import { Link } from 'react-router-dom';\n" + importStatement);
    } else {
        const lines = content.split('\n');
        lines.splice(1, 0, importStatement);
        content = lines.join('\n');
    }
  }

  for (const [from, to] of replacements) {
    content = content.split(from).join(to);
  }
  fs.writeFileSync(path, content, 'utf8');
  console.log('Updated ' + path);
}

// 1. PublicLayout.jsx
replaceFile('src/components/shared/PublicLayout.jsx', [
  ['Hành trình của bạn, sứ mệnh của chúng tôi 🚌', 'Hành trình của bạn, sứ mệnh của chúng tôi <Bus className="w-4 h-4 inline-block ml-1" />'],
  ['Hành trình của bạn, sứ mệnh của chúng tôi. Đặt vé xe khách an toàn và tiện lợi nhất Việt Nam 🚌', 'Hành trình của bạn, sứ mệnh của chúng tôi. Đặt vé xe khách an toàn và tiện lợi nhất Việt Nam <Bus className="w-4 h-4 inline-block ml-1" />']
], "import { Bus } from 'lucide-react';");

// 2. TestimonialsSection.jsx
replaceFile('src/pages/home/components/TestimonialsSection.jsx', [
  ['<div className="text-5xl mb-4">⭐</div>', '<Star className="w-12 h-12 text-yellow-400 mb-4 fill-current" />']
], "import { Star } from 'lucide-react';");

// 3. DestinationsGallery.jsx
replaceFile('src/pages/home/components/DestinationsGallery.jsx', [
  ['⭐ {dest.rating}', '<Star className="w-3.5 h-3.5 inline mr-1 text-yellow-400 fill-current" />{dest.rating}']
], "import { Star } from 'lucide-react';");

// 4. BookingTimer.jsx
replaceFile('src/components/customer/BookingTimer.jsx', [
  ['<span className="text-lg">⏱️</span>', '<Timer className="w-5 h-5" />'],
  ['⚠️ Sắp hết hạn!', '<AlertTriangle className="w-4 h-4 inline mr-1" />Sắp hết hạn!']
], "import { Timer, AlertTriangle } from 'lucide-react';");

console.log('Done!');
