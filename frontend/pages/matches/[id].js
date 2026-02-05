import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import api from '../../utils/api';

export default function MatchScoring() {
    const router = useRouter();
    const { id } = router.query;
    const [match, setMatch] = useState(null);
    const [homeScore, setHomeScore] = useState(0);
    const [awayScore, setAwayScore] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    useEffect(() => {
        if (id) {
            fetchMatch();
        }
    }, [id]);

    const fetchMatch = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/matches/${id}`);
            setMatch(response.data.match);

            // Pre-fill scores if they exist
            if (response.data.match.home_score !== null) {
                setHomeScore(response.data.match.home_score);
            }
            if (response.data.match.away_score !== null) {
                setAwayScore(response.data.match.away_score);
            }
        } catch (error) {
            console.error('Error fetching match:', error);
            alert('Failed to load match details');
        } finally {
            setLoading(false);
        }
    };

    const handleScoreChange = (team, value) => {
        const numValue = parseInt(value) || 0;
        const clampedValue = Math.max(0, Math.min(25, numValue)); // Clamp between 0-25

        if (team === 'home') {
            setHomeScore(clampedValue);
        } else {
            setAwayScore(clampedValue);
        }
    };

    const incrementScore = (team) => {
        if (team === 'home' && homeScore < 25) {
            setHomeScore(homeScore + 1);
        } else if (team === 'away' && awayScore < 25) {
            setAwayScore(awayScore + 1);
        }
    };

    const decrementScore = (team) => {
        if (team === 'home' && homeScore > 0) {
            setHomeScore(homeScore - 1);
        } else if (team === 'away' && awayScore > 0) {
            setAwayScore(awayScore - 1);
        }
    };

    const getWinner = () => {
        if (homeScore >= 13 && homeScore > awayScore) return match.home_team_id;
        if (awayScore >= 13 && awayScore > homeScore) return match.away_team_id;
        return null;
    };

    const handleSaveMatch = async () => {
        if (!user || user.role !== 'admin') {
            alert('Only admins can save match results');
            return;
        }

        const total = homeScore + awayScore;
        if (total !== 25) {
            if (!confirm(`Total frames is ${total}, not 25. Are you sure you want to save?`)) {
                return;
            }
        }

        if (homeScore < 13 && awayScore < 13) {
            alert('At least one team must reach 13 frames to win');
            return;
        }

        try {
            setSaving(true);

            const winner = getWinner();

            // Submit final result
            await api.post(`/matches/${id}/result`, {
                home_score: homeScore,
                away_score: awayScore,
                winner_team_id: winner
            });

            alert('Match result saved successfully!');
            router.push('/schedule');
        } catch (error) {
            console.error('Error saving match:', error);
            alert('Failed to save match result: ' + (error.response?.data?.error || error.message));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-turquoise-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-400">Loading match details...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!match) {
        return (
            <Layout>
                <div className="text-center py-12">
                    <p className="text-gray-400">Match not found</p>
                </div>
            </Layout>
        );
    }

    const winner = getWinner();
    const total = homeScore + awayScore;

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <button
                        onClick={() => router.back()}
                        className="text-turquoise-500 hover:text-turquoise-400 mb-4 flex items-center"
                    >
                        ← Back to Schedule
                    </button>
                    <h1 className="text-3xl font-bold text-white mb-2">Match Scoring</h1>
                    <p className="text-gray-400">
                        {new Date(match.match_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })} • {match.venue_name}
                    </p>
                </div>

                {/* Main Scoring Card */}
                <div className="card">
                    <div className="text-center mb-6">
                        <div className="inline-block bg-navy-700 px-4 py-2 rounded-lg">
                            <p className="text-gray-400 text-sm">25 Frames • First to 13 Wins</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                        {/* Home Team */}
                        <div className="text-center">
                            <div className="mb-4">
                                <div className="w-20 h-20 bg-gradient-to-br from-turquoise-500 to-turquoise-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                                    <span className="text-white font-bold text-2xl">
                                        {match.home_team_name?.substring(0, 2).toUpperCase() || 'HT'}
                                    </span>
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-1">{match.home_team_name}</h2>
                                {winner === match.home_team_id && (
                                    <div className="inline-block bg-green-500 bg-opacity-20 text-green-400 px-3 py-1 rounded-full text-sm font-semibold">
                                        🏆 WINNER
                                    </div>
                                )}
                            </div>

                            {/* Score Input */}
                            <div className="flex items-center justify-center space-x-3">
                                <button
                                    onClick={() => decrementScore('home')}
                                    className="w-12 h-12 bg-navy-700 hover:bg-navy-600 text-white rounded-lg font-bold text-xl transition-colors"
                                >
                                    −
                                </button>
                                <input
                                    type="number"
                                    min="0"
                                    max="25"
                                    value={homeScore}
                                    onChange={(e) => handleScoreChange('home', e.target.value)}
                                    className="w-24 h-16 bg-navy-700 text-white text-4xl font-bold text-center rounded-lg border-2 border-turquoise-500 focus:outline-none focus:border-turquoise-400"
                                />
                                <button
                                    onClick={() => incrementScore('home')}
                                    className="w-12 h-12 bg-navy-700 hover:bg-navy-600 text-white rounded-lg font-bold text-xl transition-colors"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* VS Divider */}
                        <div className="text-center">
                            <div className="text-5xl font-bold text-gray-600 mb-2">VS</div>
                            <div className="text-gray-400 text-sm">
                                Total: {total}/25 frames
                            </div>
                            {total === 25 && (
                                <div className="mt-2 text-green-400 text-sm">
                                    ✓ All frames entered
                                </div>
                            )}
                        </div>

                        {/* Away Team */}
                        <div className="text-center">
                            <div className="mb-4">
                                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                                    <span className="text-white font-bold text-2xl">
                                        {match.away_team_name?.substring(0, 2).toUpperCase() || 'AT'}
                                    </span>
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-1">{match.away_team_name}</h2>
                                {winner === match.away_team_id && (
                                    <div className="inline-block bg-green-500 bg-opacity-20 text-green-400 px-3 py-1 rounded-full text-sm font-semibold">
                                        🏆 WINNER
                                    </div>
                                )}
                            </div>

                            {/* Score Input */}
                            <div className="flex items-center justify-center space-x-3">
                                <button
                                    onClick={() => decrementScore('away')}
                                    className="w-12 h-12 bg-navy-700 hover:bg-navy-600 text-white rounded-lg font-bold text-xl transition-colors"
                                >
                                    −
                                </button>
                                <input
                                    type="number"
                                    min="0"
                                    max="25"
                                    value={awayScore}
                                    onChange={(e) => handleScoreChange('away', e.target.value)}
                                    className="w-24 h-16 bg-navy-700 text-white text-4xl font-bold text-center rounded-lg border-2 border-blue-500 focus:outline-none focus:border-blue-400"
                                />
                                <button
                                    onClick={() => incrementScore('away')}
                                    className="w-12 h-12 bg-navy-700 hover:bg-navy-600 text-white rounded-lg font-bold text-xl transition-colors"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Quick Score Buttons */}
                    <div className="mt-8 pt-6 border-t border-navy-700">
                        <p className="text-gray-400 text-sm text-center mb-3">Quick Score Presets</p>
                        <div className="flex justify-center space-x-2">
                            <button
                                onClick={() => { setHomeScore(13); setAwayScore(12); }}
                                className="px-4 py-2 bg-navy-700 hover:bg-navy-600 text-white rounded-lg text-sm transition-colors"
                            >
                                13-12
                            </button>
                            <button
                                onClick={() => { setHomeScore(13); setAwayScore(11); }}
                                className="px-4 py-2 bg-navy-700 hover:bg-navy-600 text-white rounded-lg text-sm transition-colors"
                            >
                                13-11
                            </button>
                            <button
                                onClick={() => { setHomeScore(13); setAwayScore(10); }}
                                className="px-4 py-2 bg-navy-700 hover:bg-navy-600 text-white rounded-lg text-sm transition-colors"
                            >
                                13-10
                            </button>
                            <button
                                onClick={() => { setHomeScore(0); setAwayScore(0); }}
                                className="px-4 py-2 bg-red-500 bg-opacity-20 hover:bg-opacity-30 text-red-400 rounded-lg text-sm transition-colors"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                {user && user.role === 'admin' && (
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => router.back()}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveMatch}
                            disabled={saving || (homeScore < 13 && awayScore < 13)}
                            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Saving...' : 'Save Match Result'}
                        </button>
                    </div>
                )}
            </div>
        </Layout>
    );
}
