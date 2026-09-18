const prisma = require('../../../database/prisma');

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 15;

class NotificationRepository {
    async count(where = {}) {
        return prisma.notification.count({ where });
    }

    async countUnread(scope = {}) {
        const orConditions = this._buildScopeConditions(scope);
        if (orConditions.length === 0) return 0;
        return prisma.notification.count({
            where: { OR: orConditions, isRead: false }
        });
    }

    /**
     * Shared scoping logic: a notification belongs to a user's feed if it's
     * targeted directly at them (userId match), or if it's a role broadcast
     * for their company (companyId + role, userId null), or if they're a
     * Super Admin (role = SUPER_ADMIN).
     */
    _buildScopeConditions({ userId, companyId, role, isSuperAdmin } = {}) {
        const orConditions = [];

        if (userId) {
            orConditions.push({ userId });
        }

        if (isSuperAdmin) {
            orConditions.push({ role: 'SUPER_ADMIN' });
        } else if (companyId && role) {
            orConditions.push({ companyId, role, userId: null });
        }

        return orConditions;
    }

    async findAll(filter = {}) {
        const where = {};

        if (filter.companyId) {
            where.companyId = filter.companyId;
        }

        if (filter.userId) {
            where.userId = filter.userId;
        }

        if (filter.role) {
            where.role = filter.role;
        }

        if (filter.type) {
            where.type = filter.type;
        }

        if (filter.severity) {
            where.severity = filter.severity;
        }

        if (filter.isRead !== undefined) {
            where.isRead = filter.isRead;
        }

        if (filter.search) {
            where.OR = [
                { message: { contains: filter.search, mode: 'insensitive' } },
                { title: { contains: filter.search, mode: 'insensitive' } }
            ];
        }

        const limit = Math.min(Math.max(parseInt(filter.limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
        const offset = Math.max(parseInt(filter.offset, 10) || 0, 0);

        return prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset
        });
    }

    /**
     * Live feed for a logged-in user: their direct notifications + role
     * broadcasts for their company, or everything if Super Admin.
     */
    async getNotificationsForUser(scope = {}, limit = DEFAULT_LIMIT, offset = 0) {
        const { userId, companyId, role, isSuperAdmin } = scope;

        if (!userId && !isSuperAdmin && !(companyId && role)) {
            throw new Error(
                'getNotificationsForUser: must provide userId, isSuperAdmin, or companyId + role'
            );
        }

        const safeLimit = Math.min(Math.max(parseInt(limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
        const safeOffset = Math.max(parseInt(offset, 10) || 0, 0);
        const orConditions = this._buildScopeConditions(scope);

        if (orConditions.length === 0) {
            return [];
        }

        return prisma.notification.findMany({
            where: { OR: orConditions },
            orderBy: { createdAt: 'desc' },
            take: safeLimit,
            skip: safeOffset
        });
    }

    async findById(id) {
        return prisma.notification.findUnique({ where: { id } });
    }

    async createNotification(data) {
        if (!data.message) {
            throw new Error('createNotification: "message" is required');
        }
        if (!data.type) {
            throw new Error('createNotification: "type" is required');
        }
        if (!data.userId && !(data.companyId && data.role)) {
            throw new Error(
                'createNotification: must provide either userId, or companyId + role for a broadcast'
            );
        }

        return prisma.notification.create({
            data: {
                companyId: data.companyId || null,
                userId: data.userId || null,
                role: data.role || null,
                message: data.message,
                type: data.type,
                title: data.title || null,
                severity: data.severity || 'info',
                link: data.link || null,
                actor_id: data.actorId || null,
                actor_name: data.actorName || null,
                actor_role: data.actorRole || null,
                entity_id: data.entityId || null,
                entity_type: data.entityType || null,
                isRead: false
            }
        });
    }

    async update(id, data) {
        const allowedFields = [
            'message', 'type', 'title', 'severity', 'link', 'isRead',
            'actor_id', 'actor_name', 'actor_role', 'entity_id', 'entity_type'
        ];
        const updateData = {};
        for (const key of allowedFields) {
            if (data[key] !== undefined) {
                updateData[key] = data[key];
            }
        }
        return prisma.notification.update({
            where: { id },
            data: updateData
        });
    }

    /**
     * scope is optional — pass it from the controller (req.user) so a user
     * can only mark their own / their role's notifications as read, not
     * anyone else's by guessing an id.
     */
    async markAsRead(id, scope = null) {
        if (scope) {
            const orConditions = this._buildScopeConditions(scope);
            const result = await prisma.notification.updateMany({
                where: { id, OR: orConditions },
                data: { isRead: true }
            });
            if (result.count === 0) {
                throw new Error('markAsRead: notification not found or not authorized');
            }
            return result;
        }

        return prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });
    }

    async markAllAsReadForUser(scope = {}) {
        const orConditions = this._buildScopeConditions(scope);

        if (orConditions.length === 0) {
            return { count: 0 };
        }

        return prisma.notification.updateMany({
            where: { OR: orConditions, isRead: false },
            data: { isRead: true }
        });
    }

    async delete(id) {
        return prisma.notification.delete({ where: { id } });
    }
}

module.exports = new NotificationRepository();