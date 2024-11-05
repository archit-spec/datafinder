'use client';

import { Toaster } from "@/components/ui/toaster";
import InteractiveTable from '@/components/InteractiveTable';

export default function Home() {
  return (
    <>
      <main className="flex min-h-screen flex-col items-center p-8 bg-gray-50">
        <div className="w-full max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">DuckDB Web Interface</h1>
            <p className="text-gray-600 mt-2">
              Query and analyze your data using natural language
            </p>
          </div>
          
          <InteractiveTable />
        </div>
      </main>
      <Toaster />
    </>
  );
}