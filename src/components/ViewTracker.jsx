"use client";

import { useEffect } from "react";

export default function ViewTracker({ scheduleId }) {
  useEffect(() => {
    if (!scheduleId) return;

    // We use a simple tracking logic. In a real app we might want to prevent duplicate tracking
    // within the same session, but for now every page load increments the view.
    const hasViewed = sessionStorage.getItem(`viewed_${scheduleId}`);
    if (hasViewed) return;

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:9090";
    fetch(`${apiBaseUrl}/api/schedules/${scheduleId}/view`, {
      method: "POST",
    })
      .then((res) => {
        if (res.ok) {
          sessionStorage.setItem(`viewed_${scheduleId}`, "true");
        }
      })
      .catch((err) => {
        console.error("Failed to track view:", err);
      });
  }, [scheduleId]);

  return null; // This component doesn't render anything
}

