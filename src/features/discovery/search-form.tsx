"use client";

import { LocateFixed, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ServiceCategory } from "@/features/discovery/data";

export function SearchForm({
  categories,
  defaultQuery,
  defaultCategory,
  defaultCity,
  defaultLatitude,
  defaultLongitude,
  defaultMinRating,
  defaultMaxDistance,
  defaultMinExperience
}: {
  categories: ServiceCategory[];
  defaultQuery?: string;
  defaultCategory?: string;
  defaultCity?: string;
  defaultLatitude?: number;
  defaultLongitude?: number;
  defaultMinRating?: string;
  defaultMaxDistance?: string;
  defaultMinExperience?: string;
}) {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(
    defaultLatitude && defaultLongitude ? { latitude: defaultLatitude, longitude: defaultLongitude } : null
  );
  const [locationMessage, setLocationMessage] = useState<string | null>(
    defaultLatitude && defaultLongitude ? "Using location from search." : null
  );
  const [showFilters, setShowFilters] = useState(false);

  function locate() {
    if (!navigator.geolocation) {
      setLocationMessage("Location is unavailable; search by city instead.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setLocationMessage("Using your current location.");
      },
      () => setLocationMessage("Location permission was not granted; search by city instead.")
    );
  }

  return (
    <form action="/services" className="grid gap-3 border-y border-[var(--line)] bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_220px_180px_auto]">
        {location ? (
          <>
            <input type="hidden" name="latitude" value={location.latitude} />
            <input type="hidden" name="longitude" value={location.longitude} />
          </>
        ) : null}
        <label className="sr-only" htmlFor="q">
          Search service
        </label>
        <div className="flex gap-2 sm:contents">
          <input
            id="q"
            name="q"
            defaultValue={defaultQuery}
            placeholder="Search service, e.g. fan repair"
            className="min-h-11 rounded border border-[var(--line)] px-3"
          />
          <button
            type="button"
            onClick={locate}
            aria-label="Use my current location"
            className="flex min-h-11 items-center justify-center rounded border border-[var(--line)] px-3 text-[var(--muted)] hover:text-[var(--accent)]"
          >
            <LocateFixed size={17} />
          </button>
        </div>
        <label className="sr-only" htmlFor="category">
          Category
        </label>
        <select
          id="category"
          name="category"
          defaultValue={defaultCategory}
          className="min-h-11 rounded border border-[var(--line)] bg-white px-3"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="city">
          City
        </label>
        <input
          id="city"
          name="city"
          defaultValue={defaultCity}
          placeholder="City"
          className="min-h-11 rounded border border-[var(--line)] px-3"
        />
        <div className="flex gap-2">
          <Button type="submit" className="gap-2 flex-1 sm:flex-none">
            <Search size={16} aria-hidden="true" />
            Search
          </Button>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="min-h-11 rounded border border-neutral-300 px-3 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
          >
            Filters
          </button>
        </div>
      </div>

      {showFilters ? (
        <div className="grid gap-3 border-t border-neutral-100 pt-3 sm:grid-cols-3">
          <div>
            <label htmlFor="minRating" className="block text-xs font-medium text-neutral-600 mb-1">
              Minimum Rating
            </label>
            <select
              id="minRating"
              name="minRating"
              defaultValue={defaultMinRating ?? ""}
              className="w-full min-h-9 rounded border border-neutral-200 bg-white px-2.5 text-xs"
            >
              <option value="">Any rating</option>
              <option value="4.5">4.5+ stars</option>
              <option value="4.0">4.0+ stars</option>
              <option value="3.5">3.5+ stars</option>
            </select>
          </div>
          <div>
            <label htmlFor="maxDistance" className="block text-xs font-medium text-neutral-600 mb-1">
              Max Distance (km)
            </label>
            <input
              id="maxDistance"
              name="maxDistance"
              type="number"
              min="1"
              max="100"
              defaultValue={defaultMaxDistance ?? ""}
              placeholder="e.g. 10"
              className="w-full min-h-9 rounded border border-neutral-200 px-2.5 text-xs"
            />
          </div>
          <div>
            <label htmlFor="minExperience" className="block text-xs font-medium text-neutral-600 mb-1">
              Min Experience (years)
            </label>
            <input
              id="minExperience"
              name="minExperience"
              type="number"
              min="0"
              max="40"
              defaultValue={defaultMinExperience ?? ""}
              placeholder="e.g. 2"
              className="w-full min-h-9 rounded border border-neutral-200 px-2.5 text-xs"
            />
          </div>
        </div>
      ) : null}

      {locationMessage ? <p className="text-xs text-neutral-500">{locationMessage}</p> : null}
    </form>
  );
}
