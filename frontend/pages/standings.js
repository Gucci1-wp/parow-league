import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { standingsAPI } from '../utils/api';

export default function Standings() {
    const [standings, setStandings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStandings();
    }, []);

    const fetchStandings = async () => {
        try {
            setLoading(true);
            const response = await standingsAPI.getByDivision(1); // Division ID = 1
            setStandings(response.data.standings);
        } catch (error) {
            console.error('Error fetching standings:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Round-robin standings</h1>
                    <p className="text-gray-400">GROUP A</p>
                </div>

                {/* Standings Table */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-turquoise-500 mx-auto"></div>
                        <p className="text-gray-400 mt-4">Loading standings...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <div className="table-container">
                            <table className="table min-w-full">
                                <thead>
                                    <tr>
                                        <th className="text-left sticky left-0 bg-navy-800 z-10">POS</th>
                                        <th className="text-left sticky left-12 bg-navy-800 z-10">NAME</th>
                                        <th className="text-center">PLAYED</th>
                                        <th className="text-center">WIN</th>
                                        <th className="text-center">LOSE</th>
                                        <th className="text-center">WIN%</th>
                                        <th className="text-center">WS</th>
                                        <th className="text-center">LS</th>
                                        <th className="text-center">SD</th>
                                        <th className="text-center">RO</th>
                                        <th className="text-center">AVG</th>
                                        <th className="text-center font-bold bg-navy-700">PTS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {standings.map((team) => {
                                        const winPercentage = team.played > 0
                                            ? ((team.win / team.played) * 100).toFixed(1)
                                            : '0.0';

                                        return (
                                            <tr key={team.pos} className="hover:bg-navy-700 transition-colors">
                                                <td className="font-semibold sticky left-0 bg-navy-800">{team.pos}</td>
                                                <td className="font-semibold text-blue-400 hover:text-blue-300 cursor-pointer sticky left-12 bg-navy-800">
                                                    {team.name}
                                                </td>
                                                <td className="text-center">{team.played}</td>
                                                <td className="text-center text-green-400">{team.win}</td>
                                                <td className="text-center text-red-400">{team.lose}</td>
                                                <td className="text-center font-semibold text-turquoise-400">{winPercentage}%</td>
                                                <td className="text-center">{team.ws}</td>
                                                <td className="text-center">{team.ls}</td>
                                                <td className={`text-center font-semibold ${team.sd > 0 ? 'text-green-400' : team.sd < 0 ? 'text-red-400' : ''}`}>
                                                    {team.sd > 0 ? '+' : ''}{team.sd}
                                                </td>
                                                <td className="text-center">{team.ro}</td>
                                                <td className="text-center">{parseFloat(team.avg).toFixed(1)}</td>
                                                <td className="text-center font-bold text-turquoise-500 bg-navy-700 text-lg">{team.pts}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Legend */}
                <div className="bg-navy-800 rounded-lg p-4">
                    <h3 className="font-semibold text-white mb-3">Column Definitions</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                            <span className="font-semibold text-gray-300">POS:</span>
                            <span className="text-gray-400 ml-1">Position</span>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-300">PLAYED:</span>
                            <span className="text-gray-400 ml-1">Matches Played</span>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-300">WIN%:</span>
                            <span className="text-gray-400 ml-1">Win Percentage</span>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-300">WS:</span>
                            <span className="text-gray-400 ml-1">Frames Won</span>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-300">LS:</span>
                            <span className="text-gray-400 ml-1">Frames Lost</span>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-300">SD:</span>
                            <span className="text-gray-400 ml-1">Frame Difference</span>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-300">RO:</span>
                            <span className="text-gray-400 ml-1">Rounds Won</span>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-300">AVG:</span>
                            <span className="text-gray-400 ml-1">Avg Frames/Match</span>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-300">PTS:</span>
                            <span className="text-gray-400 ml-1">Total Points (3 per win)</span>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
