import { useState } from 'react';

export default function StatsTable({ players }) {
    const [sortField, setSortField] = useState('frames_won');
    const [sortDirection, setSortDirection] = useState('desc');

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const sortedPlayers = [...players].sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];

        // Handle string comparison for names
        if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const SortIcon = ({ field }) => {
        if (sortField !== field) return <span className="text-gray-600 ml-1">↕</span>;
        return sortDirection === 'asc' ? <span className="text-turquoise-500 ml-1">↑</span> : <span className="text-turquoise-500 ml-1">↓</span>;
    };

    return (
        <div className="overflow-x-auto bg-navy-800 rounded-lg shadow-lg">
            <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-navy-900 text-xs uppercase font-semibold text-gray-300">
                    <tr>
                        <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('first_name')}>
                            Player <SortIcon field="first_name" />
                        </th>
                        <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('team_name')}>
                            Team <SortIcon field="team_name" />
                        </th>
                        <th className="px-6 py-4 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('frames_played')}>
                            MP <SortIcon field="frames_played" />
                        </th>
                        <th className="px-6 py-4 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('frames_won')}>
                            Won <SortIcon field="frames_won" />
                        </th>
                        <th className="px-6 py-4 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('frames_lost')}>
                            Lost <SortIcon field="frames_lost" />
                        </th>
                        <th className="px-6 py-4 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('frame_difference')}>
                            Diff <SortIcon field="frame_difference" />
                        </th>
                        <th className="px-6 py-4 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('win_percentage')}>
                            Win % <SortIcon field="win_percentage" />
                        </th>
                        <th className="px-6 py-4 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('current_streak')}>
                            Streak <SortIcon field="current_streak" />
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-navy-700">
                    {sortedPlayers.map((player, index) => (
                        <tr key={player.id} className="hover:bg-navy-700 transition-colors">
                            <td className="px-6 py-4 font-medium text-white">
                                {index + 1}. {player.first_name} {player.last_name}
                            </td>
                            <td className="px-6 py-4">
                                {player.team_name || '-'}
                            </td>
                            <td className="px-6 py-4 text-center">
                                {player.frames_played}
                            </td>
                            <td className="px-6 py-4 text-center text-green-400 font-bold">
                                {player.frames_won}
                            </td>
                            <td className="px-6 py-4 text-center text-red-400">
                                {player.frames_lost}
                            </td>
                            <td className="px-6 py-4 text-center font-bold">
                                {player.frame_difference > 0 ? `+${player.frame_difference}` : player.frame_difference}
                            </td>
                            <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="w-16 bg-navy-900 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-turquoise-500 h-full"
                                            style={{ width: `${player.win_percentage}%` }}
                                        ></div>
                                    </div>
                                    <span className="w-12 text-right">{player.win_percentage}%</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                                {player.current_streak > 0 && (
                                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-gradient-to-r from-orange-500 to-red-500 rounded-full">
                                        🔥 {player.current_streak}
                                    </span>
                                )}
                                {player.current_streak === 0 && <span className="text-gray-600">-</span>}
                            </td>
                        </tr>
                    ))}
                    {sortedPlayers.length === 0 && (
                        <tr>
                            <td colspan="8" className="px-6 py-8 text-center text-gray-500">
                                No statistics available yet. Play some matches!
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
