import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { FaFilter, FaSearch } from 'react-icons/fa';

export default function AdminPlayers() {
    const [players, setPlayers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [leagues, setLeagues] = useState([]);
    const [selectedLeague, setSelectedLeague] = useState('');
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        sa_id_number: '',
        phone: '',
        email: '',
        team_id: '',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [playersRes, teamsRes, leaguesRes] = await Promise.all([
                api.get('/admin/players'),
                api.get('/admin/teams'),
                api.get('/leagues')
            ]);
            setPlayers(playersRes.data.players);
            setTeams(teamsRes.data.teams);
            setLeagues(leaguesRes.data.leagues || []);

            // Default to All Leagues to show all players initially
            setSelectedLeague('');
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        console.log('🔵 handleSubmit called!', e);
        e.preventDefault();
        console.log('🔵 Form submission prevented, starting save...');
        try {
            console.log('Submitting player data:', formData);

            if (editingPlayer) {
                const response = await api.put(`/admin/players/${editingPlayer.id}`, formData);
                console.log('Update response:', response);
                alert('Player updated successfully!');
            } else {
                const response = await api.post('/admin/players', formData);
                console.log('Create response:', response);
                alert('Player created successfully!');
            }
            setShowForm(false);
            setEditingPlayer(null);
            resetForm();
            fetchData();
        } catch (error) {
            console.error('Error saving player:', error);
            console.error('Error response:', error.response?.data);
            const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
            alert(`Failed to save player: ${errorMessage}`);
        }
    };

    const handleEdit = (player) => {
        setEditingPlayer(player);
        setFormData({
            first_name: player.first_name || '',
            last_name: player.last_name || '',
            sa_id_number: player.sa_id_number || '',
            phone: player.phone || '',
            email: player.email || '',
            team_id: player.team_id || '',
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this player?')) return;

        try {
            await api.delete(`/admin/players/${id}`);
            alert('Player deleted successfully!');
            fetchData();
        } catch (error) {
            console.error('Error deleting player:', error);
            alert('Failed to delete player');
        }
    };

    const resetForm = () => {
        setFormData({
            first_name: '',
            last_name: '',
            sa_id_number: '',
            phone: '',
            email: '',
            team_id: '',
        });
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingPlayer(null);
        resetForm();
    };

    // Filter teams by selected league
    const filteredTeams = selectedLeague
        ? teams.filter(team => team.league_id === selectedLeague)
        : teams;

    // Filter players based on search query and selected league
    const filteredPlayers = players.filter(player => {
        const query = searchQuery.toLowerCase();
        const fullName = `${player.first_name} ${player.last_name}`.toLowerCase();
        const teamName = (player.team_name || '').toLowerCase();
        const saId = (player.sa_id_number || '').toLowerCase();

        const matchesSearch = fullName.includes(query) ||
            teamName.includes(query) ||
            saId.includes(query);

        // Filter by league if selected
        if (selectedLeague && player.team_id) {
            const playerTeam = teams.find(t => t.id === player.team_id);
            const matchesLeague = playerTeam && playerTeam.league_id === selectedLeague;
            return matchesSearch && matchesLeague;
        }

        return matchesSearch;
    });

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-white">Manage Players</h1>
                    {!showForm && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="btn-primary"
                        >
                            + Add New Player
                        </button>
                    )}
                </div>

                {/* League Filter */}
                {!showForm && (
                    <div className="card">
                        <div className="flex items-center space-x-4">
                            <FaFilter className="text-turquoise-400" />
                            <div className="flex-1">
                                <label className="block text-gray-300 mb-2 text-sm">Filter by League</label>
                                <select
                                    value={selectedLeague}
                                    onChange={(e) => setSelectedLeague(e.target.value === "" ? "" : parseInt(e.target.value))}
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
                                <p className="text-2xl font-bold text-turquoise-400">{filteredPlayers.length}</p>
                                <p className="text-gray-400 text-xs">players</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Search Bar */}
                {!showForm && (
                    <div className="card">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search players by name, team, or SA ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input w-full pl-10"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                        <p className="text-sm text-gray-400 mt-2">
                            Showing {filteredPlayers.length} of {players.length} players
                        </p>
                    </div>
                )}

                {showForm && (
                    <div className="card">
                        <h2 className="text-xl font-bold text-white mb-4">
                            {editingPlayer ? 'Edit Player' : 'Add New Player'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-300 mb-2">First Name *</label>
                                    <input
                                        type="text"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        className="input w-full"
                                        required
                                        placeholder="Enter first name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-300 mb-2">Last Name *</label>
                                    <input
                                        type="text"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        className="input w-full"
                                        required
                                        placeholder="Enter last name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-300 mb-2">South African ID Number</label>
                                    <input
                                        type="text"
                                        value={formData.sa_id_number}
                                        onChange={(e) => setFormData({ ...formData, sa_id_number: e.target.value })}
                                        className="input w-full"
                                        placeholder="e.g., 9001015009087"
                                        maxLength="13"
                                        pattern="[0-9]{13}"
                                        title="Please enter a valid 13-digit SA ID number"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-300 mb-2">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="input w-full"
                                        placeholder="e.g., +27 82 123 4567"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-300 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="input w-full"
                                        placeholder="player@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-300 mb-2">Team Allocation</label>
                                    <select
                                        value={formData.team_id}
                                        onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                                        className="input w-full"
                                    >
                                        <option value="">-- No Team --</option>
                                        {teams.map((team) => (
                                            <option key={team.id} value={team.id}>
                                                {team.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex space-x-3">
                                <button type="submit" className="btn-primary">
                                    {editingPlayer ? 'Update Player' : 'Create Player'}
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
                        All Players ({searchQuery ? `${filteredPlayers.length} of ${players.length}` : players.length})
                    </h2>
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-turquoise-500 mx-auto"></div>
                        </div>
                    ) : players.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">No players found</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-navy-700">
                                        <th className="text-left py-3 px-4 text-gray-300">#</th>
                                        <th className="text-left py-3 px-4 text-gray-300">Name</th>
                                        <th className="text-left py-3 px-4 text-gray-300">SA ID Number</th>
                                        <th className="text-left py-3 px-4 text-gray-300">Phone</th>
                                        <th className="text-left py-3 px-4 text-gray-300">Team</th>
                                        <th className="text-center py-3 px-4 text-gray-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPlayers.map((player, index) => (
                                        <tr key={player.id} className="border-b border-navy-700 hover:bg-navy-700 transition-colors">
                                            <td className="py-3 px-4 text-gray-400">{index + 1}</td>
                                            <td className="py-3 px-4 text-white font-semibold">
                                                {player.first_name} {player.last_name}
                                            </td>
                                            <td className="py-3 px-4 text-gray-300">{player.sa_id_number || '-'}</td>
                                            <td className="py-3 px-4 text-gray-300">{player.phone || '-'}</td>
                                            <td className="py-3 px-4 text-gray-300">{player.team_name || 'No Team'}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center justify-center space-x-2">
                                                    <button
                                                        onClick={() => handleEdit(player)}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(player.id)}
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
