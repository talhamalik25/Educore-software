const School = require('../models/school.model');
const PLAN_FEATURES = require('../config/planFeatures');
const { sendError } = require('../utils/apiResponse');

// Usage: checkLimit('maxStudents', currentCount)
const checkLimit = (limitKey, getCurrentCount) => {
    return async (req, res, next) => {
        try {
            const school = await School.findById(req.user.schoolId);
            if (!school) return sendError(res, 404, 'School not found.');

            const plan = PLAN_FEATURES[school.plan];
            if (!plan) return sendError(res, 403, 'Invalid plan configuration.');

            const limit = plan[limitKey];

            // If limit is Infinity or not set, allow
            if (limit === undefined || limit === Infinity) return next();

            // If it's a boolean feature
            if (typeof limit === 'boolean') {
                if (!limit) return sendError(res, 403, `This feature is not available on your ${school.plan} plan. Please upgrade.`);
                return next();
            }

            // If it's a numeric limit, get current count and compare
            if (typeof getCurrentCount === 'function') {
                const current = await getCurrentCount(req);
                if (current >= limit) {
                    return sendError(res, 403, `You have reached the ${limitKey} limit (${limit}) for your ${school.plan} plan. Please upgrade.`);
                }
            }

            next();
        } catch (error) {
            return sendError(res, 500, 'Plan check failed.');
        }
    };
};

// Usage: checkFeatureFlag('reportsEnabled')
const checkFeatureFlag = (flagKey) => {
    return async (req, res, next) => {
        try {
            const school = await School.findById(req.user.schoolId);
            if (!school) return sendError(res, 404, 'School not found.');

            const plan = PLAN_FEATURES[school.plan];
            if (!plan) return sendError(res, 403, 'Invalid plan configuration.');

            if (!plan[flagKey]) {
                return sendError(res, 403, `This feature is not available on your ${school.plan} plan. Please upgrade.`);
            }

            next();
        } catch (error) {
            return sendError(res, 500, 'Plan check failed.');
        }
    };
};

module.exports = { checkLimit, checkFeatureFlag };
