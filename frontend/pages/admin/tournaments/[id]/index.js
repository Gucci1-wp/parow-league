import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../../components/Layout';
import TournamentBracket from '../../../../components/TournamentBracket';
import TournamentFixtures from '../../../../components/TournamentFixtures';
import TournamentStandings from '../../../../components/TournamentStandings';
import api from '../../../../utils/api';
import { FaUsers, FaPlay, FaEdit, FaTrash, FaPlus, FaRandom, FaTimes, FaSitemap, FaListOl } from 'react-icons/fa';

export default function TournamentDashboard() {
    const router = useRouter();
    const { id } = router.query;
    const [tournament, setTournament] = useState(null);
    const [players, setPlayers] = useState([]);
    const [matches, setMatches] = useState([]);
    const [standings, setStandings] = useState([]);
    const [selectedPlayers, setSelectedPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddPlayers, setShowAddPlayers] = useState(false);
    const [activeTab, setActiveTab] = useState('participants');

    useEffect(() => {
        if (id) {
            fetchTournament();
            fetchLeaguePlayers();
            fetchMatches();
            fetchStandings();
        }
    }, [id]);

    useEffect(() => {
        // Update active tab based on query parameter
        if (router.query.tab) {
            setActiveTab(router.query.tab);
        }
    }, [router.query.tab]);

    const fetchTournament = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/tournaments/${id}`);
            setTournament(response.data.tournament);
        } catch (error) {
            console.error('Error fetching tournament:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMatches = async () => {
        try {
            const response = await api.get(`/tournaments/${id}/matches`);
            setMatches(response.data.matches || []);
        } catch (error) {
            console.error('Error fetching matches:', error);
        }
    };

    const fetchStandings = async () => {
        try {
            const response = await api.get(`/tournaments/${id}/standings`);
            setStandings(response.data.standings || []);
        } catch (error) {
            console.error('Error fetching standings:', error);
        }
    };

    const fetchLeaguePlayers = async () => {
        try {
            const tournamentResponse = await api.get(`/tournaments/${id}`);
            const league_id = tournamentResponse.data.tournament.league_id;

            const playersResponse = await api.get(`/players?league_id=${league_id}`);
            setPlayers(playersResponse.data.players || []);
        } catch (error) {
            console.error('Error fetching players:', error);
        }
    };

    const handleAddParticipants = async () => {
        if (selectedPlayers.length === 0) {
            alert('Please select at least one player');
            return;
        }

        try {
            await api.post(`/tournaments/${id}/participants`, {
                player_ids: selectedPlayers
            });

            setSelectedPlayers([]);
            setShowAddPlayers(false);
            fetchTournament();
        } catch (error) {
            console.error('Error adding participants:', error);
            alert(error.response?.data?.error || 'Failed to add participants');
        }
    };

    const handleRemoveParticipant = async (participantId) => {
        if (!confirm('Are you sure you want to remove this participant?')) {
            return;
        }

        try {
            await api.delete(`/tournaments/${id}/participants/${participantId}`);
            fetchTournament();
        } catch (error) {
            console.error('Error removing participant:', error);
            alert(error.response?.data?.error || 'Failed to remove participant');
        }
    };

    const handleShuffleSeeds = async () => {
        console.log('Shuffle seeds clicked');
        // Removed confirm to fix potential blocking issues
        // if (!confirm('Are you sure you want to shuffle the seeds?')) return;

        try {
            console.log('Sending shuffle request...');
            await api.post(`/tournaments/${id}/participants/shuffle`);
            console.log('Shuffle successful, refreshing...');
            await fetchTournament();
            // Force a small delay or reload if state doesn't update immediately
        } catch (error) {
            console.error('Error shuffling seeds:', error);
            if (error.response && error.response.status === 404) {
                alert('Error: Shuffle feature not found. Please restart backend.');
            } else {
                alert(error.response?.data?.error || 'Failed to shuffle seeds');
            }
        }
    };

    const [showScoreModal, setShowScoreModal] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [score1, setScore1] = useState(0);
    const [score2, setScore2] = useState(0);

    const getParticipantName = (participantId) => {
        if (!participantId) return 'TBD';
        const participant = tournament?.participants.find(p => p.id === participantId);
        return participant ? `${participant.first_name} ${participant.last_name}` : 'Unknown';
    };

    const handleInlineScoreUpdate = async (match, newP1Score, newP2Score) => {
        try {
            const frames = [];
            let frameNum = 1;
            for (let i = 0; i < newP1Score; i++) frames.push({ frame_number: frameNum++, winner_id: match.participant1_id });
            for (let i = 0; i < newP2Score; i++) frames.push({ frame_number: frameNum++, winner_id: match.participant2_id });

            await api.put(`/tournaments/${id}/matches/${match.id}/frames`, { frames });
            await fetchMatches();
            if (tournament.format === 'round-robin') await fetchStandings();
            if (newP1Score >= tournament.race_to || newP2Score >= tournament.race_to) await fetchTournament();
        } catch (error) {
            console.error('Update inline score error:', error);
            alert('Failed to update score');
        }
    };

    const handleScoreSubmit = async () => {
        if (!selectedMatch) return;

        try {
            // Generate frames based on score
            const frames = [];
            let frameNum = 1;

            // Add frames for player 1
            for (let i = 0; i < score1; i++) {
                frames.push({
                    frame_number: frameNum++,
                    winner_id: selectedMatch.participant1_id
                });
            }

            // Add frames for player 2
            for (let i = 0; i < score2; i++) {
                frames.push({
                    frame_number: frameNum++,
                    winner_id: selectedMatch.participant2_id
                });
            }

            await api.put(`/tournaments/${id}/matches/${selectedMatch.id}/frames`, { frames });

            // Refresh data
            await fetchMatches();
            await fetchStandings(); // Update standings too if round robin

            // Advance winner if finished (reload tournament to check status)
            if (score1 >= tournament.race_to || score2 >= tournament.race_to) {
                await fetchTournament();
            }

            setShowScoreModal(false);
        } catch (error) {
            console.error('Error updating match score:', error);
            alert('Failed to update score');
        }
    };

    const handleStartTournament = async () => {
        console.log('Start Tournament Function Called');

        if (!tournament.participants || tournament.participants.length < 2) {
            console.log('Validation failed: < 2 participants');
            alert('You need at least 2 participants to start the tournament');
            return;
        }

        // Confirm dialog removed for immediate action
        // if (!confirm(...)) return;

        console.log('Validation passed, sending request...');
        try {
            await api.post(`/tournaments/${id}/start`);
            await fetchTournament();
            await fetchMatches();
            await fetchStandings();
            setActiveTab(tournament.format === 'round-robin' ? 'standings' : 'bracket');
        } catch (error) {
            console.error('Error starting tournament:', error);
            alert(error.response?.data?.error || 'Failed to start tournament');
        }
    };

    const handleDeleteTournament = async () => {
        console.log('Delete button clicked');
        // Confirm dialog removed
        // if (!confirm(...)) return;

        try {
            console.log('Sending delete request...');
            await api.delete(`/tournaments/${id}`);
            console.log('Delete successful');
            // Force reload/navigation
            window.location.href = '/admin/tournaments';
        } catch (error) {
            console.error('Error deleting tournament:', error);
            if (error.response && error.response.status === 404) {
                alert('Error: Deletion failed. Please RESTART YOUR BACKEND SERVER terminal to apply recent updates.');
            } else {
                alert(error.response?.data?.error || 'Failed to delete tournament. Please restart backend server.');
            }
        }
    };

    const handleResetTournament = async () => {
        console.log('Reset button clicked');
        // Confirm dialog removed
        // if (!confirm(...)) return;

        try {
            console.log('Sending reset request...');
            await api.post(`/tournaments/${id}/reset`);
            console.log('Reset successful');

            // Reload page to ensure fresh data
            window.location.reload();
        } catch (error) {
            console.error('Error resetting tournament:', error);
            if (error.response && error.response.status === 404) {
                alert('Error: Reset feature not found. Please RESTART YOUR BACKEND SERVER terminal to apply the new code.');
            } else {
                alert(error.response?.data?.error || 'Failed to reset tournament. the Backend might need a restart.');
            }
        }
    };

    const togglePlayerSelection = (playerId) => {
        setSelectedPlayers(prev => {
            if (prev.includes(playerId)) {
                return prev.filter(id => id !== playerId);
            } else {
                return [...prev, playerId];
            }
        });
    };

    const getStatusBadge = (status) => {
        const badges = {
            'draft': 'bg-gray-500',
            'in-progress': 'bg-blue-500',
            'completed': 'bg-green-500'
        };
        switch (status) {
            case 'completed': return 'bg-green-600';
            case 'in-progress': return 'bg-blue-600';
            default: return 'bg-gray-600';
        }
    };

    if (loading) return <Layout><div className="text-white p-8 text-center">Loading...</div></Layout>;
    if (!tournament) return <Layout><div className="text-white p-8 text-center">Tournament not found</div></Layout>;

    const isDraft = tournament.status === 'draft';
    // Filter available players
    const availablePlayers = players.filter(p =>
        !tournament.participants.some(tp => tp.player_id === p.id)
        // Removed hardcoded search filter
    );

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="bg-gray-800 rounded-lg p-6 mb-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">

                            <div>
                                <h1 className="text-3xl font-bold text-white">{tournament.name}</h1>
                                <p className="text-gray-400 mt-1">{tournament.league_name}</p>
                            </div>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold text-white ${getStatusBadge(tournament.status)}`}>
                            {tournament.status.replace('-', ' ').toUpperCase()}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <p className="text-gray-400">Game Type</p>
                            <p className="text-white font-medium">{tournament.game_type}</p>
                        </div>
                        <div>
                            <p className="text-gray-400">Format</p>
                            <p className="text-white font-medium">{tournament.format}</p>
                        </div>
                        <div>
                            <p className="text-gray-400">Race To</p>
                            <p className="text-white font-medium">{tournament.race_to} frames</p>
                        </div>
                        <div>
                            <p className="text-gray-400">Participants</p>
                            <p className="text-white font-medium">{tournament.participants.length}</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-6">
                        {isDraft ? (
                            <button
                                onClick={handleStartTournament}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
                            >
                                <FaPlay /> Start Tournament
                            </button>
                        ) : (
                            <button
                                onClick={handleResetTournament}
                                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors border border-gray-600"
                            >
                                <FaTimes /> Reset Bracket
                            </button>
                        )}

                        <button
                            onClick={() => router.push(`/admin/tournaments/${id}/edit`)}
                            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors border border-gray-600"
                        >
                            <FaEdit /> Edit Settings
                        </button>

                        <button
                            onClick={handleDeleteTournament}
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <FaTrash /> Delete
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                    <div className="flex border-b border-gray-700">
                        <button
                            onClick={() => setActiveTab('participants')}
                            className={`px-6 py-4 font-medium transition-colors ${activeTab === 'participants'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-400 hover:text-white hover:bg-gray-750'
                                }`}
                        >
                            <FaUsers className="inline mr-2" />
                            Participants
                        </button>

                        {tournament.status !== 'draft' && (
                            <>
                                <button
                                    onClick={() => setActiveTab('bracket')}
                                    className={`px-6 py-4 font-medium transition-colors ${activeTab === 'bracket'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-750'
                                        }`}
                                >
                                    <FaSitemap className="inline mr-2" />
                                    {tournament.format === 'round-robin' ? 'Matches' : 'Bracket'}
                                </button>

                                {tournament.format === 'round-robin' && (
                                    <button
                                        onClick={() => setActiveTab('standings')}
                                        className={`px-6 py-4 font-medium transition-colors ${activeTab === 'standings'
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-400 hover:text-white hover:bg-gray-750'
                                            }`}
                                    >
                                        <FaListOl className="inline mr-2" />
                                        Standings
                                    </button>
                                )}
                            </>
                        )}
                    </div>

                    {/* Participants Tab */}
                    {activeTab === 'participants' && (
                        <div className="p-6">
                            {isDraft && (
                                <div className="mb-6 flex gap-3">
                                    <button
                                        onClick={() => setShowAddPlayers(!showAddPlayers)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
                                    >
                                        <FaPlus /> Add Players
                                    </button>
                                    {tournament.participants.length > 0 && (
                                        <button
                                            onClick={handleShuffleSeeds}
                                            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors border border-gray-600"
                                        >
                                            <FaRandom /> Shuffle Seeds
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Add Players Panel */}
                            {showAddPlayers && isDraft && (
                                <div className="bg-gray-900 rounded-lg p-6 mb-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-xl font-semibold text-white">Add Players</h3>
                                        <button
                                            onClick={() => setShowAddPlayers(false)}
                                            className="text-gray-400 hover:text-white"
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>

                                    <div className="max-h-64 overflow-y-auto mb-4">
                                        {availablePlayers.length === 0 ? (
                                            <p className="text-gray-400">No more players available in this league</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {availablePlayers.map(player => (
                                                    <label
                                                        key={player.id}
                                                        className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedPlayers.includes(player.id)}
                                                            onChange={() => togglePlayerSelection(player.id)}
                                                            className="w-5 h-5"
                                                        />
                                                        <span className="text-white">
                                                            {player.first_name} {player.last_name}
                                                        </span>
                                                        {player.team_name && (
                                                            <span className="text-gray-400 text-sm">({player.team_name})</span>
                                                        )}
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleAddParticipants}
                                        disabled={selectedPlayers.length === 0}
                                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                                    >
                                        Add {selectedPlayers.length} Player{selectedPlayers.length !== 1 ? 's' : ''}
                                    </button>
                                </div>
                            )}

                            {/* Participants List */}
                            {tournament.participants.length === 0 ? (
                                <div className="text-center py-12">
                                    <FaUsers className="text-6xl text-gray-600 mx-auto mb-4" />
                                    <p className="text-gray-400 text-lg">No participants yet</p>
                                    {isDraft && (
                                        <button
                                            onClick={() => setShowAddPlayers(true)}
                                            className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
                                        >
                                            Add Your First Participant
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {tournament.participants.map((participant, index) => (
                                        <div
                                            key={participant.id}
                                            className="bg-gray-900 rounded-lg p-4 flex justify-between items-center"
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-400 font-mono">#{participant.seed || index + 1}</span>
                                                    <span className="text-white font-medium">
                                                        {participant.first_name} {participant.last_name}
                                                    </span>
                                                </div>
                                                {participant.team_name && (
                                                    <p className="text-gray-400 text-sm mt-1">{participant.team_name}</p>
                                                )}
                                            </div>
                                            {isDraft && (
                                                <button
                                                    onClick={() => handleRemoveParticipant(participant.id)}
                                                    className="text-red-400 hover:text-red-300"
                                                >
                                                    <FaTimes />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Bracket Tab */}
                    {activeTab === 'bracket' && (
                        <div className="p-0 overflow-x-auto min-w-full">
                            {tournament.format === 'round-robin' ? (
                                <TournamentFixtures
                                    matches={matches}
                                    participants={tournament.participants}
                                    editable={true}
                                    onScoreUpdate={handleInlineScoreUpdate}
                                    onMatchClick={(match) => {
                                        if (match.status !== 'completed') {
                                            // Optional: Still allow modal open if needed, or rely on inline
                                            // TournamentFixtures handles inline scoring well.
                                        }
                                    }}
                                />
                            ) : (
                                <TournamentBracket
                                    tournamentId={id}
                                    matches={matches}
                                    participants={tournament.participants}
                                    editable={true}
                                    onScoreUpdate={handleInlineScoreUpdate}
                                    onMatchClick={(match) => {
                                        if (match.status !== 'completed' && match.status !== 'bye') {
                                            setSelectedMatch(match);
                                            setScore1(match.participant1_frames || 0);
                                            setScore2(match.participant2_frames || 0);
                                            setShowScoreModal(true);
                                        }
                                    }}
                                />
                            )}
                        </div>
                    )}

                    {/* Standings Tab */}
                    {activeTab === 'standings' && (
                        <div className="p-6">
                            <TournamentStandings standings={standings} />
                        </div>
                    )}
                </div>
            </div>

            {/* Score Update Modal */}
            {showScoreModal && selectedMatch && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full border border-gray-700 shadow-2xl">
                        <h3 className="text-2xl font-bold text-white mb-6 text-center">Update Score</h3>

                        <div className="flex justify-between items-center mb-8 gap-4">
                            {/* Player 1 */}
                            <div className="text-center flex-1">
                                <p className="text-gray-300 font-medium mb-3 truncate">
                                    {getParticipantName(selectedMatch.participant1_id)}
                                </p>
                                <div className="flex items-center justify-center gap-3">
                                    <button
                                        onClick={() => setScore1(Math.max(0, score1 - 1))}
                                        className="w-10 h-10 rounded-full bg-gray-700 text-white hover:bg-gray-600 flex items-center justify-center font-bold text-xl"
                                    >-</button>
                                    <span className="text-4xl font-bold text-white w-12 text-center">{score1}</span>
                                    <button
                                        onClick={() => setScore1(score1 + 1)}
                                        className="w-10 h-10 rounded-full bg-green-600 text-white hover:bg-green-500 flex items-center justify-center font-bold text-xl"
                                    >+</button>
                                </div>
                            </div>

                            <div className="text-gray-500 font-bold text-xl pt-6">VS</div>

                            {/* Player 2 */}
                            <div className="text-center flex-1">
                                <p className="text-gray-300 font-medium mb-3 truncate">
                                    {getParticipantName(selectedMatch.participant2_id)}
                                </p>
                                <div className="flex items-center justify-center gap-3">
                                    <button
                                        onClick={() => setScore2(Math.max(0, score2 - 1))}
                                        className="w-10 h-10 rounded-full bg-gray-700 text-white hover:bg-gray-600 flex items-center justify-center font-bold text-xl"
                                    >-</button>
                                    <span className="text-4xl font-bold text-white w-12 text-center">{score2}</span>
                                    <button
                                        onClick={() => setScore2(score2 + 1)}
                                        className="w-10 h-10 rounded-full bg-green-600 text-white hover:bg-green-500 flex items-center justify-center font-bold text-xl"
                                    >+</button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-700/50 p-4 rounded-lg mb-6 text-center">
                            <p className="text-gray-400 text-sm">Race to <span className="text-white font-bold">{tournament.race_to}</span></p>
                            {(score1 >= tournament.race_to || score2 >= tournament.race_to) && (
                                <p className="text-green-400 font-bold mt-2">
                                    Winner: {score1 >= tournament.race_to ? getParticipantName(selectedMatch.participant1_id) : getParticipantName(selectedMatch.participant2_id)}
                                </p>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowScoreModal(false)}
                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleScoreSubmit}
                                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold transition-colors"
                            >
                                Update Status
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
