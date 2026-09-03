import { ArrowUpRight, Check, ChevronDown, MapPin, ShieldCheck } from "lucide-react";
import type { ServiceCategory } from "@/features/discovery/data";

export function DashboardPreview({ categories }: { categories: ServiceCategory[] }) {
  const visibleCategories = categories.slice(0, 4);

  return (
    <div className="w-full max-w-[880px] rounded-3xl bg-[#f5f2ee] p-4 sm:p-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        <article className="rounded-2xl bg-white p-5">
          <div className="flex justify-between text-[13px]"><span className="font-medium text-[#ef4d23]">Find a service</span><span className="text-neutral-400">Live discovery</span></div>
          <div className="mt-5 rounded-xl bg-[#f5f2ee] p-3"><div className="flex items-center gap-2 text-[12px] text-neutral-400"><MapPin size={14} /> Search near you</div><div className="mt-3 flex items-center justify-between rounded-lg bg-white px-3 py-2 text-[13px] text-neutral-800 shadow-sm"><span>Choose a service</span><ChevronDown size={14} /></div></div>
          <div className="mt-4 flex flex-wrap gap-1.5">{visibleCategories.map((category) => <span key={category.id} className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] text-neutral-600">{category.name}</span>)}</div>
        </article>

        <article className="flex flex-col gap-3 rounded-2xl bg-white p-5">
          <div className="flex justify-between text-[13px]"><span className="font-medium text-[#ef4d23]">Smart matching</span><span className="text-neutral-400">Built for fit</span></div>
          <div className="mt-2 space-y-2 rounded-xl bg-[#f5f2ee] p-3 text-[12px]"><div className="flex items-center gap-2"><Check size={14} className="text-[#ef4d23]" />Skill match</div><div className="flex items-center gap-2"><Check size={14} className="text-[#ef4d23]" />Location and availability</div><div className="flex items-center gap-2"><Check size={14} className="text-[#ef4d23]" />Experience and rating</div></div>
          <div className="mt-auto flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-[12px]"><span className="text-neutral-500">Recommended workers</span><ArrowUpRight size={15} /></div>
        </article>

        <article className="rounded-2xl bg-white p-5">
          <div className="flex justify-between text-[13px]"><span className="font-medium text-[#ef4d23]">Trusted booking</span><span className="text-neutral-400">One workflow</span></div>
          <div className="mt-5 space-y-3">{["Request service", "Confirm worker", "Complete and review"].map((step, index) => <div key={step} className="flex items-center gap-3 text-[12px]"><span className={`flex h-6 w-6 items-center justify-center rounded-full ${index === 0 ? "bg-[#ef4d23] text-white" : "bg-neutral-100 text-neutral-500"}`}>{index + 1}</span><span className={index === 0 ? "font-medium" : "text-neutral-500"}>{step}</span></div>)}</div>
          <div className="mt-5 flex items-center gap-2 rounded-lg bg-[#0b0f1a] px-3 py-2 text-[11px] text-white"><ShieldCheck size={14} className="text-[#ef4d23]" />Verified workers, clear updates</div>
        </article>
      </div>
    </div>
  );
}
