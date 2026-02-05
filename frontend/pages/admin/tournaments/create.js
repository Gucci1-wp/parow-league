import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import api from '../../../utils/api';
import { FaTrophy, FaSave, FaTimes } from 'react-icons/fa';

export default function CreateTournamentPage() {
    const router = useRouter();
    const [leagues, setLeagues] = useState([]);
    const [loading, setLoading] = useState(false);
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
        fetchLeagues();
    }, []);

    const fetchLeagues = async () => {
        try {
            const response = await api.get('/leagues');
            setLeagues(response.data.leagues || []);

            // Auto-select first league if available
            if (response.data.leagues && response.data.leagues.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    league_id: response.data.leagues[0].id
                }));
            }
        } catch (error) {
            console.error('Error fetching leagues:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Tournament name is required';
        }

        if (!formData.league_id) {
            newErrors.league_id = 'League is required';
        }

        if (formData.race_to < 1 || formData.race_to > 50) {
            newErrors.race_to = 'Race to must be between 1 and 50';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        try {
            setLoading(true);
            const response = await api.post('/tournaments', formData);

            if (response.data.success) {
                // Redirect to tournament dashboard
                router.push(`/admin/tournaments/${response.data.tournament.id}`);
            }
        } catch (error) {
            console.error('Error creating tournament:', error);
            alert(error.response?.data?.error || 'Failed to create tournament');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8 max-w-3xl">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <FaTrophy className="text-4xl text-yellow-500" />
                    <h1 className="text-3xl font-bold text-white">Create Tournament</h1>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-8">
                    {/* Tournament Name */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Tournament Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`w-full bg-gray-700 text-white border ${errors.name ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            placeholder="e.g., King of the Hill"
                        />
                        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                    </div>

                    {/* League Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            League <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="league_id"
                            value={formData.league_id}
                            onChange={handleChange}
                            className={`w-full bg-gray-700 text-white border ${errors.league_id ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        >
                            <option value="">Select a league</option>
                            {leagues.map(league => (
                                <option key={league.id} value={league.id}>
                                    {league.name}
                                </option>
                            ))}
                        </select>
                        {errors.league_id && <p className="text-red-500 text-sm mt-1">{errors.league_id}</p>}
                    </div>

                    {/* Game Type */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Game Type <span className="text-red-500">*</span>
                        </label>
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

                    {/* Format */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Tournament Format <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="format"
                            value={formData.format}
                            onChange={handleChange}
                            className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="single-elimination">Single Elimination</option>
                            <option value="round-robin">Round Robin</option>
                            <option value="double-elimination">Double Elimination (Coming Soon)</option>
                        </select>
                        <p className="text-gray-400 text-sm mt-2">
                            {formData.format === 'single-elimination' && 'Players compete in knockout rounds. Lose once and you\'re out.'}
                            {formData.format === 'round-robin' && 'Every player plays against every other player. Winner determined by standings.'}
                            {formData.format === 'double-elimination' && 'Players get a second chance in the losers bracket.'}
                        </p>
                    </div>

                    {/* Race To */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Race To (Frames to Win)
                        </label>
                        <input
                            type="number"
                            name="race_to"
                            value={formData.race_to}
                            onChange={handleChange}
                            min="1"
                            max="50"
                            className={`w-full bg-gray-700 text-white border ${errors.race_to ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                        {errors.race_to && <p className="text-red-500 text-sm mt-1">{errors.race_to}</p>}
                        <p className="text-gray-400 text-sm mt-2">
                            First player to win this many frames wins the match
                        </p>
                    </div>

                    {/* Start Date */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Start Date (Optional)
                        </label>
                        <input
                            type="date"
                            name="start_date"
                            value={formData.start_date}
                            onChange={handleChange}
                            className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Description (Optional)
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="4"
                            className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Add tournament details, rules, or notes..."
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
                            <span className="text-gray-300">
                                Make tournament public (anyone can view with the link)
                            </span>
                        </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <FaSave /> Create Tournament
                                </>
                            )}
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
