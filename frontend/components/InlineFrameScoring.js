import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function InlineFrameScoring({ match, isExpanded, onToggle }) {
    const [frames, setFrames] = useState([]);
    const [homePlayers, setHomePlayers] = useState([]);
    const [awayPlayers, setAwayPlayers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isExpanded && frames.length === 0) {
            fetchData();
        }
    }, [isExpanded]);

    const fetchData = async () => {
        try {
            setLoading(true);

            const [homePlayersRes, awayPlayersRes, framesRes] = await Promise.all([
                api.get(`/frames/teams/${match.home_team_id}/players`),
                api.get(`/frames/teams/${match.away_team_id}/players`),
                api.get(`/frames/${match.id}/frames`)
            ]);

            setHomePlayers(homePlayersRes.data.players);
            setAwayPlayers(awayPlayersRes.data.players);

            // Initialize 25 frames
            const existingFrames = framesRes.data.frames;
            const initialFrames = Array.from({ length: 25 }, (_, i) => {
                const existing = existingFrames.find(f => f.frame_number === i + 1);

                let home_score = '';
                let away_score = '';

                if (existing && existing.winner_player_id) {
                    if (existing.winner_player_id === existing.home_player_id) {
                        home_score = 1;
                        away_score = 0;
                    } else if (existing.winner_player_id === existing.away_player_id) {
                        home_score = 0;
                        away_score = 1;
                    }
                }

                return existing ? { ...existing, home_score, away_score } : {
                    frame_number: i + 1,
                    home_player_id: null,
                    away_player_id: null,
                    winner_player_id: null,
                    home_score: '',
                    away_score: ''
                };
            });
            setFrames(initialFrames);
        } catch (error) {
            console.error('Error fetching frame data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFrameChange = (frameNumber, field, value) => {
        setFrames(prev => prev.map(f => {
            if (f.frame_number !== frameNumber) return f;

            let changes = {};

            if (field === 'home_player_id' || field === 'away_player_id') {
                const val = value === '' ? null : parseInt(value);
                changes[field] = val;
            } else if (field === 'home_score' || field === 'away_score') {
                // strict input validation: only allow '0' or '1' or empty
                if (value !== '' && value !== '0' && value !== '1') return f;

                changes[field] = value;

                // Auto-fill opponent score logic
                if (value === '1') {
                    changes[field === 'home_score' ? 'away_score' : 'home_score'] = '0';
                } else if (value === '0') {
                    changes[field === 'home_score' ? 'away_score' : 'home_score'] = '1';
                } else if (value === '') {
                    changes[field === 'home_score' ? 'away_score' : 'home_score'] = '';
                }
            } else {
                changes[field] = value;
            }

            return { ...f, ...changes };
        }));
    };

    const handleSave = async () => {
        try {
            // Validate scores and deduce winner
            const processedFrames = frames.map(f => {
                let winner_player_id = null;
                const hScore = parseInt(f.home_score);
                const aScore = parseInt(f.away_score);

                // Only set winner if both scores are valid numbers
                if (!isNaN(hScore) && !isNaN(aScore)) {
                    if (hScore > aScore) winner_player_id = f.home_player_id;
                    else if (aScore > hScore) winner_player_id = f.away_player_id;
                }

                return { ...f, winner_player_id };
            });

            // Filter out frames that are completely empty or partially filled but invalid for saving
            // We only want to save frames that have BOTH players selected. 
            // If scores are entered, they must be valid (this is handled by input logic, but good to check).
            // Frames with NO players selected are just ignored (not saved).

            const validFramesToSave = processedFrames.filter(f =>
                f.home_player_id && f.away_player_id
            );

            // Check if there are any frames with players but missing results? 
            // In a live match, you might set players before scores. 
            // So we SHOULD save frames even if scores/winner are null, provided players are set.

            if (validFramesToSave.length === 0) {
                alert('No frames to save. Please select players for at least one frame.');
                return;
            }

            setSaving(true);
            await api.post(`/frames/${match.id}/frames`, { frames: validFramesToSave });

            // Calculate how many are fully complete (have a winner)
            const completedCount = validFramesToSave.filter(f => f.winner_player_id).length;

            alert(`Successfully saved ${validFramesToSave.length} frames (${completedCount} completed results)!`);
            window.location.reload(); // Refresh to show updated scores
        } catch (error) {
            console.error('Error saving frames:', error);
            alert('Failed to save frame results: ' + (error.response?.data?.error || error.message));
        } finally {
            setSaving(false);
        }
    };

    // Get current user role
    const [userRole, setUserRole] = useState(null);
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const u = JSON.parse(userStr);
            setUserRole(u.role);
        }
    }, []);

    const canEdit = userRole === 'admin' || userRole === 'captain';

    if (!isExpanded) return null;

    if (loading) {
        return (
            <div className="px-4 py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-turquoise-500 mx-auto"></div>
                <p className="text-gray-400 mt-2 text-sm">Loading frames...</p>
            </div>
        );
    }

    return (
        <div className="px-4 pb-4 bg-navy-800">
            <div className="space-y-6">
                {[1, 2, 3, 4, 5].map(sessionNum => (
                    <div key={sessionNum}>
                        <div className="bg-navy-900/50 text-turquoise-500 font-bold text-xs uppercase tracking-wider py-2 px-3 rounded mb-2 border-l-4 border-turquoise-500">
                            Session {sessionNum}
                        </div>
                        <div className="space-y-1">
                            {frames
                                .filter(f => Math.ceil(f.frame_number / 5) === sessionNum)
                                .map((frame) => {
                                    const sessionFrames = frames.filter(f => Math.ceil(f.frame_number / 5) === sessionNum);
                                    const takenHomeIds = sessionFrames
                                        .filter(f => f.frame_number !== frame.frame_number && f.home_player_id)
                                        .map(f => f.home_player_id);
                                    const takenAwayIds = sessionFrames
                                        .filter(f => f.frame_number !== frame.frame_number && f.away_player_id)
                                        .map(f => f.away_player_id);

                                    return (
                                        <div key={frame.frame_number} className="grid grid-cols-12 gap-2 items-center py-2 border-b border-navy-700 text-sm hover:bg-navy-700/50 transition-colors rounded px-1">
                                            {/* Frame Number */}
                                            <div className="col-span-1 text-gray-400 font-semibold pl-2">
                                                {frame.frame_number}
                                            </div>

                                            {/* Home Player */}
                                            <div className="col-span-4">
                                                {canEdit ? (
                                                    <select
                                                        className="w-full bg-navy-900 border border-navy-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-turquoise-500"
                                                        value={frame.home_player_id || ''}
                                                        onChange={(e) => handleFrameChange(frame.frame_number, 'home_player_id', e.target.value)}
                                                    >
                                                        <option value="">Select Player</option>
                                                        {homePlayers.map(p => {
                                                            const isTaken = takenHomeIds.includes(p.id);
                                                            return (
                                                                <option key={p.id} value={p.id} disabled={isTaken} className={isTaken ? "text-gray-500 bg-navy-900" : ""}>
                                                                    {p.first_name} {p.last_name} {isTaken ? '(Selected)' : ''}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                ) : (
                                                    <div className="text-gray-300 pl-2">
                                                        {homePlayers.find(p => p.id === frame.home_player_id)
                                                            ? `${homePlayers.find(p => p.id === frame.home_player_id).first_name} ${homePlayers.find(p => p.id === frame.home_player_id).last_name}`
                                                            : '-'}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Home Score */}
                                            <div className="col-span-1 text-center">
                                                {canEdit ? (
                                                    <input
                                                        type="text"
                                                        maxLength="1"
                                                        value={frame.home_score !== undefined ? frame.home_score : ''}
                                                        onChange={(e) => handleFrameChange(frame.frame_number, 'home_score', e.target.value)}
                                                        className="w-8 bg-navy-700 text-white text-center text-xs px-1 py-1 rounded border border-navy-600 focus:border-turquoise-500 focus:outline-none"
                                                    />
                                                ) : (
                                                    <span className={`font-bold ${frame.home_score === 1 ? 'text-green-500' : 'text-gray-500'}`}>
                                                        {frame.home_score !== undefined ? frame.home_score : '-'}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Separator */}
                                            <div className="col-span-1 text-center text-gray-500 font-bold">-</div>

                                            {/* Away Score */}
                                            <div className="col-span-1 text-center">
                                                {canEdit ? (
                                                    <input
                                                        type="text"
                                                        maxLength="1"
                                                        value={frame.away_score !== undefined ? frame.away_score : ''}
                                                        onChange={(e) => handleFrameChange(frame.frame_number, 'away_score', e.target.value)}
                                                        className="w-8 bg-navy-700 text-white text-center text-xs px-1 py-1 rounded border border-navy-600 focus:border-turquoise-500 focus:outline-none"
                                                    />
                                                ) : (
                                                    <span className={`font-bold ${frame.away_score === 1 ? 'text-green-500' : 'text-gray-500'}`}>
                                                        {frame.away_score !== undefined ? frame.away_score : '-'}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Away Player */}
                                            <div className="col-span-4">
                                                {canEdit ? (
                                                    <select
                                                        value={frame.away_player_id || ''}
                                                        onChange={(e) => handleFrameChange(frame.frame_number, 'away_player_id', e.target.value)}
                                                        className="w-full bg-navy-700 text-white text-xs px-2 py-1 rounded border border-navy-600 focus:border-turquoise-500 focus:outline-none"
                                                    >
                                                        <option value="">Select Player</option>
                                                        {awayPlayers.map(p => {
                                                            if (takenAwayIds.includes(p.id)) return null;
                                                            return <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>;
                                                        })}
                                                    </select>
                                                ) : (
                                                    <div className="text-gray-300 pl-2">
                                                        {awayPlayers.find(p => p.id === frame.away_player_id)
                                                            ? `${awayPlayers.find(p => p.id === frame.away_player_id).first_name} ${awayPlayers.find(p => p.id === frame.away_player_id).last_name}`
                                                            : '-'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Save Button - Only for Admins/Captains */}
            {canEdit && (
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-turquoise-500 hover:bg-turquoise-600 text-white text-sm font-semibold rounded transition-colors disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save All Frames'}
                    </button>
                </div>
            )}
        </div>
    );
}
