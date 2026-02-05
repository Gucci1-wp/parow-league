import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';
import api from '../../utils/api';

export default function Teams() {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        try {
            const response = await api.get('/teams');
            setTeams(response.data.teams || []);
        } catch (error) {
            console.error('Error fetching teams:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTeams = teams.filter(team =>
        team.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1">Teams</h1>
                        <p className="text-sm text-gray-400">Summer League 2025 - {filteredTeams.length} teams</p>
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search teams..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input w-64 pl-10 py-2"
                        />
                        <svg
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>
                </div>

                {/* Teams Grid - Compact Layout */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-turquoise-500"></div>
                    </div>
                ) : filteredTeams.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-400">
                            {searchTerm ? 'No teams found matching your search' : 'No teams available'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                        {filteredTeams.map((team, index) => (
                            <Link key={team.id} href={`/teams/${team.id}`}>
                                <div className="bg-[#1e2530] hover:bg-[#2a3441] rounded-lg p-3 transition-all cursor-pointer border border-[#2a3441] hover:border-turquoise-500/50 group">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-8 h-8 bg-gradient-to-br from-turquoise-500 to-turquoise-600 rounded flex items-center justify-center text-white font-bold text-sm">
                                                {team.name.charAt(0)}
                                            </div>
                                            <span className="text-xs text-gray-500">#{index + 1}</span>
                                        </div>
                                        <svg
                                            className="w-4 h-4 text-gray-600 group-hover:text-turquoise-500 transition-colors"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 5l7 7-7 7"
                                            />
                                        </svg>
                                    </div>

                                    <h3 className="text-sm font-bold text-white mb-2 group-hover:text-turquoise-500 transition-colors truncate">
                                        {team.name}
                                    </h3>

                                    <div className="flex items-center justify-between text-xs">
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-white">{team.played || 0}</div>
                                            <div className="text-gray-500">P</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-green-500">{team.won || 0}</div>
                                            <div className="text-gray-500">W</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-red-500">{team.lost || 0}</div>
                                            <div className="text-gray-500">L</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-turquoise-500">{team.points || 0}</div>
                                            <div className="text-gray-500">Pts</div>
                                        </div>
                                    </div>

                                    {team.player_count !== undefined && (
                                        <div className="mt-2 pt-2 border-t border-[#2a3441] flex items-center justify-between">
                                            <span className="text-xs text-gray-500">Players</span>
                                            <span className="text-xs text-white font-semibold">{team.player_count}</span>
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}
