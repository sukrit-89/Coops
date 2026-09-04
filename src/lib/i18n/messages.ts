export const supportedLocales = ["en", "hi", "bn"] as const;
export type Locale = (typeof supportedLocales)[number];

export const messages = {
  en: {
    nav: { home: "Home", services: "Services", bookings: "Bookings", dashboard: "Dashboard", signIn: "Sign in" },
    actions: { tryItOut: "Try it out", getStarted: "Get Started", save: "Save", cancel: "Cancel" },
    booking: { request: "Request booking", sent: "Booking request sent to the worker." }
  },
  hi: {
    nav: { home: "होम", services: "सेवाएं", bookings: "बुकिंग", dashboard: "डैशबोर्ड", signIn: "साइन इन" },
    actions: { tryItOut: "आजमाएं", getStarted: "शुरू करें", save: "सहेजें", cancel: "रद्द करें" },
    booking: { request: "बुकिंग अनुरोध", sent: "बुकिंग अनुरोध कर्मचारी को भेज दिया गया है।" }
  },
  bn: {
    nav: { home: "হোম", services: "পরিষেবা", bookings: "বুকিং", dashboard: "ড্যাশবোর্ড", signIn: "সাইন ইন" },
    actions: { tryItOut: "চেষ্টা করুন", getStarted: "শুরু করুন", save: "সংরক্ষণ", cancel: "বাতিল" },
    booking: { request: "বুকিং অনুরোধ", sent: "বুকিং অনুরোধ কর্মীর কাছে পাঠানো হয়েছে।" }
  }
} as const;

export function isLocale(value: string | undefined): value is Locale {
  return supportedLocales.includes(value as Locale);
}
