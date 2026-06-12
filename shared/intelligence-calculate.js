/**
 * HME Intelligence System - Shared Constants
 * These thresholds are based on the system proposal for 0-100 scoring.
 */

const HEALTH_STATUS = {
    HEALTHY: { min: 85, max: 100, label: 'Healthy', color: '#22c55e' },
    DEGRADING: { min: 70, max: 84.99, label: 'Degrading', color: '#eab308' },
    WARNING: { min: 40, max: 69.99, label: 'Warning', color: '#f97316' },
    CRITICAL: { min: 0, max: 39.99, label: 'Critical Risk', color: '#ef4444' }
};

const COMPONENT_TYPES = {
    ENGINE: 'engine',
    TRANSMISSION: 'transmission',
    HYDRAULIC: 'hydraulic',
    FINAL_DRIVE: 'final_drive',
    TYRE: 'tyre'
};

const MACHINE_TYPES = {
    DUMP_TRUCK: 'CAT_777',
    LOADER: 'CAT_990'
};

module.exports = {
    HEALTH_STATUS,
    COMPONENT_TYPES,
    MACHINE_TYPES
};
