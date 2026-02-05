import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function FrameScoring({ match, onClose, onSave }) {
    const [homeLineup, setHomeLineup] = useState([]);
    const [awayLineup, setAwayLineup] = useState([]);
    const [homePlayers, setHomePlayers] = useState([]);
    const [awayPlayers, setAwayPlayers] = useState([]);
    const [frames, setFrames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, [match.id]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch team players
            const [homePlayersRes, awayPlayersRes, lineupRes, framesRes] = await Promise.all([
                api.get(`/frames/teams/${match.home_team_id}/players`),
                api.get(`/frames/teams/${match.away_team_id}/players`),
                api.get(`/frames/${match.id}/lineup`),
                api.get(`/frames/${match.id}/frames`)
            ]);

            setHomePlayers(homePlayersRes.data.players);
            setAwayPlayers(awayPlayersRes.data.players);

            // Process lineup
            const lineup = lineupRes.data.lineup;
            setHomeLineup(lineup.filter(p => p.team_id === match.home_team_id));
            setAwayLineup(lineup.filter(p => p.team_id === match.away_team_id));

            // Initialize frames (25 frames)
            const existingFrames = framesRes.data.frames;
            const initialFrames = Array.from({ length: 25 }, (_, i) => {
                const existing = existingFrames.find(f => f.frame_number === i + 1);
                return existing || {
                    frame_number: i + 1,
                    home_player_id: null,
                    away_player_id: null,
                    winner_player_id: null
                };
            });
            setFrames(initialFrames);
        } catch (error) {
            console.error('Error fetching frame data:', error);
            alert('Failed to load frame data');
        } finally {
            setLoading(false);
        }
    };

    const handleFrameChange = (frameNumber, field, value) => {
        setFrames(prev => prev.map(f =>
            f.frame_number === frameNumber
                ? { ...f, [field]: value === '' ? null : parseInt(value) }
                : f
        ));
    };

    const handleSave = async () => {
        try {
            // Validate all frames have players and winners
            const incompleteFrames = frames.filter(f =>
                !f.home_player_id || !f.away_player_id || !f.winner_player_id
            );

            if (incompleteFrames.length > 0) {
                alert(`Please complete all 25 frames. ${incompleteFrames.length} frames are incomplete.`);
                return;
            }

            setSaving(true);

            await api.post(`/frames/${match.id}/frames`, { frames });

            alert('Frame results saved successfully!');
            if (onSave) onSave();
            if (onClose) onClose();
        } catch (error) {
            console.error('Error saving frames:', error);
            alert('Failed to save frame results: ' + (error.response?.data?.error || error.message));
        } finally {
            setSaving(false);
        }
    };

    const getPlayerName = (playerId, players) => {
        const player = players.find(p => p.id === playerId);
        return player ? `${player.first_name} ${player.last_name}` : '';
    };

    const calculateScore = () => {
        const homeScore = frames.filter(f => f.winner_player_id && homePlayers.some(p => p.id === f.winner_player_id)).length;
        const awayScore = frames.filter(f => f.winner_player_id && awayPlayers.some(p => p.id === f.winner_player_id)).length;
        return { homeScore, awayScore };
    };

    const { homeScore, awayScore } = calculateScore();

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                <div className="bg-navy-800 rounded-lg p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-turquoise-500 mx-auto"></div>
                    <p className="text-gray-400 mt-4">Loading frame data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto p-4">
            <div className="bg-navy-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-navy-800 border-b border-navy-700 p-6 z-10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-white">Frame-by-Frame Scoring</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="text-center flex-1">
                            <h3 className="text-xl font-bold text-white">{match.home_team_name}</h3>
                            <p className="text-3xl font-bold text-turquoise-500 mt-2">{homeScore}</p>
                        </div>
                        <div className="text-gray-500 text-2xl mx-8">VS</div>
                        <div className="text-center flex-1">
                            <h3 className="text-xl font-bold text-white">{match.away_team_name}</h3>
                            <p className="text-3xl font-bold text-blue-500 mt-2">{awayScore}</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Frame Results */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4">Frame Results (25 Frames)</h3>
                        <div className="space-y-3">
                            {frames.map((frame) => (
                                <div key={frame.frame_number} className="bg-navy-700 rounded-lg p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                                        <div className="font-semibold text-white">
                                            Frame {frame.frame_number}
                                        </div>

                                        {/* Home Player */}
                                        <div>
                                            <select
                                                value={frame.home_player_id || ''}
                                                onChange={(e) => handleFrameChange(frame.frame_number, 'home_player_id', e.target.value)}
                                                className="input w-full text-sm"
                                            >
                                                <option value="">Select {match.home_team_name} Player</option>
                                                {homePlayers.map(p => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.first_name} {p.last_name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="text-center text-gray-500">vs</div>

                                        {/* Away Player */}
                                        <div>
                                            <select
                                                value={frame.away_player_id || ''}
                                                onChange={(e) => handleFrameChange(frame.frame_number, 'away_player_id', e.target.value)}
                                                className="input w-full text-sm"
                                            >
                                                <option value="">Select {match.away_team_name} Player</option>
                                                {awayPlayers.map(p => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.first_name} {p.last_name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Winner */}
                                        <div>
                                            <select
                                                value={frame.winner_player_id || ''}
                                                onChange={(e) => handleFrameChange(frame.frame_number, 'winner_player_id', e.target.value)}
                                                className="input w-full text-sm"
                                                disabled={!frame.home_player_id || !frame.away_player_id}
                                            >
                                                <option value="">Winner</option>
                                                {frame.home_player_id && (
                                                    <option value={frame.home_player_id}>
                                                        {getPlayerName(frame.home_player_id, homePlayers)} ✓
                                                    </option>
                                                )}
                                                {frame.away_player_id && (
                                                    <option value={frame.away_player_id}>
                                                        {getPlayerName(frame.away_player_id, awayPlayers)} ✓
                                                    </option>
                                                )}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 sticky bottom-0 bg-navy-800 pt-4 border-t border-navy-700">
                        <button onClick={onClose} className="btn-secondary">
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="btn-primary disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Frame Results'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
