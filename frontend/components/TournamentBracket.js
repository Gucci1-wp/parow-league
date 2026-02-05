import React, { useState, useEffect, useRef } from 'react';
import { FaSearchPlus, FaSearchMinus, FaExpand, FaCompress, FaArrowsAltH } from 'react-icons/fa';

/**
 * Internal component for Inline Score Input
 */
function ScoreInput({ value, onBlur, disabled }) {
    const [localValue, setLocalValue] = useState(value);

    // Sync if external value changes (e.g. from API refresh)
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    return (
        <input
            type="number"
            min="0"
            className={`w-8 h-8 text-center font-bold text-sm rounded cursor-text focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors
                ${disabled ? 'bg-transparent text-slate-500 cursor-default' : 'bg-slate-800 text-white hover:bg-slate-700'}
                [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
            value={localValue}
            onClick={(e) => e.stopPropagation()} // Prevent modal opening
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={() => {
                const val = parseInt(localValue);
                if (!isNaN(val) && val !== value) {
                    onBlur(val);
                } else if (isNaN(val) || localValue === '') {
                    setLocalValue(value); // Reset on invalid
                }
            }}
            disabled={disabled}
        />
    );
}

export default function TournamentBracket({ tournamentId, matches, participants, editable = false, onMatchClick, onScoreUpdate }) {
    const [scale, setScale] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef(null);
    const contentRef = useRef(null);

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 2));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.4));

    const handleFitScreen = () => {
        if (containerRef.current && contentRef.current) {
            const containerWidth = containerRef.current.clientWidth;
            const contentWidth = contentRef.current.scrollWidth;
            // Add some padding buffer
            const newScale = Math.min((containerWidth - 64) / contentWidth, 1);
            setScale(Math.max(newScale, 0.4)); // Don't go too tiny
        }
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
        if (!isFullscreen) {
            // Entering fullscreen, maybe wait for render to fit?
            setTimeout(() => handleFitScreen(), 100);
        }
    };

    // Handle Esc key to exit fullscreen
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isFullscreen) {
                toggleFullscreen();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen]);

    if (!matches || matches.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-900/50 rounded-xl border border-gray-700/50 backdrop-blur-sm">
                <p className="text-gray-400 text-lg">Bracket will be generated when tournament starts</p>
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
        <div
            ref={containerRef}
            className={`transition-all duration-300 flex flex-col
                ${isFullscreen
                    ? 'fixed inset-0 z-50 bg-[#0f172a] w-screen h-screen overflow-hidden'
                    : 'bg-[#0f172a] rounded-xl border border-gray-800 shadow-2xl min-h-[600px] overflow-hidden'
                }`}
        >
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20 backdrop-blur-md z-20">
                <div className="flex items-center gap-2">
                    <button onClick={handleZoomOut} className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white" title="Zoom Out">
                        <FaSearchMinus />
                    </button>
                    <span className="text-xs font-mono text-white/50 w-12 text-center">{Math.round(scale * 100)}%</span>
                    <button onClick={handleZoomIn} className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white" title="Zoom In">
                        <FaSearchPlus />
                    </button>
                    <div className="w-[1px] h-6 bg-white/10 mx-2"></div>
                    <button onClick={handleFitScreen} className="px-3 py-1.5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white text-xs font-medium flex items-center gap-2 border border-white/5">
                        <FaArrowsAltH /> Fit Width
                    </button>
                </div>
                <button
                    onClick={toggleFullscreen}
                    className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors
                        ${isFullscreen ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-900/50' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                >
                    {isFullscreen ? <><FaCompress /> Exit Full Screen</> : <><FaExpand /> Full Screen</>}
                </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-auto p-8 scrollbar-thin scrollbar-thumb-gray-700 relative cursor-grab active:cursor-grabbing">
                <div
                    ref={contentRef}
                    className="min-w-max origin-top-left transition-transform duration-200 ease-out"
                    style={{
                        transform: `scale(${scale})`
                    }}
                >
                    <div className="flex gap-8">
                        {roundNumbers.map((roundNum, roundIndex) => (
                            <div key={roundNum} className="flex flex-col gap-8 relative min-w-[240px]">
                                {/* Round Header */}
                                <div className="text-center mb-4">
                                    <h3 className="text-blue-400 font-bold uppercase text-xs tracking-[0.2em] px-3 py-1 bg-blue-900/20 rounded-full inline-block border border-blue-900/50">
                                        {rounds[roundNum].length === 1 ? 'Finals' :
                                            rounds[roundNum].length === 2 ? 'Semi-Finals' :
                                                `Round ${roundNum}`}
                                    </h3>
                                </div>

                                {/* Matches */}
                                <div className="flex flex-col justify-around h-full gap-8">
                                    {rounds[roundNum].sort((a, b) => a.match_number - b.match_number).map((match, matchIndex) => {
                                        const p1 = getParticipant(match.participant1_id);
                                        const p2 = getParticipant(match.participant2_id);

                                        // Determine if TBD should be "BYE"
                                        const isByeMatch = (match.status === 'completed' || match.status === 'bye') && (!p1 || !p2);

                                        const p1Name = p1 ? `${p1.first_name} ${p1.last_name}` : (isByeMatch ? 'BYE' : 'TBD');
                                        const p2Name = p2 ? `${p2.first_name} ${p2.last_name}` : (isByeMatch ? 'BYE' : 'TBD');

                                        return (
                                            <div
                                                key={match.id}
                                                className={`relative z-10 w-full group ${editable ? 'cursor-pointer' : ''}`}
                                                onClick={() => editable && onMatchClick && onMatchClick(match)}
                                            >
                                                {/* Match Card Info */}
                                                <div className="flex justify-between text-[10px] text-gray-500 mb-2 px-1 font-medium tracking-wide">
                                                    <span>MATCH #{match.match_number}</span>
                                                    {match.status === 'in-progress' && <span className="text-blue-400 font-bold animate-pulse">LIVE NOW</span>}
                                                </div>

                                                {/* Main Card */}
                                                <div className={`bg-[#1e293b] rounded-lg border border-slate-700 overflow-hidden shadow-lg transition-all duration-300 ${editable ? 'hover:border-blue-500/50 hover:shadow-blue-500/10 hover:translate-y-[-2px]' : ''}`}>

                                                    {/* Player 1 Row */}
                                                    <div className={`flex items-center justify-between h-12 px-4 relative transition-colors ${isWinner(match, match.participant1_id) ? 'bg-blue-900/20' : ''}`}>
                                                        {/* Active Indicator Bar */}
                                                        {isWinner(match, match.participant1_id) && (
                                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                                        )}

                                                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                                                            <span className="text-xs text-slate-500 font-mono w-5 shrink-0 text-right opacity-60">
                                                                {p1?.seed || '-'}
                                                            </span>
                                                            <span className={`text-sm font-semibold truncate tracking-tight ${isWinner(match, match.participant1_id) ? 'text-white' : 'text-slate-300'}`}>
                                                                {p1Name === 'BYE' ? <span className="italic opacity-50 block w-full">{p1Name}</span> : p1Name}
                                                            </span>
                                                        </div>

                                                        <div className="ml-2 shrink-0">
                                                            {p1 ? (
                                                                <ScoreInput
                                                                    value={match.participant1_frames || 0}
                                                                    disabled={!editable || !p2}
                                                                    onBlur={(newScore) => {
                                                                        if (onScoreUpdate) {
                                                                            onScoreUpdate(match, newScore, match.participant2_frames || 0);
                                                                        }
                                                                    }}
                                                                />
                                                            ) : <div className="w-8"></div>}
                                                        </div>
                                                    </div>

                                                    {/* Divider */}
                                                    <div className="h-[1px] bg-slate-700/50 w-full"></div>

                                                    {/* Player 2 Row */}
                                                    <div className={`flex items-center justify-between h-12 px-4 relative transition-colors ${isWinner(match, match.participant2_id) ? 'bg-blue-900/20' : ''}`}>
                                                        {/* Active Indicator Bar */}
                                                        {isWinner(match, match.participant2_id) && (
                                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                                        )}

                                                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                                                            <span className="text-xs text-slate-500 font-mono w-5 shrink-0 text-right opacity-60">
                                                                {p2?.seed || '-'}
                                                            </span>
                                                            <span className={`text-sm font-semibold truncate tracking-tight ${isWinner(match, match.participant2_id) ? 'text-white' : 'text-slate-300'}`}>
                                                                {p2Name === 'BYE' ? <span className="italic opacity-50 block w-full">{p2Name}</span> : p2Name}
                                                            </span>
                                                        </div>

                                                        <div className="ml-2 shrink-0">
                                                            {p2 ? (
                                                                <ScoreInput
                                                                    value={match.participant2_frames || 0}
                                                                    disabled={!editable || !p1}
                                                                    onBlur={(newScore) => {
                                                                        if (onScoreUpdate) {
                                                                            onScoreUpdate(match, match.participant1_frames || 0, newScore);
                                                                        }
                                                                    }}
                                                                />
                                                            ) : <div className="w-8"></div>}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Connector Lines */}
                                                {roundIndex < roundNumbers.length - 1 && (
                                                    <div className="absolute top-1/2 -right-8 w-8 h-[2px] bg-slate-700 z-0"></div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
