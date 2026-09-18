const alertRepository = require('./alert.repository');
const prisma = require('../../database/prismaClient');
const responseHandler = require('../../utils/responseHandler');
const { HTTP_STATUS } = responseHandler;

const COMPANY_WIDE_ROLES = ['super_admin', 'sub_super_admin', 'admin', 'sub_admin'];

class AlertController {

    getAlerts = async (req, res) => {
        try {
            const companyId = req.user?.companyId;
            const userId = req.user?.id || req.user?.userId;
            const role = String(req.user?.role || '').toLowerCase();
            const { page, limit } = req.query;

            if (!companyId) {
                return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, 'Company context missing');
            }

            // Guard: userId missing hone par Prisma undefined field ko ignore kar deta hai,
            // jisse OR condition sab machines match kar jayega. Isliye hard block.
            if (!COMPANY_WIDE_ROLES.includes(role) && !userId) {
                return responseHandler(res, HTTP_STATUS.UNAUTHORIZED, false, 'User context missing');
            }

            let machineIds = null;

            if (!COMPANY_WIDE_ROLES.includes(role)) {
                // Machine-level assignment (Operator / Artisan / Supervisor directly on machine)
                const assignedMachines = await prisma.machine.findMany({
                    where: {
                        companyId,
                        OR: [
                            { assignedOperatorId: userId },
                            { assignedArtisanId: userId },
                            { assignedSupervisorId: userId },
                            // Component-level assignment (Artisan/Supervisor assigned to a
                            // specific component, not whole machine)
                            { components: { some: { assignedArtisanId: userId } } },
                            { components: { some: { assignedSupervisorId: userId } } }
                        ]
                    },
                    select: { id: true }
                });

                machineIds = assignedMachines.map(m => m.id);

                console.log('[ALERT_ACCESS_DEBUG]', { role, userId, matchedMachines: machineIds.length });

                if (machineIds.length === 0) {
                    return responseHandler(res, HTTP_STATUS.OK, true, 'No alerts found', {
                        page: 1, limit: Number(limit) || 20, totalItems: 0, totalPages: 1, data: []
                    });
                }
            }

            const result = await alertRepository.findAll({
                companyId,
                machineIds,
                page: page || 1,
                limit: limit || 20
            });
            return responseHandler(res, HTTP_STATUS.OK, true, 'Alerts fetched successfully', result);
        } catch (error) {
            console.error('[GET_ALERTS_ERROR]:', error.message);
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    };

    getAlertById = async (req, res) => {
        try {
            const { id } = req.params;
            const alert = await alertRepository.findById(id);
            if (!alert) {
                return responseHandler(res, HTTP_STATUS.NOT_FOUND, false, 'Alert not found');
            }
            const authError = await this._checkAccess(alert, req.user);
            if (authError) {
                return responseHandler(res, HTTP_STATUS.FORBIDDEN, false, authError);
            }
            return responseHandler(res, HTTP_STATUS.OK, true, 'Alert fetched successfully', alert);
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    };

    deleteAlert = async (req, res) => {
        try {
            const { id } = req.params;
            const alert = await alertRepository.findById(id);

            if (!alert) {
                return responseHandler(res, HTTP_STATUS.NOT_FOUND, false, 'Alert not found');
            }

            const authError = await this._checkAccess(alert, req.user);
            if (authError) {
                return responseHandler(res, HTTP_STATUS.FORBIDDEN, false, authError);
            }

            await alertRepository.delete(id);
            return responseHandler(res, HTTP_STATUS.OK, true, 'Alert deleted successfully');
        } catch (error) {
            return responseHandler(res, HTTP_STATUS.BAD_REQUEST, false, error.message);
        }
    };

    _checkAccess = async (alert, user) => {
        const companyId = user?.companyId;
        const userId = user?.id || user?.userId;
        const role = String(user?.role || '').toLowerCase();

        if (!userId && !COMPANY_WIDE_ROLES.includes(role)) {
            return 'Access denied: User context missing.';
        }

        if (alert.machine.companyId !== companyId) {
            return 'Access denied: This alert does not belong to your company.';
        }

        if (COMPANY_WIDE_ROLES.includes(role)) {
            return null;
        }

        const machine = await prisma.machine.findUnique({
            where: { id: alert.machineId },
            select: {
                assignedOperatorId: true,
                assignedArtisanId: true,
                assignedSupervisorId: true,
                components: {
                    where: {
                        OR: [
                            { assignedArtisanId: userId },
                            { assignedSupervisorId: userId }
                        ]
                    },
                    select: { id: true }
                }
            }
        });

        const isAssignedToMachine = machine && (
            machine.assignedOperatorId === userId ||
            machine.assignedArtisanId === userId ||
            machine.assignedSupervisorId === userId
        );

        const isAssignedToComponent = machine && machine.components.length > 0;

        return (isAssignedToMachine || isAssignedToComponent)
            ? null
            : 'Access denied: You are not assigned to this machine.';
    };
}

module.exports = new AlertController();