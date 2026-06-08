export const Role = {
  ADMIN: "ADMIN",
  PUBLISHER: "PUBLISHER",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const OfferType = {
  CPA: "CPA",
  CPI: "CPI",
  CPL: "CPL",
  REVSHARE: "REVSHARE",
} as const;
export type OfferType = (typeof OfferType)[keyof typeof OfferType];

export const LinkMode = {
  DIRECT: "DIRECT",
  CONVERTED: "CONVERTED",
} as const;
export type LinkMode = (typeof LinkMode)[keyof typeof LinkMode];

export const ConversionSource = {
  APPSFLYER: "APPSFLYER",
  CSV_UPLOAD: "CSV_UPLOAD",
} as const;
export type ConversionSource = (typeof ConversionSource)[keyof typeof ConversionSource];
