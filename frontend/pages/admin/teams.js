import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { FaFilter } from 'react-icons/fa';

export default function AdminTeams() {
    const [teams, setTeams] = useState([]);
    const [leagues, setLeagues] = useState([]);
    const [selectedLeague, setSelectedLeague] = useState('');
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingTeam, setEditingTeam] = useState(null);
    const [formData, setFormData] = useState({ name: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [teamsRes, leaguesRes] = await Promise.all([
                api.get('/admin/teams'),
                api.get('/leagues')
            ]);
            setTeams(teamsRes.data.teams);
            setLeagues(leaguesRes.data.leagues || []);

            // Auto-select first league
            if (leaguesRes.data.leagues && leaguesRes.data.leagues.length > 0) {
                setSelectedLeague(leaguesRes.data.leagues[0].id);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const fetchTeams = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/teams');
            setTeams(response.data.teams);
        } catch (error) {
            console.error('Error fetching teams:', error);
            alert('Failed to load teams');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingTeam) {
                await api.put(`/admin/teams/${editingTeam.id}`, formData);
                alert('Team updated successfully!');
            } else {
                await api.post('/admin/teams', formData);
                alert('Team created successfully!');
            }
            setShowForm(false);
            setEditingTeam(null);
            setFormData({ name: '' });
            fetchTeams();
        } catch (error) {
            console.error('Error saving team:', error);
            alert('Failed to save team');
        }
    };

    const handleEdit = (team) => {
        setEditingTeam(team);
        setFormData({ name: team.name });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this team?')) return;

        try {
            await api.delete(`/admin/teams/${id}`);
            alert('Team deleted successfully!');
            fetchTeams();
        } catch (error) {
            console.error('Error deleting team:', error);
            alert('Failed to delete team');
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingTeam(null);
        setFormData({ name: '' });
    };

    // Filter teams by selected league
    const filteredTeams = selectedLeague
        ? teams.filter(team => team.league_id === selectedLeague)
        : teams;

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-white">Manage Teams</h1>
                    {!showForm && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="btn-primary"
                        >
                            + Add New Team
                        </button>
                    )}
                </div>

                {/* League Filter */}
                <div className="card">
                    <div className="flex items-center space-x-4">
                        <FaFilter className="text-turquoise-400" />
                        <div className="flex-1">
                            <label className="block text-gray-300 mb-2 text-sm">Filter by League</label>
                            <select
                                value={selectedLeague}
                                onChange={(e) => setSelectedLeague(parseInt(e.target.value))}
                                className="input w-full md:w-96"
                            >
                                <option value="">All Leagues</option>
                                {leagues.map((league) => (
                                    <option key={league.id} value={league.id}>
                                        {league.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-400 text-sm">Showing</p>
                            <p className="text-2xl font-bold text-turquoise-400">{filteredTeams.length}</p>
                            <p className="text-gray-400 text-xs">teams</p>
                        </div>
                    </div>
                </div>

                {showForm && (
                    <div className="card">
                        <h2 className="text-xl font-bold text-white mb-4">
                            {editingTeam ? 'Edit Team' : 'Add New Team'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-gray-300 mb-2">Team Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input w-full"
                                    required
                                    placeholder="Enter team name"
                                />
                            </div>
                            <div className="flex space-x-3">
                                <button type="submit" className="btn-primary">
                                    {editingTeam ? 'Update Team' : 'Create Team'}
                                </button>
                                <button type="button" onClick={handleCancel} className="btn-secondary">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="card">
                    <h2 className="text-xl font-bold text-white mb-4">
                        {selectedLeague
                            ? `${leagues.find(l => l.id === selectedLeague)?.name || 'League'} Teams (${filteredTeams.length})`
                            : `All Teams (${filteredTeams.length})`
                        }
                    </h2>
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-turquoise-500 mx-auto"></div>
                        </div>
                    ) : filteredTeams.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">
                            {selectedLeague ? 'No teams found in this league' : 'No teams found'}
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-navy-700">
                                        <th className="text-left py-3 px-4 text-gray-300">#</th>
                                        <th className="text-left py-3 px-4 text-gray-300">Team Name</th>
                                        <th className="text-left py-3 px-4 text-gray-300">League</th>
                                        <th className="text-center py-3 px-4 text-gray-300">Players</th>
                                        <th className="text-center py-3 px-4 text-gray-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTeams.map((team, index) => (
                                        <tr key={team.id} className="border-b border-navy-700 hover:bg-navy-700 transition-colors">
                                            <td className="py-3 px-4 text-gray-400">{index + 1}</td>
                                            <td className="py-3 px-4 text-white font-semibold">{team.name}</td>
                                            <td className="py-3 px-4 text-gray-300">
                                                {leagues.find(l => l.id === team.league_id)?.name || 'N/A'}
                                            </td>
                                            <td className="py-3 px-4 text-center text-gray-300">{team.player_count || 0}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center justify-center space-x-2">
                                                    <button
                                                        onClick={() => handleEdit(team)}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(team.id)}
                                                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
