import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import api from '../../utils/api';

export default function CreateTournament() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [leagues, setLeagues] = useState([]);
    const [teams, setTeams] = useState([]);
    const [selectedTeams, setSelectedTeams] = useState([]);
    const [formData, setFormData] = useState({
        name: 'Summer League 2025',
        start_date: '',
        rounds: 2,
        league_id: '', // League to generate fixtures for
        tournament_id: 1 // Assuming tournament ID 1 exists
    });
    const [generatedFixtures, setGeneratedFixtures] = useState(null);

    useEffect(() => {
        fetchLeagues();
        fetchTeams();
        // Set default start date to next Sunday
        const nextSunday = getNextSunday();
        setFormData(prev => ({ ...prev, start_date: nextSunday }));
    }, []);

    const fetchLeagues = async () => {
        try {
            const response = await api.get('/leagues');
            const leaguesList = response.data.leagues || [];
            setLeagues(leaguesList);
            // Auto-select first league if available
            if (leaguesList.length > 0 && !formData.league_id) {
                setFormData(prev => ({ ...prev, league_id: leaguesList[0].id }));
            }
        } catch (error) {
            console.error('Error fetching leagues:', error);
        }
    };

    const getNextSunday = () => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
        const nextSunday = new Date(today);
        nextSunday.setDate(today.getDate() + daysUntilSunday);
        return nextSunday.toISOString().split('T')[0];
    };

    const fetchTeams = async () => {
        try {
            const response = await api.get('/teams');
            setTeams(response.data.teams || []);
        } catch (error) {
            console.error('Error fetching teams:', error);
        }
    };

    const toggleTeamSelection = (teamId) => {
        setSelectedTeams(prev => {
            if (prev.includes(teamId)) {
                return prev.filter(id => id !== teamId);
            } else {
                return [...prev, teamId];
            }
        });
    };

    const selectAllTeams = () => {
        if (selectedTeams.length === teams.length) {
            setSelectedTeams([]);
        } else {
            setSelectedTeams(teams.map(t => t.id));
        }
    };

    const handleGenerateFixtures = async () => {
        console.log('--- handleGenerateFixtures called ---');
        console.log('selectedTeams:', selectedTeams);
        console.log('formData:', formData);

        if (!formData.league_id) {
            alert('Please select a league');
            return;
        }

        if (selectedTeams.length < 2) {
            alert('Please select at least 2 teams');
            return;
        }

        try {
            setLoading(true);
            const response = await api.post('/matches/generate-fixtures', {
                tournament_id: formData.tournament_id,
                team_ids: selectedTeams,
                start_date: formData.start_date,
                rounds: formData.rounds
            });

            setGeneratedFixtures(response.data);
            alert(`Successfully generated ${response.data.matches.length} fixtures over ${response.data.total_weeks} weeks!`);

            // Redirect to schedule page after 2 seconds
            setTimeout(() => {
                router.push('/schedule');
            }, 2000);
        } catch (error) {
            console.error('Error generating fixtures:', error);
            alert('Failed to generate fixtures: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="space-y-6">
                {/* Loading Overlay */}
                {loading && (
                    <div className="fixed inset-0 bg-navy-900/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
                        <div className="w-16 h-16 border-4 border-turquoise-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <h2 className="text-xl font-bold text-white">Generating Fixtures...</h2>
                        <p className="text-gray-400 mt-2">Creating {selectedTeams.length} matches and scheduling them on Sundays.</p>
                        <p className="text-gray-500 text-sm mt-1">This may take a few seconds.</p>
                    </div>
                )}

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Generate Tournament Fixtures</h1>
                    <p className="text-gray-400">Create round-robin fixtures for the league</p>
                </div>

                {/* Configuration */}
                <div className="card">
                    <h2 className="text-xl font-bold text-white mb-4">Tournament Settings</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">League *</label>
                            <select
                                value={formData.league_id}
                                onChange={(e) => setFormData({ ...formData, league_id: parseInt(e.target.value) })}
                                className="input w-full"
                                required
                            >
                                <option value="">Select League</option>
                                {leagues.map((league) => (
                                    <option key={league.id} value={league.id}>
                                        {league.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">Start Date (Sunday)</label>
                            <input
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                className="input w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">Number of Rounds</label>
                            <select
                                value={formData.rounds}
                                onChange={(e) => setFormData({ ...formData, rounds: parseInt(e.target.value) })}
                                className="input w-full"
                            >
                                <option value={1}>1 Round</option>
                                <option value={2}>2 Rounds</option>
                                <option value={3}>3 Rounds</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2 text-sm">Venue</label>
                            <input
                                type="text"
                                value="Nick's Pool Lounge Parow"
                                disabled
                                className="input w-full opacity-60"
                            />
                        </div>
                    </div>
                </div>

                {/* Team Selection */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-white">
                            Select Teams ({selectedTeams.length}/{teams.length})
                        </h2>
                        <button
                            onClick={selectAllTeams}
                            className="btn-secondary text-sm"
                        >
                            {selectedTeams.length === teams.length ? 'Deselect All' : 'Select All'}
                        </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {teams.map((team) => (
                            <div
                                key={team.id}
                                onClick={() => toggleTeamSelection(team.id)}
                                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedTeams.includes(team.id)
                                    ? 'border-turquoise-500 bg-turquoise-500/10'
                                    : 'border-[#2a3441] hover:border-turquoise-500/50'
                                    }`}
                            >
                                <div className="flex items-center space-x-2">
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedTeams.includes(team.id)
                                        ? 'border-turquoise-500 bg-turquoise-500'
                                        : 'border-gray-500'
                                        }`}>
                                        {selectedTeams.includes(team.id) && (
                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <span className="text-sm text-white font-medium truncate">{team.name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Generate Button */}
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={() => router.push('/tournaments')}
                        className="btn-secondary"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleGenerateFixtures}
                        disabled={loading || selectedTeams.length < 2}
                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Generating...' : `Generate Fixtures (${selectedTeams.length} teams)`}
                    </button>
                </div>

                {/* Preview */}
                {generatedFixtures && (
                    <div className="card">
                        <h2 className="text-xl font-bold text-white mb-4">✅ Fixtures Generated!</h2>
                        <div className="space-y-2 text-gray-300">
                            <p>• Total Matches: <span className="text-white font-semibold">{generatedFixtures.matches.length}</span></p>
                            <p>• Total Weeks: <span className="text-white font-semibold">{generatedFixtures.total_weeks}</span></p>
                            <p>• Format: <span className="text-white font-semibold">Round-Robin ({formData.rounds} rounds)</span></p>
                            <p>• Match Format: <span className="text-white font-semibold">25 frames, first to 13 wins</span></p>
                            <p className="text-turquoise-500 mt-4">Redirecting to schedule...</p>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
