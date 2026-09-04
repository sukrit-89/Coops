"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

type Category = { id: string; name: string; slug: string };
type Service = {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  description: string;
  is_active: boolean;
};

export function ServiceManager({
  initialCategories,
  initialServices
}: {
  initialCategories: Category[];
  initialServices: Service[];
}) {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState(initialCategories[0]?.id ?? "");
  const [priceRupees, setPriceRupees] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setMessage(null);

    const res = await fetch("/api/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        categoryId,
        description,
        basePriceCents: Math.round(Number(priceRupees) * 100)
      })
    });

    const data = await res.json();
    if (res.ok && data.service) {
      setServices((prev) => [...prev, data.service]);
      setName("");
      setPriceRupees("");
      setDescription("");
      setMessage("Service created successfully.");
    } else {
      setMessage(data.error ?? "Could not create service.");
    }
    setPending(false);
  }

  const categoryMap = new Map(initialCategories.map((c) => [c.id, c.name]));

  return (
    <div className="space-y-8">
      {/* Create form */}
      <form onSubmit={handleCreate} className="rounded-3xl border border-[var(--line)] bg-white p-6 shadow-sm">
        <h3 className="font-medium text-neutral-900 mb-4 flex items-center gap-2">
          <Plus size={18} className="text-[#ef4d23]" />
          Add New Service Offering
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Service Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ceiling Fan Installation"
              className="w-full min-h-10 rounded-xl border border-neutral-200 px-3 text-xs outline-none focus:border-[#ef4d23]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full min-h-10 rounded-xl border border-neutral-200 bg-white px-3 text-xs outline-none"
            >
              {initialCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Base Price (₹)</label>
            <input
              required
              type="number"
              min="0"
              value={priceRupees}
              onChange={(e) => setPriceRupees(e.target.value)}
              placeholder="e.g. 499"
              className="w-full min-h-10 rounded-xl border border-neutral-200 px-3 text-xs outline-none focus:border-[#ef4d23]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short details"
              className="w-full min-h-10 rounded-xl border border-neutral-200 px-3 text-xs outline-none focus:border-[#ef4d23]"
            />
          </div>
        </div>

        {message ? <p className="mt-3 text-xs text-neutral-600">{message}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="mt-4 rounded-xl bg-[#0b0f1a] px-4 py-2.5 text-xs font-medium text-white disabled:opacity-50"
        >
          {pending ? "Adding..." : "Add Service"}
        </button>
      </form>

      {/* Services List Table */}
      <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-white">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-[var(--line)] bg-[#f5f2ee] font-medium text-neutral-600">
            <tr>
              <th className="p-4">Service</th>
              <th className="p-4">Category</th>
              <th className="p-4">Slug</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {services.map((s) => (
              <tr key={s.id}>
                <td className="p-4">
                  <p className="font-medium text-neutral-900">{s.name}</p>
                  <p className="text-[11px] text-neutral-400">{s.description || "No description"}</p>
                </td>
                <td className="p-4 text-neutral-600">{categoryMap.get(s.category_id) ?? "General"}</td>
                <td className="p-4 font-mono text-neutral-500">{s.slug}</td>
                <td className="p-4">
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700 font-medium">
                    Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
