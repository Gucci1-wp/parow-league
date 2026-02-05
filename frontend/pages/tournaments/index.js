import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import api from '../../utils/api';

export default function Tournaments() {
    const router = useRouter();
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Get user from localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
        fetchTournaments();
    }, []);

    const fetchTournaments = async () => {
        try {
            const response = await api.get('/tournaments');
            setTournaments(response.data.tournaments || []);
        } catch (error) {
            console.error('Error fetching tournaments:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Tournaments</h1>
                        <p className="text-gray-400">Manage league tournaments and fixtures</p>
                    </div>
                    {user && user.role === 'admin' && (
                        <button
                            onClick={() => router.push('/tournaments/create')}
                            className="btn-primary"
                        >
                            + Generate Fixtures
                        </button>
                    )}
                </div>

                {/* Tournament Info Card */}
                <div className="card">
                    <h2 className="text-2xl font-bold text-white mb-4">Summer League 2025</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <div className="text-sm text-gray-400 mb-1">Format</div>
                            <div className="text-white font-semibold">Round-Robin (2 Rounds)</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-400 mb-1">Match Format</div>
                            <div className="text-white font-semibold">25 Frames, First to 13 Wins</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-400 mb-1">Schedule</div>
                            <div className="text-white font-semibold">Every Sunday</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-400 mb-1">Venue</div>
                            <div className="text-white font-semibold">Nick's Pool Lounge Parow</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-400 mb-1">Location</div>
                            <div className="text-white font-semibold">Cape Town</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-400 mb-1">Duration</div>
                            <div className="text-white font-semibold">Until November 2026</div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link href="/schedule">
                        <div className="card-hover">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-turquoise-500/20 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-turquoise-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold">View Schedule</h3>
                                    <p className="text-sm text-gray-400">See all fixtures</p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    <Link href="/standings">
                        <div className="card-hover">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold">Standings</h3>
                                    <p className="text-sm text-gray-400">Team rankings</p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    <Link href="/stats">
                        <div className="card-hover">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold">Statistics</h3>
                                    <p className="text-sm text-gray-400">Player stats</p>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Tournament Rules */}
                <div className="card">
                    <h2 className="text-xl font-bold text-white mb-4">Tournament Rules</h2>
                    <div className="space-y-3 text-gray-300">
                        <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-turquoise-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-white text-xs font-bold">1</span>
                            </div>
                            <div>
                                <div className="font-semibold text-white">Match Format</div>
                                <div className="text-sm">Each match consists of 25 frames. First team to win 13 frames wins the match. No draws.</div>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-turquoise-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-white text-xs font-bold">2</span>
                            </div>
                            <div>
                                <div className="font-semibold text-white">Round-Robin Format</div>
                                <div className="text-sm">All teams play each other twice (home and away) over 2 complete rounds.</div>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-turquoise-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-white text-xs font-bold">3</span>
                            </div>
                            <div>
                                <div className="font-semibold text-white">Schedule</div>
                                <div className="text-sm">Matches are played every Sunday at Nick's Pool Lounge Parow, Cape Town.</div>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-turquoise-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-white text-xs font-bold">4</span>
                            </div>
                            <div>
                                <div className="font-semibold text-white">Player Statistics</div>
                                <div className="text-sm">Individual player performance is tracked automatically, including win percentage, streaks, and ranking points.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
