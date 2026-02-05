import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

export default function TeamDetail() {
    const router = useRouter();
    const { id } = router.query;
    const [team, setTeam] = useState(null);
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (id) {
            fetchTeamData();
        }
    }, [id]);

    const fetchTeamData = async () => {
        try {
            setLoading(true);
            const [teamRes, playersRes] = await Promise.all([
                api.get(`/teams/${id}`),
                api.get(`/teams/${id}/players`)
            ]);
            setTeam(teamRes.data.team);
            setPlayers(playersRes.data.players || []);
        } catch (err) {
            console.error('Error fetching team:', err);
            setError('Failed to load team details');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-turquoise-500"></div>
                </div>
            </Layout>
        );
    }

    if (error || !team) {
        return (
            <Layout>
                <div className="text-center py-12">
                    <h1 className="text-2xl font-bold text-white mb-4">Team Not Found</h1>
                    <p className="text-gray-400 mb-6">{error || 'The team you are looking for does not exist.'}</p>
                    <button onClick={() => router.push('/teams')} className="btn-primary">
                        Back to Teams
                    </button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-6">
                {/* Team Header */}
                <div className="bg-gradient-to-r from-navy-800 to-navy-900 rounded-lg p-8 border border-navy-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">{team.name}</h1>
                            <div className="flex items-center space-x-4 text-gray-400">
                                <span>Division: {team.division_name || 'Group A'}</span>
                                <span>•</span>
                                <span>Players: {players.length}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-turquoise-500">#{team.position || '-'}</div>
                            <div className="text-sm text-gray-400">Current Position</div>
                        </div>
                    </div>
                </div>

                {/* Team Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="card text-center">
                        <div className="text-3xl font-bold text-white">{team.played || 0}</div>
                        <div className="text-sm text-gray-400 mt-1">Played</div>
                    </div>
                    <div className="card text-center">
                        <div className="text-3xl font-bold text-green-500">{team.won || 0}</div>
                        <div className="text-sm text-gray-400 mt-1">Won</div>
                    </div>
                    <div className="card text-center">
                        <div className="text-3xl font-bold text-red-500">{team.lost || 0}</div>
                        <div className="text-sm text-gray-400 mt-1">Lost</div>
                    </div>
                    <div className="card text-center">
                        <div className="text-3xl font-bold text-turquoise-500">{team.points || 0}</div>
                        <div className="text-sm text-gray-400 mt-1">Points</div>
                    </div>
                </div>

                {/* Players Roster */}
                <div className="card">
                    <h2 className="text-2xl font-bold text-white mb-4">Team Roster</h2>
                    {players.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">No players assigned to this team yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-navy-700">
                                        <th className="text-left py-3 px-4 text-gray-300">#</th>
                                        <th className="text-left py-3 px-4 text-gray-300">Player Name</th>
                                        <th className="text-left py-3 px-4 text-gray-300">Phone</th>
                                        <th className="text-left py-3 px-4 text-gray-300">Email</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {players.map((player, index) => (
                                        <tr key={player.id} className="border-b border-navy-700 hover:bg-navy-700 transition-colors">
                                            <td className="py-3 px-4 text-gray-400">{index + 1}</td>
                                            <td className="py-3 px-4 text-white font-semibold">
                                                {player.first_name} {player.last_name}
                                            </td>
                                            <td className="py-3 px-4 text-gray-300">{player.phone || '-'}</td>
                                            <td className="py-3 px-4 text-gray-300">{player.email || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Recent Matches */}
                <div className="card">
                    <h2 className="text-2xl font-bold text-white mb-4">Recent Matches</h2>
                    <p className="text-gray-400 text-center py-8">No recent matches available.</p>
                </div>
            </div>
        </Layout>
    );
}
