import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import StatsTable from '../../components/StatsTable';
import api from '../../utils/api';

export default function StatsPage() {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await api.get('/stats/players');
            setPlayers(response.data.stats);
        } catch (err) {
            console.error('Failed to fetch stats:', err);
            setError('Failed to load player statistics.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-navy-700 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-turquoise-400 to-blue-500 bg-clip-text text-transparent">
                            Player Statistics
                        </h1>
                        <p className="text-gray-400 mt-1">
                            Individual performance leaderboards and analytics
                        </p>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-turquoise-500"></div>
                    </div>
                ) : error ? (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg text-center">
                        {error}
                    </div>
                ) : (
                    <StatsTable players={players} />
                )}
            </div>
        </Layout>
    );
}
