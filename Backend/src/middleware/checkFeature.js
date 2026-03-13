const School = require('../models/school.model');
const PLAN_FEATURES = require('../config/planFeatures');
const { sendError } = require('../utils/apiResponse');

// Usage: checkFeature('attendance_qr')
const checkFeature = (featureName) => {
    return async (req, res, next) => {
        try {
            const school = await School.findById(req.user.schoolId);

            if (!school) {
                return sendError(res, 404, 'School not found.');
            }

            const planFeatures = PLAN_FEATURES[school.plan]?.features || [];

            if (!planFeatures.includes(featureName)) {
                return sendError(
                    res,
                    403,
                    `This feature (${featureName}) is not available on your current plan. Please upgrade.`
                );
            }

            next();
        } catch (error) {
            return sendError(res, 500, 'Feature check failed.');
        }
    };
};

module.exports = checkFeature;
