import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import { FaBars, FaTimes, FaUser, FaBell, FaSignOutAlt, FaChevronDown } from 'react-icons/fa';

export default function Navbar() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setAdminDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        router.push('/auth/login');
    };

    const navLinks = [
        { href: '/', label: 'Home' },
        { href: '/leagues', label: 'Leagues' },
        { href: '/schedule', label: 'Schedule' },
        { href: '/standings', label: 'Standings' },
        { href: '/teams', label: 'Teams' },
        { href: '/tournaments', label: 'Tournaments' },
        { href: '/stats', label: 'Stats' },
    ];

    const adminLinks = [
        { href: '/admin/leagues', label: 'Manage Leagues' },
        { href: '/admin/teams', label: 'Manage Teams' },
        { href: '/admin/players', label: 'Manage Players' },
        { href: '/admin/tournaments', label: 'Manage Tournaments' },
        { href: '/admin/users', label: 'Manage Users' },
    ];

    return (
        <nav className="bg-[#0f1419] border-b border-[#1e2530] sticky top-0 z-50 shadow-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-turquoise-500 to-turquoise-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-xl">🎱</span>
                            </div>
                            <span className="text-xl font-bold text-white hidden sm:block">
                                Parow Social League
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${router.pathname === link.href
                                    ? 'bg-turquoise-500 text-white'
                                    : 'text-gray-300 hover:bg-[#1e2530] hover:text-white'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}

                        {/* Admin Dropdown */}
                        {user && user.role === 'admin' && (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${adminDropdownOpen || adminLinks.some(link => router.pathname === link.href)
                                        ? 'bg-turquoise-500 text-white'
                                        : 'text-gray-300 hover:bg-[#1e2530] hover:text-white'
                                        }`}
                                >
                                    Admin
                                    <FaChevronDown className={`ml-2 transition-transform ${adminDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown Menu */}
                                {adminDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-[#1e2530] border border-gray-700 rounded-lg shadow-2xl py-2 animate-fadeIn">
                                        {adminLinks.map((link) => (
                                            <Link
                                                key={link.href}
                                                href={link.href}
                                                onClick={() => setAdminDropdownOpen(false)}
                                                className={`block px-4 py-3 text-sm transition-colors ${router.pathname === link.href
                                                    ? 'bg-turquoise-500/20 text-turquoise-400'
                                                    : 'text-gray-300 hover:bg-[#2a3441] hover:text-white'
                                                    }`}
                                            >
                                                {link.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* User Menu */}
                    <div className="flex items-center space-x-4">
                        {user ? (
                            <>
                                <button className="text-gray-300 hover:text-white relative">
                                    <FaBell size={20} />
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                        3
                                    </span>
                                </button>
                                <div className="flex items-center space-x-2">
                                    <div className="hidden sm:block text-right">
                                        <p className="text-sm font-medium text-white">
                                            {user.first_name} {user.last_name}
                                        </p>
                                        <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="text-gray-300 hover:text-white"
                                        title="Logout"
                                    >
                                        <FaSignOutAlt size={20} />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <Link href="/auth/login" className="btn-primary">
                                Login
                            </Link>
                        )}

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden text-gray-300 hover:text-white"
                        >
                            {mobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-[#0a0e1a] border-t border-[#1e2530]">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`block px-3 py-2 rounded-lg font-medium ${router.pathname === link.href
                                    ? 'bg-turquoise-500 text-white'
                                    : 'text-gray-300 hover:bg-navy-700 hover:text-white'
                                    }`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}

                        {/* Admin Links in Mobile */}
                        {user && user.role === 'admin' && (
                            <>
                                <div className="border-t border-gray-700 my-2 pt-2">
                                    <p className="px-3 text-xs text-gray-500 uppercase tracking-wider mb-2">Admin</p>
                                    {adminLinks.map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className={`block px-3 py-2 rounded-lg font-medium ${router.pathname === link.href
                                                ? 'bg-turquoise-500 text-white'
                                                : 'text-gray-300 hover:bg-navy-700 hover:text-white'
                                                }`}
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
