import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { FaMapMarkerAlt, FaTrophy, FaCalendar, FaArrowLeft } from 'react-icons/fa';

export default function LeagueDetail() {
    const router = useRouter();
    const { id } = router.query;
    const [league, setLeague] = useState(null);
    const [standings, setStandings] = useState([]);
    const [fixtures, setFixtures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('standings');

    useEffect(() => {
        if (id) {
            fetchLeagueData();
        }
    }, [id]);

    const fetchLeagueData = async () => {
        try {
            setLoading(true);
            const [leagueRes, standingsRes, fixturesRes] = await Promise.all([
                api.get(`/leagues/${id}`),
                api.get(`/leagues/${id}/standings`),
                api.get(`/leagues/${id}/fixtures`)
            ]);

            setLeague(leagueRes.data.league);
            setStandings(standingsRes.data.standings);
            setFixtures(fixturesRes.data.fixtures);
            setError('');
        } catch (error) {
            console.error('Error fetching league data:', error);
            if (error.response?.status === 403) {
                setError('This league is private and you do not have access.');
            } else {
                setError('Failed to load league details');
            }
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
                        <p className="mt-4 text-gray-400">Loading league...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="space-y-6">
                    <div className="bg-red-500/10 border border-red-500 text-red-500 px-6 py-4 rounded-lg">
                        {error}
                    </div>
                    <Link href="/leagues" className="btn-secondary inline-flex items-center">
                        <FaArrowLeft className="mr-2" />
                        Back to Leagues
                    </Link>
                </div>
            </Layout>
        );
    }

    if (!league) {
        return null;
    }

    return (
        <Layout>
            <div className="space-y-6">
                {/* Back Button */}
                <Link href="/leagues" className="text-turquoise-400 hover:text-turquoise-300 inline-flex items-center">
                    <FaArrowLeft className="mr-2" />
                    Back to Leagues
                </Link>

                {/* League Header */}
                <div className="card">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">{league.name}</h1>
                            {league.venue_name && (
                                <div className="flex items-center text-gray-400 mb-2">
                                    <FaMapMarkerAlt className="mr-2" />
                                    <span>{league.venue_name}</span>
                                    {league.venue_address && <span className="ml-2">• {league.venue_address}</span>}
                                </div>
                            )}
                        </div>
                        <div className="mt-4 md:mt-0">
                            <div className={`px-4 py-2 rounded-lg ${league.is_public ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                {league.is_public ? 'Public League' : 'Private League'}
                            </div>
                        </div>
                    </div>

                    {/* League Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-700">
                        <div className="text-center">
                            <p className="text-gray-400 text-sm mb-1">Points per Win</p>
                            <p className="text-2xl font-bold text-white">{league.points_per_win || 3}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-gray-400 text-sm mb-1">Points per Tie</p>
                            <p className="text-2xl font-bold text-white">{league.points_per_tie || 1}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-gray-400 text-sm mb-1">Race to</p>
                            <p className="text-2xl font-bold text-white">{league.race_to_default || 13}</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-4 border-b border-gray-700">
                    <button
                        onClick={() => setActiveTab('standings')}
                        className={`px-4 py-3 font-medium transition-colors ${activeTab === 'standings'
                            ? 'text-turquoise-400 border-b-2 border-turquoise-400'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <FaTrophy className="inline mr-2" />
                        Standings
                    </button>
                    <button
                        onClick={() => setActiveTab('fixtures')}
                        className={`px-4 py-3 font-medium transition-colors ${activeTab === 'fixtures'
                            ? 'text-turquoise-400 border-b-2 border-turquoise-400'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <FaCalendar className="inline mr-2" />
                        Fixtures
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'standings' && (
                    <div className="card">
                        <h2 className="text-2xl font-bold text-white mb-6">Current Standings</h2>
                        {standings.length === 0 ? (
                            <p className="text-gray-400 text-center py-8">No standings available yet.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-700">
                                            <th className="text-left py-3 px-4 text-gray-400 font-medium">#</th>
                                            <th className="text-left py-3 px-4 text-gray-400 font-medium">Team</th>
                                            <th className="text-center py-3 px-4 text-gray-400 font-medium">MP</th>
                                            <th className="text-center py-3 px-4 text-gray-400 font-medium">W</th>
                                            <th className="text-center py-3 px-4 text-gray-400 font-medium">L</th>
                                            <th className="text-center py-3 px-4 text-gray-400 font-medium">FW</th>
                                            <th className="text-center py-3 px-4 text-gray-400 font-medium">FL</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {standings.map((team, index) => (
                                            <tr key={team.id} className="border-b border-gray-800 hover:bg-navy-800 transition-colors">
                                                <td className="py-3 px-4 text-gray-400">{index + 1}</td>
                                                <td className="py-3 px-4 text-white font-medium">{team.name}</td>
                                                <td className="py-3 px-4 text-center text-gray-300">{team.matches_played || 0}</td>
                                                <td className="py-3 px-4 text-center text-green-400">{team.wins || 0}</td>
                                                <td className="py-3 px-4 text-center text-red-400">{team.losses || 0}</td>
                                                <td className="py-3 px-4 text-center text-gray-300">{team.frames_won || 0}</td>
                                                <td className="py-3 px-4 text-center text-gray-300">{team.frames_lost || 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'fixtures' && (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-white mb-6">Fixtures & Results</h2>
                        {fixtures.length === 0 ? (
                            <p className="text-gray-400 text-center py-8">No fixtures scheduled yet.</p>
                        ) : (
                            fixtures.map((match) => (
                                <div key={match.id} className="card">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-white font-medium">{match.home_team_name}</span>
                                                <span className="text-2xl font-bold text-turquoise-400 mx-4">
                                                    {match.home_score ?? '-'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-white font-medium">{match.away_team_name}</span>
                                                <span className="text-2xl font-bold text-turquoise-400 mx-4">
                                                    {match.away_score ?? '-'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-4 md:mt-0 md:ml-6 text-right">
                                            <p className="text-gray-400 text-sm">
                                                {new Date(match.match_date).toLocaleDateString('en-US', {
                                                    weekday: 'short',
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                            {match.venue_name && (
                                                <p className="text-gray-500 text-xs mt-1">{match.venue_name}</p>
                                            )}
                                            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs ${match.status === 'completed'
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                {match.status === 'completed' ? 'Completed' : 'Scheduled'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
}
