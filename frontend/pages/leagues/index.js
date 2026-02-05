import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { FaMapMarkerAlt, FaLock, FaGlobe } from 'react-icons/fa';

export default function Leagues() {
    const [leagues, setLeagues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchLeagues();
    }, []);

    const fetchLeagues = async () => {
        try {
            setLoading(true);
            const response = await api.get('/leagues');
            setLeagues(response.data.leagues);
            setError('');
        } catch (error) {
            console.error('Error fetching leagues:', error);
            setError('Failed to load leagues');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-turquoise-500 mx-auto"></div>
                        <p className="mt-4 text-gray-400">Loading leagues...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Browse Leagues</h1>
                    <p className="text-gray-400">Explore pool leagues in your area</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Leagues Grid */}
                {leagues.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-400 text-lg">No public leagues available at the moment.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {leagues.map((league) => (
                            <Link
                                key={league.id}
                                href={`/leagues/${league.id}`}
                                className="card hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group flex flex-col"
                            >
                                {/* League Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-white group-hover:text-turquoise-400 transition-colors">
                                            {league.name}
                                        </h3>
                                        <div className="min-h-[24px] mt-2">
                                            {league.venue_name && (
                                                <div className="flex items-center text-gray-400 text-sm">
                                                    <FaMapMarkerAlt className="mr-2" />
                                                    {league.venue_name}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        {league.is_public ? (
                                            <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs flex items-center">
                                                <FaGlobe className="mr-1" />
                                                Public
                                            </div>
                                        ) : (
                                            <div className="bg-gray-500/20 text-gray-400 px-3 py-1 rounded-full text-xs flex items-center">
                                                <FaLock className="mr-1" />
                                                Private
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* League Details */}
                                <div className="space-y-2 text-sm flex-1">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Points per Win:</span>
                                        <span className="text-white font-medium">{league.points_per_win || 3}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Points per Tie:</span>
                                        <span className="text-white font-medium">{league.points_per_tie || 1}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Race to:</span>
                                        <span className="text-white font-medium">{league.race_to_default || 13}</span>
                                    </div>
                                </div>

                                {/* View Details Button */}
                                <div className="mt-6 pt-4 border-t border-gray-700">
                                    <span className="text-turquoise-400 font-medium group-hover:underline">
                                        View Details →
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}
