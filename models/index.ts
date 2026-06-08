import mongoose, { Schema, model, models, Types, type Model } from "mongoose";
import { Role, OfferType, LinkMode, ConversionSource } from "./enums";

export * from "./enums";

/* ─────────────── User ─────────────── */
export interface IUser {
  _id: Types.ObjectId;
  email: string;
  password: string;
  role: Role;
  name: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: Object.values(Role), default: Role.PUBLISHER },
    name: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

/* ─────────────── Publisher ─────────────── */
export interface IPublisher {
  _id: Types.ObjectId;
  name: string;
  userId: Types.ObjectId;
  createdAt: Date;
}

const PublisherSchema = new Schema<IPublisher>(
  {
    name: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

/* ─────────────── MediaSite ─────────────── */
export interface IMediaSite {
  _id: Types.ObjectId;
  name: string;
  url?: string;
  colorAccent: string;
  publisherId: Types.ObjectId;
  createdAt: Date;
}

const MediaSiteSchema = new Schema<IMediaSite>(
  {
    name: { type: String, required: true },
    url: { type: String },
    colorAccent: { type: String, required: true },
    publisherId: { type: Schema.Types.ObjectId, ref: "Publisher", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

/* ─────────────── Offer ─────────────── */
export interface IOffer {
  _id: Types.ObjectId;
  name: string;
  type: OfferType;
  payoutValue: number;
  payoutCurrency: string;
  appsflyerAppId: string;
  advertiserEmail?: string;
  isActive: boolean;
  createdAt: Date;
}

const OfferSchema = new Schema<IOffer>(
  {
    name: { type: String, required: true },
    type: { type: String, enum: Object.values(OfferType), required: true },
    payoutValue: { type: Number, required: true },
    payoutCurrency: { type: String, default: "USD" },
    appsflyerAppId: { type: String, required: true },
    advertiserEmail: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

/* ─────────────── OfferAssignment ─────────────── */
export interface IOfferAssignment {
  _id: Types.ObjectId;
  offerId: Types.ObjectId;
  publisherId: Types.ObjectId;
  assignedAt: Date;
}

const OfferAssignmentSchema = new Schema<IOfferAssignment>({
  offerId: { type: Schema.Types.ObjectId, ref: "Offer", required: true },
  publisherId: { type: Schema.Types.ObjectId, ref: "Publisher", required: true },
  assignedAt: { type: Date, default: Date.now },
});
OfferAssignmentSchema.index({ offerId: 1, publisherId: 1 }, { unique: true });

/* ─────────────── TrackingLink ─────────────── */
export interface ITrackingLink {
  _id: Types.ObjectId;
  offerId: Types.ObjectId;
  siteId: Types.ObjectId;
  linkMode: LinkMode;
  advertiserUrl: string;
  ourTrackingUrl?: string;
  utmSource?: string;
  utmMedium?: string;
  createdAt: Date;
}

const TrackingLinkSchema = new Schema<ITrackingLink>(
  {
    offerId: { type: Schema.Types.ObjectId, ref: "Offer", required: true },
    siteId: { type: Schema.Types.ObjectId, ref: "MediaSite", required: true },
    linkMode: { type: String, enum: Object.values(LinkMode), required: true },
    advertiserUrl: { type: String, required: true },
    ourTrackingUrl: { type: String },
    utmSource: { type: String },
    utmMedium: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

/* ─────────────── Click ─────────────── */
export interface IClick {
  _id: Types.ObjectId;
  trackingLinkId: Types.ObjectId;
  clickedAt: Date;
  ip?: string;
  userAgent?: string;
  country?: string;
}

const ClickSchema = new Schema<IClick>({
  trackingLinkId: { type: Schema.Types.ObjectId, ref: "TrackingLink", required: true },
  clickedAt: { type: Date, default: Date.now },
  ip: { type: String },
  userAgent: { type: String },
  country: { type: String },
});

/* ─────────────── Conversion ─────────────── */
export interface IConversion {
  _id: Types.ObjectId;
  offerId: Types.ObjectId;
  siteId?: Types.ObjectId | null;
  promoCode?: string;
  signups: number;
  depositors: number;
  traders: number;
  qualified: number;
  cpaPayout: number;
  totalCost: number;
  source: ConversionSource;
  periodStart?: Date;
  periodEnd?: Date;
  importedAt: Date;
  rawRow?: unknown;
}

const ConversionSchema = new Schema<IConversion>({
  offerId: { type: Schema.Types.ObjectId, ref: "Offer", required: true },
  siteId: { type: Schema.Types.ObjectId, ref: "MediaSite", default: null },
  promoCode: { type: String },
  signups: { type: Number, default: 0 },
  depositors: { type: Number, default: 0 },
  traders: { type: Number, default: 0 },
  qualified: { type: Number, default: 0 },
  cpaPayout: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 },
  source: { type: String, enum: Object.values(ConversionSource), required: true },
  periodStart: { type: Date },
  periodEnd: { type: Date },
  importedAt: { type: Date, default: Date.now },
  rawRow: { type: Schema.Types.Mixed },
});

/* ─────────────── AppsflyerSync ─────────────── */
export interface IAppsflyerSync {
  _id: Types.ObjectId;
  offerId: Types.ObjectId;
  reportDate: string;
  syncedAt: Date;
  status: string;
  recordCount: number;
  error?: string;
}

const AppsflyerSyncSchema = new Schema<IAppsflyerSync>({
  offerId: { type: Schema.Types.ObjectId, ref: "Offer", required: true },
  reportDate: { type: String },
  syncedAt: { type: Date, default: Date.now },
  status: { type: String, required: true },
  recordCount: { type: Number, default: 0 },
  error: { type: String },
});
AppsflyerSyncSchema.index({ offerId: 1, reportDate: 1 });

/* ─────────────── Model exports (HMR-safe, strongly typed) ─────────────── */
function getModel<T>(name: string, schema: Schema<T>): Model<T> {
  return (models[name] as Model<T>) || model<T>(name, schema);
}

export const User = getModel<IUser>("User", UserSchema);
export const Publisher = getModel<IPublisher>("Publisher", PublisherSchema);
export const MediaSite = getModel<IMediaSite>("MediaSite", MediaSiteSchema);
export const Offer = getModel<IOffer>("Offer", OfferSchema);
export const OfferAssignment = getModel<IOfferAssignment>("OfferAssignment", OfferAssignmentSchema);
export const TrackingLink = getModel<ITrackingLink>("TrackingLink", TrackingLinkSchema);
export const Click = getModel<IClick>("Click", ClickSchema);
export const Conversion = getModel<IConversion>("Conversion", ConversionSchema);
export const AppsflyerSync = getModel<IAppsflyerSync>("AppsflyerSync", AppsflyerSyncSchema);

export { mongoose };
