import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { useRouter } from 'next/router';

export default function AdminLeagues() {
    const [leagues, setLeagues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingLeague, setEditingLeague] = useState(null);
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        is_public: false,
        venue_id: ''
    });

    useEffect(() => {
        fetchLeagues();
    }, []);

    const fetchLeagues = async () => {
        try {
            setLoading(true);
            // Reusing the public endpoint which now supports optional auth
            // Since we are logged in as admin, we should see all leagues + is_public flag
            const response = await api.get('/leagues');
            setLeagues(response.data.leagues);
            setError('');
        } catch (error) {
            console.error('Error fetching leagues:', error);
            setError('Failed to load leagues');
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePublic = async (league) => {
        try {
            const updatedStatus = !league.is_public;
            await api.put(`/leagues/${league.id}`, {
                is_public: updatedStatus
            });

            // Optimistic update or refresh
            setLeagues(prev => prev.map(l =>
                l.id === league.id ? { ...l, is_public: updatedStatus } : l
            ));
        } catch (error) {
            console.error('Error updating league:', error);
            alert('Failed to update public status');
        }
    };

    const handleEdit = (league) => {
        setEditingLeague(league);
        setFormData({
            name: league.name,
            is_public: league.is_public,
            venue_id: league.venue_id || ''
        });
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingLeague) {
                await api.put(`/leagues/${editingLeague.id}`, formData);
                alert('League updated successfully!');
            } else {
                // Determine logic for create? 
                // Currently only update logic requested, but create exists in controller
                await api.post('/leagues', formData);
                alert('League created successfully!');
            }
            setShowForm(false);
            setEditingLeague(null);
            fetchLeagues();
        } catch (error) {
            console.error('Error saving league:', error);
            alert('Failed to save league');
        }
    };

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-white">Manage Leagues</h1>
                    {!showForm && (
                        <button
                            onClick={() => {
                                setEditingLeague(null);
                                setFormData({ name: '', is_public: false, venue_id: '' });
                                setShowForm(true);
                            }}
                            className="btn-primary"
                        >
                            + Create League
                        </button>
                    )}
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Form */}
                {showForm && (
                    <div className="card">
                        <h2 className="text-xl font-bold text-white mb-4">
                            {editingLeague ? 'Edit League' : 'Create New League'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-gray-300 mb-2">League Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input w-full"
                                    required
                                />
                            </div>

                            <div className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    id="is_public"
                                    checked={formData.is_public}
                                    onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                                    className="h-5 w-5 text-turquoise-500 rounded focus:ring-turquoise-500 border-gray-600 bg-navy-900"
                                />
                                <label htmlFor="is_public" className="text-gray-300 select-none">
                                    Make Public (Visible to everyone)
                                </label>
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button type="submit" className="btn-primary">
                                    {editingLeague ? 'Update League' : 'Create League'}
                                </button>
                                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* List */}
                {!showForm && !loading && (
                    <div className="grid grid-cols-1 gap-4">
                        {leagues.map(league => (
                            <div key={league.id} className="card flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-white">{league.name}</h3>
                                    <p className="text-xs text-gray-500 mt-1">Created: {league.created_at ? new Date(league.created_at).toLocaleDateString() : 'N/A'}</p>
                                </div>
                                <div className="flex items-center space-x-6">
                                    {/* Quick Toggle */}
                                    <div className="flex items-center space-x-2">
                                        <span className={`text-sm font-bold ${league.is_public ? 'text-green-500' : 'text-gray-500'}`}>
                                            {league.is_public ? 'PUBLIC' : 'PRIVATE'}
                                        </span>
                                        <button
                                            onClick={() => handleTogglePublic(league)}
                                            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${league.is_public ? 'bg-turquoise-500' : 'bg-gray-700'
                                                }`}
                                        >
                                            <span
                                                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${league.is_public ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                            />
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => handleEdit(league)}
                                        className="text-turquoise-500 hover:text-turquoise-400"
                                    >
                                        Edit
                                    </button>
                                </div>
                            </div>
                        ))}
                        {leagues.length === 0 && (
                            <div className="text-center text-gray-500 py-8">
                                No leagues found.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
}
