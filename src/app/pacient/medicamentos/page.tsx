"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import MedicamentosClient from "./MedicamentosClient";

export default function MedicamentosPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-linear-to-br from-blue-50 to-teal-100 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <MedicamentosClient />
    </Suspense>
  );
}
