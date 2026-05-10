'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { navigationItems } from '../lib/navigation';

export function Sidebar() {
  const pathname = usePathname();
  const groupedItems = [
    { key: 'main', label: '', items: navigationItems.filter((item) => item.group === 'main') },
    { key: 'flow', label: 'Alert Response Flow', items: navigationItems.filter((item) => item.group === 'flow') },
    { key: 'library', label: 'System / Library', items: navigationItems.filter((item) => item.group === 'library') },
  ];

  return (
    <aside className="w-full border-b border-[var(--border)] bg-[var(--panel)] p-4 lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-700">SOARISK</p>
        <h1 className="mt-2 text-xl font-semibold">SOC Automation</h1>
        <p className="mt-2 text-sm text-slate-600">
          SOAR operations console for alert response and workflow control.
        </p>
      </div>

      <nav className="space-y-5">
        {groupedItems.map((group) => (
          <div className="space-y-2" key={group.key}>
            {group.label ? (
              <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                {group.label}
              </p>
            ) : null}
            {group.items.map((item) => {
              const active =
                item.href === '/'
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={`${group.key}-${item.label}`}
                  href={item.href}
                  className={`block rounded-xl px-3 py-2 text-sm transition ${
                    active
                      ? 'border border-[rgba(122,162,247,0.45)] bg-[rgba(122,162,247,0.16)] text-[var(--accent)]'
                      : 'bg-[var(--panel-muted)] text-slate-700 hover:bg-teal-50 hover:text-teal-900'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
