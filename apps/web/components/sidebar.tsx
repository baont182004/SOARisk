'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { navigationItems } from '../lib/navigation';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full border-b border-[var(--border)] bg-[var(--panel)] p-4 lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-700">SOARISK</p>
        <h1 className="mt-2 text-xl font-semibold">Tự động hóa SOC</h1>
        <p className="mt-2 text-sm text-slate-600">
          Nền tảng SOAR demo cho luồng xử lý cảnh báo, playbook, phê duyệt và báo cáo.
        </p>
      </div>

      <nav className="space-y-2">
        {navigationItems.map((item) => {
          const active =
            item.href === '/'
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-xl px-3 py-2 text-sm transition ${
                active
                  ? 'bg-teal-800 text-white'
                  : 'bg-[var(--panel-muted)] text-slate-700 hover:bg-teal-50 hover:text-teal-900'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
