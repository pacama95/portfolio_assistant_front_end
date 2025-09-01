import { NavLink } from 'react-router-dom';
import { TrendingUp, Receipt } from 'lucide-react';

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
];

export const Navigation = () => {
  return (
    <nav className="flex space-x-2 sm:space-x-4">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-100 text-blue-700 border-blue-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            <span className="text-xs sm:text-sm">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
