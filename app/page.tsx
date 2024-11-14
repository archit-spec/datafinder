// 'use client';
// import EnhancedTable from '@/components/EnhancedTable';
// import { Toaster } from "@/components/ui/toaster";


// export default function Home() {
//   return (
//     <main className="flex min-h-screen flex-col items-center p-8 bg-gradient-to-b from-gray-50 to-gray-100">
//       <div className="w-full max-w-6xl space-y-8">
//         <EnhancedTable />
//       </div>
//       <Toaster />
//     </main>
//   );
// }

'use client';

import { Toaster } from "@/components/ui/toaster";
import PastelTable from '@/components/PastelTable';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-gradient-to-b from-white to-gray-50">
      <div className="w-full max-w-7xl">
        <PastelTable />
      </div>
      <Toaster />
    </main>
  );
}