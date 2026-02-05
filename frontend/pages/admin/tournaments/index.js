import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import api from '../../../utils/api';
import { FaTrophy, FaPlus, FaFilter } from 'react-icons/fa';

export default function TournamentsPage() {
    const router = useRouter();
    const [tournaments, setTournaments] = useState([]);
    const [leagues, setLeagues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        league_id: '',
        status: '',
        game_type: ''
    });

    useEffect(() => {
        fetchLeagues();
        fetchTournaments();
    }, []);

    const fetchLeagues = async () => {
        try {
            const response = await api.get('/leagues');
            setLeagues(response.data.leagues || []);
        } catch (error) {
            console.error('Error fetching leagues:', error);
        }
    };

    const fetchTournaments = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.league_id) params.append('league_id', filters.league_id);
            if (filters.status) params.append('status', filters.status);
            if (filters.game_type) params.append('game_type', filters.game_type);

            const response = await api.get(`/tournaments?${params.toString()}`);
            setTournaments(response.data.tournaments || []);
        } catch (error) {
            console.error('Error fetching tournaments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const applyFilters = () => {
        fetchTournaments();
    };

    const getStatusBadge = (status) => {
        const badges = {
            'draft': 'bg-gray-500',
            'in-progress': 'bg-blue-500',
            'completed': 'bg-green-500',
            'cancelled': 'bg-red-500'
        };
        return badges[status] || 'bg-gray-500';
    };

    const getFormatLabel = (format) => {
        const labels = {
            'round-robin': 'Round Robin',
            'single-elimination': 'Single Elimination',
            'double-elimination': 'Double Elimination'
        };
        return labels[format] || format;
    };

    const getGameTypeLabel = (gameType) => {
        const labels = {
            'ultimate-pool': 'Ultimate Pool',
            'blackball': 'Blackball',
            '8-ball': '8-Ball',
            '9-ball': '9-Ball',
            'snooker': 'Snooker'
        };
        return labels[gameType] || gameType;
    };

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <FaTrophy className="text-4xl text-yellow-500" />
                        <h1 className="text-3xl font-bold text-white">Tournaments</h1>
                    </div>
                    <button
                        onClick={() => router.push('/admin/tournaments/create')}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <FaPlus /> Create Tournament
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-gray-800 rounded-lg p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <FaFilter className="text-blue-400" />
                        <h2 className="text-xl font-semibold text-white">Filters</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                League
                            </label>
                            <select
                                value={filters.league_id}
                                onChange={(e) => handleFilterChange('league_id', e.target.value)}
                                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Leagues</option>
                                {leagues.map(league => (
                                    <option key={league.id} value={league.id}>
                                        {league.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Status
                            </label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Statuses</option>
                                <option value="draft">Draft</option>
                                <option value="in-progress">In Progress</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Game Type
                            </label>
                            <select
                                value={filters.game_type}
                                onChange={(e) => handleFilterChange('game_type', e.target.value)}
                                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Game Types</option>
                                <option value="ultimate-pool">Ultimate Pool</option>
                                <option value="blackball">Blackball</option>
                                <option value="8-ball">8-Ball</option>
                                <option value="9-ball">9-Ball</option>
                                <option value="snooker">Snooker</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={applyFilters}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tournaments Table */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                        <p className="text-gray-400 mt-4">Loading tournaments...</p>
                    </div>
                ) : tournaments.length === 0 ? (
                    <div className="bg-gray-800 rounded-lg p-12 text-center">
                        <FaTrophy className="text-6xl text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg">No tournaments found</p>
                        <button
                            onClick={() => router.push('/admin/tournaments/create')}
                            className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
                        >
                            Create Your First Tournament
                        </button>
                    </div>
                ) : (
                    <div className="bg-gray-800 rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-900">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Name</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">League</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Game Type</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Format</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Participants</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {tournaments.map(tournament => (
                                    <tr
                                        key={tournament.id}
                                        className="hover:bg-gray-750 transition-colors cursor-pointer"
                                        onClick={() => router.push(`/admin/tournaments/${tournament.id}`)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <FaTrophy className="text-yellow-500" />
                                                <span className="text-white font-medium">{tournament.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-300">{tournament.league_name}</td>
                                        <td className="px-6 py-4 text-gray-300">{getGameTypeLabel(tournament.game_type)}</td>
                                        <td className="px-6 py-4 text-gray-300">{getFormatLabel(tournament.format)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getStatusBadge(tournament.status)}`}>
                                                {tournament.status.replace('-', ' ').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-300">{tournament.participant_count || 0}</td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/admin/tournaments/${tournament.id}`);
                                                }}
                                                className="text-blue-400 hover:text-blue-300 font-medium"
                                            >
                                                View →
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Layout>
    );
}
