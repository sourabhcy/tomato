"use client";

import { useEffect } from "react";

export default function NewRelicAgent() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const licenseKey = process.env.NEXT_PUBLIC_NEW_RELIC_LICENSE_KEY;
    const applicationID = process.env.NEXT_PUBLIC_NEW_RELIC_APPLICATION_ID;

    if (!licenseKey || !applicationID) return;

    void import("@newrelic/browser-agent/loaders/browser-agent").then(
      ({ BrowserAgent }) =>
        new BrowserAgent({
      info: {
        applicationID,
        beacon: "bam.nr-data.net",
        errorBeacon: "bam.nr-data.net",
        licenseKey,
        sa: 1,
      },
      init: {
        ajax: { deny_list: ["bam.nr-data.net"] },
        browser_consent_mode: { enabled: false },
        distributed_tracing: { enabled: true },
        performance: {
          capture_detail: false,
          capture_marks: false,
          capture_measures: true,
        },
        privacy: { cookies_enabled: true },
      },
      loader_config: {
        accountID: process.env.NEXT_PUBLIC_NEW_RELIC_ACCOUNT_ID,
        agentID: process.env.NEXT_PUBLIC_NEW_RELIC_AGENT_ID,
        licenseKey,
        applicationID,
        trustKey: process.env.NEXT_PUBLIC_NEW_RELIC_TRUST_KEY,
      },
        }),
    );
  }, []);

  return null;
}