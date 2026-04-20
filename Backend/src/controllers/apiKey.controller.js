const ApiKey = require('../models/apiKey.model');
const crypto = require('crypto');
const { sendSuccess, sendError } = require('../utils/apiResponse');

exports.createApiKey = async (req, res) => {
    try {
        const { schoolId } = req.user;
        const { name, permissions, expiresAt } = req.body;

        if (!name || !permissions || permissions.length === 0) {
            return sendError(res, 400, 'Name and permissions are required');
        }

        const rawKeyPrefix = 'ec_live_';
        const randomPart = crypto.randomBytes(32).toString('hex');
        const rawKey = `${rawKeyPrefix}${randomPart}`;
        
        const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

        const apiKey = await ApiKey.create({
            schoolId,
            name,
            keyHash,
            keyPrefix: rawKeyPrefix,
            permissions,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            createdBy: req.user._id
        });

        // Add rawKey to response for ONE-TIME view
        const responseData = apiKey.toObject();
        delete responseData.keyHash;
        responseData.rawKey = rawKey;
        responseData.warning = "⚠️ Save this key now. It will never be shown again.";

        sendSuccess(res, 201, 'API key created successfully', responseData);
    } catch (error) {
        sendError(res, 500, error.message);
    }
};

exports.getApiKeys = async (req, res) => {
    try {
        const { schoolId } = req.user;

        const apiKeys = await ApiKey.find({ schoolId })
            .select('-keyHash')
            .sort({ createdAt: -1 });

        sendSuccess(res, 200, 'API keys fetched successfully', apiKeys);
    } catch (error) {
        sendError(res, 500, error.message);
    }
};

exports.revokeApiKey = async (req, res) => {
    try {
        const { id } = req.params;
        const { schoolId } = req.user;

        const apiKey = await ApiKey.findOne({ _id: id, schoolId });
        if (!apiKey) {
            return sendError(res, 404, 'API key not found');
        }

        apiKey.isActive = false;
        await apiKey.save();

        sendSuccess(res, 200, 'API key revoked successfully');
    } catch (error) {
        sendError(res, 500, error.message);
    }
};
