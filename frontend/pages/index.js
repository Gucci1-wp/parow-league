import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Link from 'next/link';
import { matchesAPI, standingsAPI } from '../utils/api';

export default function Home() {
    const [upcomingMatches, setUpcomingMatches] = useState([]);
    const [topTeams, setTopTeams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [matchesRes, standingsRes] = await Promise.all([
                matchesAPI.getAll({ status: 'scheduled', limit: 5 }),
                standingsAPI.getByDivision(1),
            ]);

            setUpcomingMatches(matchesRes.data.matches.slice(0, 5));
            setTopTeams(standingsRes.data.standings.slice(0, 5));
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="space-y-8">
                {/* Hero Section */}
                <div className="bg-gradient-to-r from-turquoise-500 to-turquoise-600 rounded-lg p-8 text-white">
                    <h1 className="text-4xl font-bold mb-2">Welcome to Parow Social League</h1>
                    <p className="text-xl opacity-90">Summer League 2025 - Nicks Pool Lounge Parow</p>
                    <div className="mt-6 flex space-x-4">
                        <Link href="/schedule" className="bg-white text-turquoise-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                            View Schedule
                        </Link>
                        <Link href="/standings" className="bg-turquoise-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-turquoise-800 transition-colors">
                            View Standings
                        </Link>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="card text-center">
                        <div className="text-4xl font-bold text-turquoise-500">16</div>
                        <div className="text-gray-400 mt-2">Teams</div>
                    </div>
                    <div className="card text-center">
                        <div className="text-4xl font-bold text-turquoise-500">128</div>
                        <div className="text-gray-400 mt-2">Matches</div>
                    </div>
                    <div className="card text-center">
                        <div className="text-4xl font-bold text-turquoise-500">64</div>
                        <div className="text-gray-400 mt-2">Players</div>
                    </div>
                    <div className="card text-center">
                        <div className="text-4xl font-bold text-turquoise-500">12</div>
                        <div className="text-gray-400 mt-2">Rounds</div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Upcoming Matches */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-white">Upcoming Matches</h2>
                            <Link href="/schedule" className="text-turquoise-500 hover:text-turquoise-400 text-sm">
                                View All →
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {loading ? (
                                <div className="card text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-turquoise-500 mx-auto"></div>
                                </div>
                            ) : upcomingMatches.length === 0 ? (
                                <div className="card text-center py-8 text-gray-400">
                                    No upcoming matches
                                </div>
                            ) : (
                                upcomingMatches.map((match) => (
                                    <div key={match.id} className="card-hover">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="font-semibold text-white">{match.home_team_name}</p>
                                                <p className="text-sm text-gray-400">vs</p>
                                                <p className="font-semibold text-white">{match.away_team_name}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-400">Round {match.round}</p>
                                                <p className="text-sm text-turquoise-500">{match.match_time}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Top Teams */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-white">Top Teams</h2>
                            <Link href="/standings" className="text-turquoise-500 hover:text-turquoise-400 text-sm">
                                Full Standings →
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {loading ? (
                                <div className="card text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-turquoise-500 mx-auto"></div>
                                </div>
                            ) : (
                                topTeams.map((team, index) => (
                                    <div key={team.pos} className="card-hover">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${index === 0 ? 'bg-yellow-500 text-black' :
                                                    index === 1 ? 'bg-gray-400 text-black' :
                                                        index === 2 ? 'bg-turquoise-700 text-white' :
                                                            'bg-navy-700 text-white'
                                                    }`}>
                                                    {team.pos}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-white">{team.name}</p>
                                                    <p className="text-sm text-gray-400">
                                                        {team.win}W - {team.lose}L - {team.tie}T
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-turquoise-500">{team.pts}</p>
                                                <p className="text-xs text-gray-400">points</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Venue Info */}
                <div className="card">
                    <h2 className="text-2xl font-bold text-white mb-4">📍 Venue Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold text-turquoise-500 mb-2">Nicks Pool Lounge Parow</h3>
                            <p className="text-gray-300">Parow, Cape Town</p>
                            <p className="text-gray-300">Western Cape, South Africa</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-turquoise-500 mb-2">Match Times</h3>
                            <p className="text-gray-300">Sundays: 12:00 AM & 14:00 PM</p>
                            <p className="text-gray-300">Format: 25 Frames</p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
