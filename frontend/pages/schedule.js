import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import InlineFrameScoring from '../components/InlineFrameScoring';
import api from '../utils/api';
import { format, parseISO } from 'date-fns';

export default function Schedule() {
    const router = useRouter();
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRound, setSelectedRound] = useState('all'); // 'all', 1, 2
    const [expandedWeeks, setExpandedWeeks] = useState(new Set([0])); // First week expanded by default
    const [user, setUser] = useState(null);
    const [expandedMatches, setExpandedMatches] = useState(new Set()); // Track which matches have frames expanded

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    useEffect(() => {
        fetchMatches();
    }, []);

    const fetchMatches = async () => {
        try {
            setLoading(true);
            const response = await api.get('/matches');
            setMatches(response.data.matches || []);
        } catch (error) {
            console.error('Error fetching matches:', error);
        } finally {
            setLoading(false);
        }
    };

    // Group matches by date
    const groupMatchesByDate = () => {
        const grouped = {};
        matches.forEach(match => {
            // Filter by round if selected
            if (selectedRound !== 'all' && match.round !== selectedRound) {
                return;
            }

            const date = match.match_date;
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(match);
        });
        return grouped;
    };

    const toggleWeek = (index) => {
        const newExpanded = new Set(expandedWeeks);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedWeeks(newExpanded);
    };

    const expandAll = () => {
        setExpandedWeeks(new Set(sortedDates.map((_, i) => i)));
    };

    const collapseAll = () => {
        setExpandedWeeks(new Set());
    };

    const matchesByDate = groupMatchesByDate();
    const sortedDates = Object.keys(matchesByDate).sort();

    // Get round statistics
    const getRoundStats = () => {
        const stats = { 1: 0, 2: 0 };
        matches.forEach(match => {
            if (match.round === 1) stats[1]++;
            if (match.round === 2) stats[2]++;
        });
        return stats;
    };

    const roundStats = getRoundStats();

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Match Schedule</h1>
                    <p className="text-gray-400">Parow Social League - Every Sunday at Nick's Pool Lounge</p>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    {/* Round Filter */}
                    <div className="flex items-center space-x-2">
                        <span className="text-gray-400 text-sm">Filter by Round:</span>
                        <button
                            onClick={() => setSelectedRound('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedRound === 'all'
                                ? 'bg-turquoise-500 text-white'
                                : 'bg-navy-800 text-gray-300 hover:bg-navy-700'
                                }`}
                        >
                            All Rounds
                        </button>
                        <button
                            onClick={() => setSelectedRound(1)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedRound === 1
                                ? 'bg-turquoise-500 text-white'
                                : 'bg-navy-800 text-gray-300 hover:bg-navy-700'
                                }`}
                        >
                            Round 1 {roundStats[1] > 0 && <span className="text-xs ml-1">({roundStats[1]})</span>}
                        </button>
                        <button
                            onClick={() => setSelectedRound(2)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedRound === 2
                                ? 'bg-turquoise-500 text-white'
                                : 'bg-navy-800 text-gray-300 hover:bg-navy-700'
                                }`}
                        >
                            Round 2 {roundStats[2] > 0 && <span className="text-xs ml-1">({roundStats[2]})</span>}
                        </button>
                    </div>

                    {/* Expand/Collapse Controls */}
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={expandAll}
                            className="px-3 py-2 text-sm bg-navy-800 text-gray-300 rounded-lg hover:bg-navy-700 transition-colors"
                        >
                            Expand All
                        </button>
                        <button
                            onClick={collapseAll}
                            className="px-3 py-2 text-sm bg-navy-800 text-gray-300 rounded-lg hover:bg-navy-700 transition-colors"
                        >
                            Collapse All
                        </button>
                    </div>
                </div>

                {/* Matches Grouped by Week */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-turquoise-500 mx-auto"></div>
                        <p className="text-gray-400 mt-4">Loading matches...</p>
                    </div>
                ) : sortedDates.length === 0 ? (
                    <div className="card text-center py-12">
                        <div className="text-6xl mb-4">📅</div>
                        <h2 className="text-2xl font-bold text-white mb-2">No Matches Scheduled</h2>
                        <p className="text-gray-400">
                            {selectedRound !== 'all'
                                ? `No matches found for Round ${selectedRound}`
                                : 'Generate fixtures to create the match schedule'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sortedDates.map((date, weekIndex) => {
                            const weekMatches = matchesByDate[date];
                            const matchDate = parseISO(date);
                            const isUpcoming = new Date(date) >= new Date();
                            const isExpanded = expandedWeeks.has(weekIndex);

                            return (
                                <div key={date} className="card overflow-hidden">
                                    {/* Week Header - Clickable */}
                                    <button
                                        onClick={() => toggleWeek(weekIndex)}
                                        className={`w-full p-4 border-l-4 transition-all ${isUpcoming
                                            ? 'border-turquoise-500 bg-turquoise-500/5 hover:bg-turquoise-500/10'
                                            : 'border-gray-600 hover:bg-navy-700'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                {/* Expand/Collapse Icon */}
                                                <svg
                                                    className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>

                                                <div className="text-left">
                                                    <h2 className="text-lg font-bold text-white flex items-center">
                                                        {format(matchDate, 'EEEE, MMMM d, yyyy')}
                                                        {isUpcoming && weekIndex === 0 && (
                                                            <span className="ml-3 text-xs bg-turquoise-500 text-white px-2 py-1 rounded">
                                                                THIS WEEK
                                                            </span>
                                                        )}
                                                    </h2>
                                                    <p className="text-gray-400 text-sm mt-1">
                                                        {weekMatches.length} {weekMatches.length === 1 ? 'match' : 'matches'} •
                                                        Round {weekMatches[0]?.round || 1} •
                                                        {weekMatches[0]?.match_time ? format(new Date(`2000-01-01T${weekMatches[0].match_time}`), ' h:mm a') : ' 2:00 PM'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className="text-sm text-gray-400">
                                                    Week {weekIndex + 1}
                                                </div>
                                            </div>
                                        </div>
                                    </button>

                                    {/* Matches for this week - Collapsible */}
                                    {isExpanded && (
                                        <div className="p-4 pt-0 space-y-2">
                                            {weekMatches.map((match, index) => (
                                                <div
                                                    key={match.id}
                                                    className="bg-navy-700 rounded-lg p-4 hover:bg-navy-600 transition-colors"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        {/* Left Side Group */}
                                                        <div className="flex-1 flex items-center min-w-0">
                                                            {/* Match Number */}
                                                            <div className="w-12 text-center shrink-0">
                                                                <div className="w-8 h-8 bg-navy-800 rounded-full flex items-center justify-center text-gray-400 font-semibold text-sm">
                                                                    {index + 1}
                                                                </div>
                                                            </div>

                                                            {/* Home Team */}
                                                            <div className="flex-1 flex items-center space-x-3 min-w-0 overflow-hidden">
                                                                <div className="min-w-0">
                                                                    <div className="font-semibold text-white truncate text-right">{match.home_team_name || 'Home Team'}</div>
                                                                    {match.status === 'completed' && (
                                                                        <div className="text-xs text-gray-400 truncate text-right">
                                                                            {match.home_score > match.away_score ? '✓ Winner' : 'Lost'}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Center Score */}
                                                        <div className="px-6 shrink-0 z-10">
                                                            {match.status === 'completed' ? (
                                                                <div className="flex items-center space-x-3">
                                                                    <span className={`text-3xl font-bold ${match.home_score > match.away_score ? 'text-turquoise-500' : 'text-white'
                                                                        }`}>
                                                                        {match.home_score || 0}
                                                                    </span>
                                                                    <span className="text-gray-500 text-xl">-</span>
                                                                    <span className={`text-3xl font-bold ${match.away_score > match.home_score ? 'text-turquoise-500' : 'text-white'
                                                                        }`}>
                                                                        {match.away_score || 0}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <div className="text-gray-400 font-semibold text-xl">VS</div>
                                                            )}
                                                        </div>

                                                        {/* Right Side Group */}
                                                        <div className="flex-1 flex items-center justify-end min-w-0">
                                                            {/* Away Team */}
                                                            <div className="flex-1 flex items-center space-x-3 min-w-0 overflow-hidden text-left">
                                                                <div className="min-w-0">
                                                                    <div className="font-semibold text-white truncate">{match.away_team_name || 'Away Team'}</div>
                                                                    {match.status === 'completed' && (
                                                                        <div className="text-xs text-gray-400 truncate">
                                                                            {match.away_score > match.home_score ? '✓ Winner' : 'Lost'}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Status Badge */}
                                                            <div className="w-48 text-right flex items-center justify-end space-x-2 shrink-0">
                                                                {match.status === 'scheduled' && (
                                                                    <span className="text-xs bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full">
                                                                        Scheduled
                                                                    </span>
                                                                )}
                                                                {match.status === 'in_progress' && (
                                                                    <span className="text-xs bg-green-500/20 text-green-500 px-3 py-1 rounded-full">
                                                                        In Progress
                                                                    </span>
                                                                )}
                                                                {match.status === 'completed' && (
                                                                    <span className="text-xs bg-gray-500/20 text-gray-400 px-3 py-1 rounded-full">
                                                                        Completed
                                                                    </span>
                                                                )}

                                                                {/* Edit/Score Button */}
                                                                {user && user.role === 'admin' && (
                                                                    <>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation(); // prevent expansion
                                                                                setFrameScoringMatch(match);
                                                                            }}
                                                                            className="px-3 py-1 bg-turquoise-500 hover:bg-turquoise-600 text-white text-xs font-semibold rounded transition-colors"
                                                                        >
                                                                            Edit
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Dropdown Arrow for Frame Details */}
                                                    <button
                                                        onClick={() => {
                                                            const newExpanded = new Set(expandedMatches);
                                                            if (newExpanded.has(match.id)) {
                                                                newExpanded.delete(match.id);
                                                            } else {
                                                                newExpanded.add(match.id);
                                                            }
                                                            setExpandedMatches(newExpanded);
                                                        }}
                                                        className="mt-3 w-full flex items-center justify-center py-2 text-gray-400 hover:text-white transition-colors border-t border-navy-600"
                                                    >
                                                        <span className="text-xs mr-2">Individual Matches</span>
                                                        <svg
                                                            className={`w-4 h-4 transition-transform ${expandedMatches.has(match.id) ? 'rotate-180' : ''}`}
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </button>

                                                    {/* Inline Frame Scoring */}
                                                    <InlineFrameScoring
                                                        match={match}
                                                        isExpanded={expandedMatches.has(match.id)}
                                                        onToggle={() => {
                                                            const newExpanded = new Set(expandedMatches);
                                                            if (newExpanded.has(match.id)) {
                                                                newExpanded.delete(match.id);
                                                            } else {
                                                                newExpanded.add(match.id);
                                                            }
                                                            setExpandedMatches(newExpanded);
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Venue Info */}
                <div className="card">
                    <h3 className="font-semibold text-white mb-3 flex items-center">
                        <span className="text-2xl mr-2">📍</span>
                        Venue Information
                    </h3>
                    <div className="space-y-2 text-gray-300">
                        <p className="font-semibold text-white">Nick's Pool Lounge Parow</p>
                        <p className="text-sm">Parow, Cape Town, Western Cape</p>
                        <p className="text-sm text-gray-400">All matches played on Sundays at 2:00 PM</p>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
