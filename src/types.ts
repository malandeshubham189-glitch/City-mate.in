export type UserRole = "user" | "owner" | "admin";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  cityPreference?: string;
  createdAt: string;
  photoURL?: string;
  kycStatus?: "none" | "pending" | "verified" | "rejected";
  kycDocumentType?: string;
  kycDocumentNumber?: string;
  kycDocumentUrl?: string;
  subscriptionPlan?: "free" | "premium" | "featured";
  subscriptionExpiry?: string;
  isOwnerVerified?: boolean;
}

export type ListingCategory =
  | "rooms"
  | "pg"
  | "hostels"
  | "flats"
  | "mess"
  | "tiffin"
  | "jobs"
  | "tuition"
  | "colleges"
  | "schools"
  | "local_services";

export interface Listing {
  id: string;
  ownerId: string;
  ownerName: string;
  title: string;
  description: string;
  category: ListingCategory;
  city: string;
  locality: string;
  price: number;
  pricePeriod: string; // e.g. "month", "day", "one-time", "semester", "salary-pm"
  features: string[];
  images: string[];
  contactNumber: string;
  email: string;
  address: string;
  rating: number;
  reviewsCount: number;
  status: "active" | "pending" | "rejected";
  createdAt: string;
  isVerified?: boolean;
  isFeatured?: boolean;
  viewsCount?: number;
  clicksCount?: number;
  enquiriesCount?: number;
}

export interface Enquiry {
  id: string;
  listingId: string;
  listingTitle: string;
  ownerId: string;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  message: string;
  createdAt: string;
}

export interface Review {
  id: string;
  listingId: string;
  userId: string;
  userName: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
}

export interface Favourite {
  id: string; // composite userId_listingId
  userId: string;
  listingId: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface Booking {
  id?: string;
  listingId: string;
  listingTitle: string;
  listingCity: string;
  listingLocality: string;
  listingImage: string;
  ownerId: string;
  ownerName: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "rejected";
  createdAt: string;
}

export interface ListingReport {
  id: string;
  listingId: string;
  listingTitle: string;
  ownerId: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  comment: string;
  status: "pending" | "resolved" | "dismissed";
  createdAt: string;
}

export interface Invoice {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  plan: "premium" | "featured";
  amount: number;
  razorpayPaymentId: string;
  status: "success" | "pending" | "failed";
  invoiceDate: string;
  invoiceNumber: string;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface DirectConversation {
  id: string;
  listingId?: string;
  listingTitle?: string;
  participants: string[]; // [userId, ownerId]
  participantNames: { [uid: string]: string };
  lastMessageText: string;
  lastMessageTime: string;
  unreadCount: { [uid: string]: number };
}

export interface CMSBanner {
  name: string;
  slogan: string;
  image: string;
  relocations: string;
}

export interface CMSTestimonial {
  quote: string;
  author: string;
  role: string;
  city: string;
  avatar: string;
}

export interface CMSStat {
  label: string;
  val: string;
  desc: string;
}

export interface CMSBlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  author: string;
  image: string;
}

export interface CMSSeo {
  title: string;
  description: string;
  keywords: string;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  type: "user" | "owner" | "listing";
  targetId?: string; // listing ID or user ID
  targetTitle?: string; // listing Title if type is listing
  documentType: string;
  documentNumber: string;
  documentUrl?: string;
  status: "pending" | "verified" | "rejected";
  feedback?: string;
  trustScore: number;
  scoreBreakdown: {
    backgroundCheck: boolean;
    profileComplete: boolean;
    documentMatch: boolean;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface MarketplaceLead {
  id: string;
  partnerType: "tiffin" | "packers_movers" | "broadband";
  partnerName: string;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  city: string;
  payloadDetails?: Record<string, any>;
  commissionAmount: number;
  status: "pending" | "connected" | "completed" | "cancelled";
  createdAt: string;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredEmail: string;
  referralCode: string;
  status: "pending" | "signed_up" | "completed";
  rewardAmount: number;
  rewardClaimed: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface UserWallet {
  userId: string;
  balance: number;
  accruedCashback: number;
  referralCode: string;
  createdAt: string;
  updatedAt?: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  status: "pending" | "completed" | "failed";
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  channel: string; // e.g. "BengaluruTech", "PuneFlats", "TiffinReviews", "RoommateSearch"
  title: string;
  content: string;
  upvotes: string[]; // List of user IDs who upvoted
  createdAt: string;
  commentsCount: number;
  isRoommateQuery?: boolean;
  roommatePrefs?: {
    budget?: number;
    gender?: string;
    occupation?: string;
    movingDate?: string;
  };
}

export interface CommunityComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
}

export interface P2PChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  read: boolean;
  mediaUrl?: string;
  mediaType?: "image" | "document" | "map";
}

export interface ChatConversation {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  lastMessageText: string;
  lastMessageTime: string;
  unreadCount: Record<string, number>;
  typing?: Record<string, boolean>;
}

export interface UserPresence {
  userId: string;
  status: "online" | "offline";
  lastActive: string;
}

export interface CityGuide {
  id: string;
  name: string;
  state: string;
  tagline: string;
  coverImage: string;
  rentBands: {
    bachelorRoom: string;
    flat2BHK: string;
    luxuryApartment: string;
  };
  transport: {
    metroAvailability: string;
    busNetwork: string;
    averageCommuteCost: string;
    keyTips: string[];
  };
  colleges: {
    name: string;
    type: string; // e.g. "Engineering", "B.Pharm", "Medical"
    rating: string;
  }[];
  proximityHubs: string[]; // IT parks, tech hubs, industrial belts
  safetyScore: number; // 1-100
  safetyDetails: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
}

export interface PaymentTransaction {
  id: string;
  bookingId: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  purpose: "premium_booking" | "property_deposit" | "affiliate_referral";
  status: "initiated" | "authorized" | "captured" | "refunded";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  commissionRate: number;
  platformCut: number;
  vendorPayout: number;
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "alert" | "message" | "email_and_push";
  read: boolean;
  createdAt: string;
}





