export default function TournamentStandings({ standings }) {
    if (!standings || standings.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-400">No standings available yet</p>
            </div>
        );
    }



    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-900">
                    <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Rank</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Player</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">MP</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">W</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">L</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Frames W</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Frames L</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">+/-</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Pts</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">PR</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {standings.map((standing, index) => (
                        <tr
                            key={standing.id}
                            className={`hover:bg-gray-750 transition-colors ${index < 3 ? 'bg-gray-800' : ''
                                }`}
                        >
                            <td className="px-6 py-4 text-center font-bold text-gray-400 text-lg">
                                {standing.rank || index + 1}
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <div>
                                        <p className="text-white font-medium">
                                            {standing.first_name} {standing.last_name}
                                        </p>
                                        {standing.team_name && (
                                            <p className="text-gray-400 text-sm">{standing.team_name}</p>
                                        )}
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-center text-gray-300">{standing.matches_played}</td>
                            <td className="px-6 py-4 text-center text-green-400 font-semibold">{standing.wins}</td>
                            <td className="px-6 py-4 text-center text-red-400 font-semibold">{standing.losses}</td>
                            <td className="px-6 py-4 text-center text-gray-300">{standing.frames_won}</td>
                            <td className="px-6 py-4 text-center text-gray-300">{standing.frames_lost}</td>
                            <td className="px-6 py-4 text-center">
                                <span className={`font-semibold ${standing.frame_difference > 0 ? 'text-green-400' :
                                    standing.frame_difference < 0 ? 'text-red-400' :
                                        'text-gray-400'
                                    }`}>
                                    {standing.frame_difference > 0 ? '+' : ''}{standing.frame_difference}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-yellow-500 text-lg">
                                {standing.wins * 3}
                            </td>
                            <td className="px-6 py-4 text-center text-gray-300">
                                {standing.matches_played > 0
                                    ? Math.round((standing.wins / standing.matches_played) * 100) + '%'
                                    : '0%'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
