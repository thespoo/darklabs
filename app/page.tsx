// app/page.tsx
// A thin shell. Everything that matters happens in HomeExperience, on the
// client, over HTTP — the layout tree has to be visible in the network tab.

import { Suspense } from "react";
import { HomeExperience, Skeleton } from "@/components/HomeExperience";

export const metadata = { title: "Your mortgage · Unicorn" };

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-6 py-8">
          <Skeleton />
        </div>
      }
    >
      <HomeExperience />
    </Suspense>
  );
}
