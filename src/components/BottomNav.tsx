import { NavLink } from 'react-router-dom';
import {
  Home,
  Wallet,
  Receipt,
  User,
} from 'lucide-react';

const navItems = [
  {
    label: 'Home',
    path: '/',
    icon: Home,
  },
  {
    label: 'Wallet',
    path: '/wallet',
    icon: Wallet,
  },
  {
    label: 'Transactions',
    path: '/transactions',
    icon: Receipt,
  },
  {
    label: 'Profile',
    path: '/profile',
    icon: User,
  },
];

export default function BottomNav() {
  return (
    <nav
      className="
        fixed
        bottom-0
        left-0
        right-0
        z-50
        mx-auto
        w-full
        max-w-md
        border-t
        border-[#E5E9EF]
        bg-white
        px-3
        py-2
        shadow-[0_-4px_18px_rgba(16,42,86,0.07)]
      "
    >
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `
                flex
                min-w-[64px]
                flex-col
                items-center
                justify-center
                gap-1
                rounded-xl
                px-3
                py-1.5
                transition-all
                duration-200
                ${
                  isActive
                    ? 'text-[#F28C28]'
                    : 'text-[#8A95A5] hover:text-[#102A56]'
                }
                `
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`
                      flex
                      h-8
                      w-8
                      items-center
                      justify-center
                      rounded-xl
                      transition-all
                      duration-200
                      ${
                        isActive
                          ? 'bg-[#FFF1DF]'
                          : 'bg-transparent'
                      }
                    `}
                  >
                    <Icon
                      className={`
                        h-[19px]
                        w-[19px]
                        ${
                          isActive
                            ? 'text-[#F28C28]'
                            : 'text-[#8A95A5]'
                        }
                      `}
                      strokeWidth={
                        isActive ? 2.4 : 2
                      }
                    />
                  </div>

                  <span
                    className={`
                      text-[9px]
                      ${
                        isActive
                          ? 'font-extrabold text-[#102A56]'
                          : 'font-medium text-[#8A95A5]'
                      }
                    `}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
