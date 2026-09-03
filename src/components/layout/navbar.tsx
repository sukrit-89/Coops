"use client";

import Link from "next/link";
import type { Route } from "next";
import { ChevronRight, Menu, X } from "lucide-react";
import { useState, type PointerEvent } from "react";
import { NotificationInbox } from "@/components/layout/notification-inbox";

const links: Array<{ label: string; href: Route }> = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Bookings", href: "/bookings" },
  { label: "Dashboard", href: "/dashboard" }
];

function FlowerMark() {
  const petals = Array.from({ length: 8 }, (_, index) => {
    const angle = (index * Math.PI) / 4;
    return <circle key={index} cx={16 + Math.cos(angle) * 10} cy={16 + Math.sin(angle) * 10} r="3.5" />;
  });

  return (
    <svg viewBox="0 0 32 32" className="h-6 w-6 sm:h-7 sm:w-7" aria-label="Coops">
      <g fill="#ef4d23">
        {petals}
        <circle cx="16" cy="16" r="3.5" />
      </g>
    </svg>
  );
}

export function Navbar({ overlay = false }: { overlay?: boolean }) {
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState({ x: 0, y: 0, active: false });

  function moveCursor(event: PointerEvent<HTMLElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    setCursor({ x: event.clientX - bounds.left, y: event.clientY - bounds.top, active: true });
  }

  return (
    <div className="relative z-30 flex justify-center px-3 pt-4 sm:px-4 sm:pt-6">
      <nav
        className={`relative flex w-full items-center rounded-full border border-neutral-200 bg-white py-1.5 pl-1.5 pr-1.5 shadow-sm transition-transform duration-300 ease-out md:w-fit ${cursor.active ? "md:scale-[1.01]" : ""} ${overlay ? "" : ""}`}
        onPointerMove={moveCursor}
        onPointerLeave={() => setCursor((value) => ({ ...value, active: false }))}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute left-0 top-0 hidden h-5 w-5 rounded-full bg-[#ef4d23]/15 transition-[opacity,transform] duration-300 ease-out md:block ${cursor.active ? "opacity-100" : "opacity-0"}`}
          style={{ transform: `translate(${cursor.x - 10}px, ${cursor.y - 10}px) scale(${cursor.active ? 2.4 : 0.6})` }}
        />
        <Link href="/" className="shrink-0" aria-label="Coops home">
          <FlowerMark />
        </Link>
        <div className="ml-3 hidden items-center gap-3 text-[13px] md:flex">
          {links.map((link) => (
            <Link key={link.label} href={link.href as Route} className="group inline-flex items-center gap-2 text-neutral-700 transition hover:text-[#ef4d23]">
              {link.label === "Home" ? <span className="h-1.5 w-1.5 rounded-full bg-[#ef4d23]" /> : null}
              {link.label}
            </Link>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 md:ml-4">
          <NotificationInbox />
          <Link href={"/auth" as Route} className="hidden px-2 py-1.5 text-[13px] text-neutral-600 transition hover:text-[#ef4d23] sm:block">Sign in</Link>
          <Link href={"/auth?next=/services" as Route} className="inline-flex items-center gap-1.5 rounded-full bg-[#ef4d23] py-1.5 pl-3.5 pr-1.5 text-xs font-medium text-white sm:pl-4 sm:text-[13px]">
            <span>Try it out</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20"><ChevronRight size={13} /></span>
          </Link>
          <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-800 md:hidden" onClick={() => setOpen((value) => !value)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>
            {open ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
        {open ? (
          <div className="absolute left-2 right-2 top-full mt-2 rounded-2xl border border-neutral-200 bg-white p-3 shadow-lg md:hidden">
            {links.map((link) => (
              <Link key={link.label} href={link.href as Route} onClick={() => setOpen(false)} className="flex items-center justify-between rounded-xl px-3 py-3 text-sm text-neutral-700 hover:bg-neutral-50">
                {link.label}
              </Link>
            ))}
          </div>
        ) : null}
      </nav>
    </div>
  );
}
