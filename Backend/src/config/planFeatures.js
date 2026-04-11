const PLAN_FEATURES = {
    starter: {
        maxStudents: 200,
        maxTeachers: 5,
        maxSmsPerMonth: 0,
        homeworkEnabled: true,
        attendanceEnabled: true,
        feeManagementEnabled: true,
        parentPortalEnabled: true,
        reportsEnabled: false,
        customBrandingEnabled: false,
    },
    growth: {
        maxStudents: 600,
        maxTeachers: 20,
        maxSmsPerMonth: 500,
        homeworkEnabled: true,
        attendanceEnabled: true,
        feeManagementEnabled: true,
        parentPortalEnabled: true,
        reportsEnabled: true,
        customBrandingEnabled: false,
    },
    enterprise: {
        maxStudents: Infinity,
        maxTeachers: Infinity,
        maxSmsPerMonth: Infinity,
        homeworkEnabled: true,
        attendanceEnabled: true,
        feeManagementEnabled: true,
        parentPortalEnabled: true,
        reportsEnabled: true,
        customBrandingEnabled: true,
    },
};

module.exports = PLAN_FEATURES;
