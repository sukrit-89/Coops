"use client";

import { useState } from "react";

export function ProfileEditForm({
 profile,
}: {
 profile: { fullName: string; phone: string; preferredLanguage: string; email: string };
}) {
 const [fullName, setFullName] = useState(profile.fullName);
 const [phone, setPhone] = useState(profile.phone);
 const [preferredLanguage, setPreferredLanguage] = useState(profile.preferredLanguage);
 const [message, setMessage] = useState<string | null>(null);
 const [saving, setSaving] = useState(false);

 async function submit(e: React.FormEvent<HTMLFormElement>) {
 e.preventDefault();
 setSaving(true);
 setMessage(null);

 const response = await fetch("/api/profile", {
 method: "PATCH",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ fullName, phone, preferredLanguage }),
 });

 const result = await response.json();
 if (response.ok) {
 setMessage("Profile updated.");
 } else {
 setMessage(result.error ?? "Could not update profile.");
 }
 setSaving(false);
 }

 return (
 <form onSubmit={submit} className="max-w-lg space-y-5">
 <div>
 <label htmlFor="fullName" className="block text-xs font-medium text-neutral-600 mb-1">Full name</label>
 <input
 id="fullName"
 type="text"
 value={fullName}
 onChange={(e) => setFullName(e.target.value)}
 required
 minLength={2}
 className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
 />
 </div>

 <div>
 <label htmlFor="phone" className="block text-xs font-medium text-neutral-600 mb-1">Phone number</label>
 <input
 id="phone"
 type="tel"
 value={phone}
 onChange={(e) => setPhone(e.target.value)}
 placeholder="+91 98765 43210"
 className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
 />
 </div>

 <div>
 <label htmlFor="email" className="block text-xs font-medium text-neutral-600 mb-1">Email</label>
 <input
 id="email"
 type="email"
 value={profile.email}
 disabled
 className="w-full rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2 text-sm text-neutral-500"
 />
 <p className="mt-1 text-[10px] text-neutral-400">Email is managed through your authentication provider.</p>
 </div>

 <div>
 <label htmlFor="language" className="block text-xs font-medium text-neutral-600 mb-1">Preferred language</label>
 <select
 id="language"
 value={preferredLanguage}
 onChange={(e) => setPreferredLanguage(e.target.value)}
 className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
 >
 <option value="en">English</option>
 <option value="hi">Hindi</option>
 <option value="bn">Bengali</option>
 </select>
 </div>

 {message ? (
 <p role="status" className={`text-xs ${message === "Profile updated." ? "text-emerald-700" : "text-red-600"}`}>
 {message}
 </p>
 ) : null}

 <div className="flex gap-3">
 <button
 type="submit"
 disabled={saving}
 className="rounded-lg bg-[#0b0f1a] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60 hover:bg-neutral-800"
 >
 {saving ? "Saving..." : "Save changes"}
 </button>
 </div>
 </form>
 );
}