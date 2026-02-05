import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../../components/Layout';
import api from '../../../../utils/api';
import { FaTrophy, FaSave, FaTimes } from 'react-icons/fa';

export default function EditTournamentPage() {
    const router = useRouter();
    const { id } = router.query;
    const [leagues, setLeagues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        league_id: '',
        game_type: 'ultimate-pool',
        format: 'single-elimination',
        start_date: '',
        description: '',
        is_public: false,
        race_to: 13
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (id) {
            Promise.all([
                fetchLeagues(),
                fetchTournament()
            ]).finally(() => setLoading(false));
        }
    }, [id]);

    const fetchLeagues = async () => {
        try {
            const response = await api.get('/leagues');
            setLeagues(response.data.leagues || []);
        } catch (error) {
            console.error('Error fetching leagues:', error);
        }
    };

    const fetchTournament = async () => {
        try {
            const response = await api.get(`/tournaments/${id}`);
            const t = response.data.tournament;
            setFormData({
                name: t.name,
                league_id: t.league_id,
                game_type: t.game_type,
                format: t.format,
                start_date: t.start_date ? t.start_date.split('T')[0] : '', // Format for input type=date
                description: t.description || '',
                is_public: t.is_public,
                race_to: t.race_to
            });
        } catch (error) {
            console.error('Error fetching tournament:', error);
            alert('Failed to load tournament details');
            router.push('/admin/tournaments');
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Tournament name is required';
        if (!formData.league_id) newErrors.league_id = 'League is required';
        if (formData.race_to < 1 || formData.race_to > 50) newErrors.race_to = 'Race to must be between 1 and 50';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            setSaving(true);
            await api.put(`/tournaments/${id}`, formData);
            router.push(`/admin/tournaments/${id}`);
        } catch (error) {
            console.error('Error updating tournament:', error);
            alert(error.response?.data?.error || 'Failed to update tournament');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <Layout><div className="text-white p-8 text-center">Loading tournament details...</div></Layout>;
    }

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8 max-w-3xl">
                <div className="flex items-center gap-3 mb-8">
                    <FaTrophy className="text-4xl text-yellow-500" />
                    <h1 className="text-3xl font-bold text-white">Edit Tournament</h1>
                </div>

                <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-8">
                    {/* Tournament Name */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Tournament Name *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`w-full bg-gray-700 text-white border ${errors.name ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                    </div>

                    {/* League & Game Type (Disabled mostly to preserve integrity, but allowing edit if needed. For now keeping enabled) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">League *</label>
                            <select
                                name="league_id"
                                value={formData.league_id}
                                onChange={handleChange}
                                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select League</option>
                                {leagues.map(league => (
                                    <option key={league.id} value={league.id}>{league.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Game Type *</label>
                            <select
                                name="game_type"
                                value={formData.game_type}
                                onChange={handleChange}
                                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="ultimate-pool">Ultimate Pool</option>
                                <option value="blackball">Blackball</option>
                                <option value="8-ball">8-Ball</option>
                                <option value="9-ball">9-Ball</option>
                                <option value="snooker">Snooker</option>
                            </select>
                        </div>
                    </div>

                    {/* Format & Race To */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Format *</label>
                            <select
                                name="format"
                                value={formData.format}
                                onChange={handleChange}
                                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="single-elimination">Single Elimination</option>
                                <option value="round-robin">Round Robin</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Race To *</label>
                            <input
                                type="number"
                                name="race_to"
                                value={formData.race_to}
                                onChange={handleChange}
                                min="1"
                                max="50"
                                className={`w-full bg-gray-700 text-white border ${errors.race_to ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="4"
                            className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Public Toggle */}
                    <div className="mb-8">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                name="is_public"
                                checked={formData.is_public}
                                onChange={handleChange}
                                className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-gray-300">Make tournament public</span>
                        </label>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium"
                        >
                            {saving ? 'Saving...' : <><FaSave /> Save Changes</>}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <FaTimes /> Cancel
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}
