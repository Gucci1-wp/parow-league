const db = require('../config/database');

// Get notifications for current user
const getNotifications = async (req, res) => {
    try {
        const { limit = 50, unread_only } = req.query;

        let query = 'SELECT * FROM notifications WHERE user_id = $1';
        const params = [req.user.id];

        if (unread_only === 'true') {
            query += ' AND is_read = false';
        }

        query += ' ORDER BY created_at DESC LIMIT $2';
        params.push(limit);

        const result = await db.query(query, params);

        res.json({ notifications: result.rows });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to get notifications' });
    }
};

// Mark notification as read
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        await db.query(
            'UPDATE notifications SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2',
            [id, req.user.id]
        );

        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
    try {
        await db.query(
            'UPDATE notifications SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND is_read = false',
            [req.user.id]
        );

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
};
