import SidebarMenu from '@/components/ui/SidebarMenu';
import { Outlet } from 'react-router';
import { useState, useEffect, useRef } from 'react';
import UserDropdown from '@/components/ui/UserDropdown';
import { TbMenu2 } from 'react-icons/tb';
import {
  TbHome,
  TbApps,
  TbUsersGroup,
  TbUserCog,
  TbUserEdit,
  TbBuildingEstate,
} from 'react-icons/tb';
import { cn } from '@/lib/utils';
import Brand from '@/components/ui/Brand';
import { Toaster } from 'react-hot-toast';
import { useSelector } from 'react-redux';

const Header = ({ toggleSidebar }) => {
  return (
    <header className="bg-white shadow-md p-4 flex justify-between lg:justify-end items-center">
      <TbMenu2
        className="size-5 cursor-pointer lg:hidden"
        onClick={toggleSidebar}
      />
      <UserDropdown />
    </header>
  );
};

const Sidebar = ({ isOpen, currentUser, ref }) => {
  const menuItems = [
    { name: 'Home', icon: TbHome, link: '/' },
    ...(currentUser.role === 'admin'
      ? [
          { name: 'Dashboard', icon: TbApps, link: '/dashboard' },
          { name: 'Users', icon: TbUsersGroup, link: '/dashboard/users' },
          { name: 'Roles', icon: TbUserCog, link: '/dashboard/roles' },
        ]
      : []),
    {
      name: 'Properties',
      icon: TbBuildingEstate,
      link: '/dashboard/properties',
    },
    { name: 'Profile', icon: TbUserEdit, link: '/dashboard/profile' },
  ];

  return (
    <aside
      ref={ref}
      className={cn(
        'w-64 fixed h-screen inset-y-0 z-30 lg:z-30 bg-black flex flex-col transition duration-500 lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <Brand className="border-b border-gray-700 p-4" />
      <SidebarMenu menuItems={menuItems} />
    </aside>
  );
};

const DashboardLayout = () => {
  const { currentUser } = useSelector(state => state.auth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);
  const handleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleClickOutside = e => {
    if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
      setIsSidebarOpen(false);
    }
  };

  useEffect(() => {
    if (isSidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSidebarOpen]);

  return (
    <div className="flex min-h-screen">
      <Toaster position="top-right" />
      <Sidebar
        isOpen={isSidebarOpen}
        ref={sidebarRef}
        currentUser={currentUser}
      />
      <div className="flex flex-col flex-grow lg:pl-64 overflow-x-hidden">
        <Header toggleSidebar={handleSidebar} />
        <main className="container mx-auto p-5 lg:px-10 xl:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
