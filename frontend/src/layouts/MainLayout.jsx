import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

import Sidebar from '../components/common/Sidebar';

export default function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* SIDEBAR */}
      <Sidebar collapsed={sidebarCollapsed} />

      {/* MAIN AREA */}
      <main className="flex-1 min-w-0 overflow-x-hidden">

        {/* TOP HEADER */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center px-6">

          {/* SIDEBAR TOGGLE */}
          <button
            type="button"
            onClick={() =>
              setSidebarCollapsed(!sidebarCollapsed)
            }
            className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-[#2B2B2B] hover:bg-gray-50 hover:border-[#0EA5A5]/40 transition-all"
            title={
              sidebarCollapsed
                ? 'Show navigation'
                : 'Hide navigation'
            }
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-5 h-5" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>

        </header>

        {/* PAGE CONTENT */}
        <div className="p-6 md:p-8">
          <Outlet />
        </div>

      </main>
    </div>
  );
}