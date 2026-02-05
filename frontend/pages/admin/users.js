import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { useRouter } from 'next/router';

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'read_only', // Default to safe role
        phone: ''
    });

    const router = useRouter();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/users');
            // Note: My backend route is /api/users. 
            // If utils/api.js adds /api base, then this is /users. 
            // If not, I might need /api/users.
            // Based on admin/players.js using /admin/players, likely the base is /api.
            setUsers(response.data.users);
            setError('');
        } catch (error) {
            console.error('Error fetching users:', error);
            if (error.response && error.response.status === 403) {
                setError('Access Denied. Admin rights required.');
            } else {
                setError('Failed to load users');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                // Update implementation (role change)
                await api.put(`/users/${editingUser.id}`, {
                    role: formData.role,
                    is_active: true // can add checkbox for this later
                });
                alert('User updated successfully!');
            } else {
                // Create implementation
                await api.post('/users', formData);
                alert('User created successfully!');
            }
            setShowForm(false);
            setEditingUser(null);
            resetForm();
            fetchUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            const msg = error.response?.data?.error || 'Failed to save user';
            alert(msg);
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            email: user.email,
            password: '', // Don't show hash, optional to change
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            role: user.role,
            phone: user.phone || ''
        });
        setShowForm(true);
    };

    const resetForm = () => {
        setFormData({
            username: '',
            email: '',
            password: '',
            first_name: '',
            last_name: '',
            role: 'read_only',
            phone: ''
        });
    };

    // Filter users
    const filteredUsers = users.filter(user => {
        const query = searchQuery.toLowerCase();
        return (
            user.username.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query) ||
            (user.first_name && user.first_name.toLowerCase().includes(query)) ||
            (user.last_name && user.last_name.toLowerCase().includes(query))
        );
    });

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-white">Manage Users</h1>
                    {!showForm && !error && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="btn-primary"
                        >
                            + Add New User
                        </button>
                    )}
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Search Bar - Hide if error */}
                {!showForm && !error && (
                    <div className="card">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input w-full pl-10"
                            />
                        </div>
                    </div>
                )}

                {/* Form */}
                {showForm && (
                    <div className="card">
                        <h2 className="text-xl font-bold text-white mb-4">
                            {editingUser ? 'Edit User Role' : 'Create New User'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Basics */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-300 mb-2">Username *</label>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className="input w-full"
                                        required
                                        disabled={!!editingUser} // Cannot change username on edit
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-300 mb-2">Email *</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="input w-full"
                                        required
                                        disabled={!!editingUser}
                                    />
                                </div>
                            </div>

                            {/* Password only for new users for now */}
                            {!editingUser && (
                                <div>
                                    <label className="block text-gray-300 mb-2">Password *</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="input w-full"
                                        required
                                    />
                                </div>
                            )}

                            {/* Role Select */}
                            <div>
                                <label className="block text-gray-300 mb-2">Role *</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="input w-full bg-navy-900 border-navy-600 text-white"
                                >
                                    <option value="read_only">Read Only (Default)</option>
                                    <option value="captain">Captain</option>
                                    <option value="admin">Admin (Full Access)</option>
                                </select>
                                <p className="text-xs text-gray-400 mt-1">
                                    Admins can manage everything. Captains can manage their team. Read Only can just view.
                                </p>
                            </div>

                            {/* Buttons */}
                            <div className="flex space-x-3 pt-4">
                                <button type="submit" className="btn-primary">
                                    {editingUser ? 'Update Role' : 'Create User'}
                                </button>
                                <button type="button" onClick={() => { setShowForm(false); resetForm(); setEditingUser(null); }} className="btn-secondary">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* List */}
                {!showForm && !error && (
                    <div className="card">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="text-gray-400 border-b border-navy-700">
                                    <tr>
                                        <th className="p-3">Username</th>
                                        <th className="p-3">Role</th>
                                        <th className="p-3">Email</th>
                                        <th className="p-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-navy-700">
                                    {filteredUsers.map(user => (
                                        <tr key={user.id} className="hover:bg-navy-700">
                                            <td className="p-3 font-medium text-white">{user.username}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'admin' ? 'bg-red-500/20 text-red-500' :
                                                        user.role === 'captain' ? 'bg-turquoise-500/20 text-turquoise-500' :
                                                            'bg-gray-500/20 text-gray-400'
                                                    }`}>
                                                    {user.role.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="p-3 text-gray-400">{user.email}</td>
                                            <td className="p-3 text-right">
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="text-turquoise-500 hover:text-turquoise-400 text-sm"
                                                >
                                                    Edit Role
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredUsers.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="p-8 text-center text-gray-500">
                                                No users found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
