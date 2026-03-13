// Single source of truth for all plan features
const PLAN_FEATURES = {
    starter: {
        maxStudents: 200,
        features: [
            'fee_management',
            'attendance_basic',
            'parent_portal',
        ],
    },
    growth: {
        maxStudents: 600,
        features: [
            'fee_management',
            'attendance_basic',
            'attendance_qr',
            'parent_portal',
            'sms_alerts',
            'reports_basic',
        ],
    },
    pro: {
        maxStudents: Infinity,
        features: [
            'fee_management',
            'attendance_basic',
            'attendance_qr',
            'parent_portal',
            'sms_alerts',
            'reports_basic',
            'reports_advanced',
            'custom_branding',
            'api_access',
        ],
    },
};

module.exports = PLAN_FEATURES;
