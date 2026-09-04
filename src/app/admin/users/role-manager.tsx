"use client";

import { useState } from "react";

type UserItem = {
  id: string;
  fullName: string;
  phone: string;
  createdAt: string;
  roles: string[];
};

const ALL_ROLES = ["customer", "worker", "cooperative_admin", "platform_admin"] as const;

export function UserRoleManager({ initialUsers }: { initialUsers: UserItem[] }) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function toggleRole(userId: string, role: string, currentRoles: string[]) {
    const hasRole = currentRoles.includes(role);
    const action = hasRole ? "remove" : "add";

    setPendingId(userId);
    const res = await fetch("/api/admin/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role, action })
    });

    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                roles: action === "add" ? [...u.roles, role] : u.roles.filter((r) => r !== role)
              }
            : u
        )
      );
    }
    setPendingId(null);
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-white">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-[var(--line)] bg-[#f5f2ee] font-medium text-neutral-600">
          <tr>
            <th className="p-4">User</th>
            <th className="p-4">ID</th>
            <th className="p-4">Active Roles</th>
            <th className="p-4">Manage Roles</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {users.map((u) => (
            <tr key={u.id}>
              <td className="p-4">
                <p className="font-medium text-neutral-900">{u.fullName}</p>
                <p className="text-neutral-500">{u.phone}</p>
              </td>
              <td className="p-4 font-mono text-neutral-400">{u.id.slice(0, 8)}</td>
              <td className="p-4">
                <div className="flex flex-wrap gap-1">
                  {u.roles.map((r) => (
                    <span key={r} className="rounded-full bg-neutral-100 px-2 py-0.5 font-mono text-[10px] text-neutral-700">
                      {r}
                    </span>
                  ))}
                </div>
              </td>
              <td className="p-4">
                <div className="flex flex-wrap gap-1.5">
                  {ALL_ROLES.map((role) => {
                    const active = u.roles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        disabled={pendingId === u.id}
                        onClick={() => toggleRole(u.id, role, u.roles)}
                        className={`rounded-lg px-2 py-1 text-[10px] font-medium transition ${
                          active
                            ? "bg-[#0b0f1a] text-white"
                            : "border border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
                        } disabled:opacity-50`}
                      >
                        {active ? `✓ ${role}` : `+ ${role}`}
                      </button>
                    );
                  })}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
