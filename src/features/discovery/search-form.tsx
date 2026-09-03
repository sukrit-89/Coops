import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ServiceCategory } from "@/features/discovery/data";

export function SearchForm({
  categories,
  defaultQuery,
  defaultCategory,
  defaultCity
}: {
  categories: ServiceCategory[];
  defaultQuery?: string;
  defaultCategory?: string;
  defaultCity?: string;
}) {
  return (
    <form action="/services" className="grid gap-3 border-y border-[var(--line)] bg-white p-4 sm:grid-cols-[1fr_220px_180px_auto]">
      <label className="sr-only" htmlFor="q">
        Search service
      </label>
      <input
        id="q"
        name="q"
        defaultValue={defaultQuery}
        placeholder="Search service, e.g. fan repair"
        className="min-h-11 rounded border border-[var(--line)] px-3"
      />
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
      <Button type="submit" className="gap-2">
        <Search size={16} aria-hidden="true" />
        Search
      </Button>
    </form>
  );
}
