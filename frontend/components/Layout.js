import Navbar from './Navbar';

export default function Layout({ children }) {
    return (
        <div className="min-h-screen bg-navy-900">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
            <footer className="bg-navy-800 border-t border-navy-700 mt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center text-gray-400">
                        <p>&copy; 2025 Parow Social League. All rights reserved.</p>
                        <p className="text-sm mt-2">Nicks Pool Lounge Parow, Cape Town</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
