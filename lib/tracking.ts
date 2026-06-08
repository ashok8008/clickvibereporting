export function trackingBaseUrl(): string {
  return process.env.NEXT_PUBLIC_TRACKING_BASE_URL || "http://localhost:3000";
}

/** Build the public redirect URL for a CONVERTED tracking link. */
export function buildOurTrackingUrl(linkId: string): string {
  return `${trackingBaseUrl().replace(/\/$/, "")}/c/${linkId}`;
}

/**
 * The URL the publisher is allowed to see, based on link mode.
 * DIRECT → the advertiser URL. CONVERTED → our redirect URL only.
 */
export function publisherFacingUrl(link: {
  linkMode: string;
  advertiserUrl: string;
  ourTrackingUrl?: string | null;
  _id?: unknown;
}): string {
  if (link.linkMode === "CONVERTED") {
    return link.ourTrackingUrl || buildOurTrackingUrl(String(link._id));
  }
  return link.advertiserUrl;
}
