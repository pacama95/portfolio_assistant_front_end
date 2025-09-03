import { NavLink } from 'react-router-dom';
import { TrendingUp, Receipt, DollarSign } from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    to: '/',
    label: 'Dashboard',
    icon: TrendingUp,
  },
  {
    to: '/transactions',
    label: 'Transactions',
    icon: Receipt,
  },
  {
    to: '/dividends',
    label: 'Dividends',
    icon: DollarSign,
  },
];

// Desktop Navigation (shown in header on larger screens)
export const DesktopNavigation = () => {
  return (
    <nav className="hidden md:flex space-x-4">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

// Mobile Bottom Navigation
export const MobileNavigation = () => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-3 px-1 transition-colors ${
                  isActive
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600'
                }`
              }
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

// Combined Navigation Component (for backward compatibility)
export const Navigation = DesktopNavigation;
