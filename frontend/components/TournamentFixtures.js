import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaClock } from 'react-icons/fa';

/**
 * Internal component for Inline Score Input
 */
function ScoreInput({ value, onBlur, disabled }) {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    return (
        <input
            type="text"
            pattern="[0-9]*"
            className={`w-8 h-8 text-center font-bold text-sm rounded cursor-text focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors
                ${disabled ? 'bg-transparent text-slate-500 cursor-default' : 'bg-slate-800 text-white hover:bg-slate-700'}
                [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
            value={localValue}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^\d+$/.test(val)) {
                    setLocalValue(val);
                }
            }}
            onBlur={() => {
                if (localValue === '') {
                    setLocalValue(value);
                    return;
                }
                const val = parseInt(localValue);
                if (!isNaN(val) && val !== value) {
                    onBlur(val);
                }
            }}
            disabled={disabled}
        />
    );
}

export default function TournamentFixtures({ matches, participants, editable = false, onMatchClick, onScoreUpdate }) {
    if (!matches || matches.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No fixtures generated yet</p>
            </div>
        );
    }

    // Group matches by round
    const rounds = {};
    matches.forEach(match => {
        if (!rounds[match.round]) {
            rounds[match.round] = [];
        }
        rounds[match.round].push(match);
    });

    const roundNumbers = Object.keys(rounds).sort((a, b) => parseInt(a) - parseInt(b));

    const getParticipant = (participantId) => {
        if (!participantId) return null;
        return participants.find(p => p.id === participantId);
    };

    const isWinner = (match, participantId) => {
        return match.winner_id === participantId;
    };

    return (
        <div className="space-y-8 p-6">
            {roundNumbers.map((roundNum) => (
                <div key={roundNum} className="animate-fadeIn">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                        <span className="bg-blue-600 w-1 h-6 rounded-full"></span>
                        Round {roundNum}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rounds[roundNum].sort((a, b) => a.match_number - b.match_number).map((match) => {
                            const p1 = getParticipant(match.participant1_id);
                            const p2 = getParticipant(match.participant2_id);

                            // Handling for Byes: usually in RR we skip or show "Bye"
                            // If p1 or p2 matches are stored, show them.

                            const p1Name = p1 ? `${p1.first_name} ${p1.last_name}` : 'BYE';
                            const p2Name = p2 ? `${p2.first_name} ${p2.last_name}` : 'BYE';

                            return (
                                <div
                                    key={match.id}
                                    className={`bg-[#1e293b] rounded-lg border border-slate-700 overflow-hidden hover:border-blue-500/30 transition-all shadow-sm
                                        ${editable ? 'cursor-pointer hover:shadow-md' : ''}`}
                                    onClick={() => editable && onMatchClick && onMatchClick(match)}
                                >
                                    {/* Match Header */}
                                    <div className="bg-[#0f172a]/50 px-4 py-2 flex justify-between items-center border-b border-slate-700/50">
                                        <span className="text-xs font-mono text-slate-500">MATCH #{match.match_number}</span>
                                        {match.status === 'completed' && (
                                            <span className="text-[10px] font-bold text-green-500 bg-green-900/20 px-2 py-0.5 rounded">FINAL</span>
                                        )}
                                        {match.status === 'in-progress' && (
                                            <span className="text-[10px] font-bold text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded animate-pulse">LIVE</span>
                                        )}
                                    </div>

                                    {/* Participants */}
                                    <div className="p-3 space-y-2">
                                        {/* Player 1 */}
                                        <div className={`flex justify-between items-center p-2 rounded ${isWinner(match, match.participant1_id) ? 'bg-blue-900/20' : ''}`}>
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="text-xs font-mono text-slate-600 w-4 text-right">
                                                    {p1?.seed || '-'}
                                                </span>
                                                <span className={`font-medium truncate ${isWinner(match, match.participant1_id) ? 'text-white' : 'text-slate-300'}`}>
                                                    {p1Name}
                                                </span>
                                            </div>
                                            <div className="ml-2">
                                                {p1 && p2 ? (
                                                    <ScoreInput
                                                        value={match.participant1_frames || 0}
                                                        disabled={!editable}
                                                        onBlur={(val) => onScoreUpdate && onScoreUpdate(match, val, match.participant2_frames || 0)}
                                                    />
                                                ) : <span className="text-slate-600">-</span>}
                                            </div>
                                        </div>

                                        {/* Player 2 */}
                                        <div className={`flex justify-between items-center p-2 rounded ${isWinner(match, match.participant2_id) ? 'bg-blue-900/20' : ''}`}>
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="text-xs font-mono text-slate-600 w-4 text-right">
                                                    {p2?.seed || '-'}
                                                </span>
                                                <span className={`font-medium truncate ${isWinner(match, match.participant2_id) ? 'text-white' : 'text-slate-300'}`}>
                                                    {p2Name}
                                                </span>
                                            </div>
                                            <div className="ml-2">
                                                {p1 && p2 ? (
                                                    <ScoreInput
                                                        value={match.participant2_frames || 0}
                                                        disabled={!editable}
                                                        onBlur={(val) => onScoreUpdate && onScoreUpdate(match, match.participant1_frames || 0, val)}
                                                    />
                                                ) : <span className="text-slate-600">-</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
