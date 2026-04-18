const Timetable = require('../models/timetable.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// Helper: convert "HH:MM" to minutes since midnight for overlap comparison
const timeToMinutes = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
};

// Helper: check if two time ranges overlap
const rangesOverlap = (s1, e1, s2, e2) => s1 < e2 && s2 < e1;

// @desc    Create or update timetable for a class+section+day
// @route   POST /api/timetable
// @access  Admin
const createOrUpdateTimetable = async (req, res) => {
    try {
        const { class: cls, section, day, periods } = req.body;
        const schoolId = req.user.schoolId;

        if (!cls || !section || !day || !periods || !Array.isArray(periods)) {
            return sendError(res, 400, 'class, section, day, and periods[] are required.');
        }

        // --- Teacher clash check ---
        // For each period, ensure the assigned teacher doesn't have an overlapping
        // period on the same day in ANY other class/section within this school.
        for (const period of periods) {
            if (!period.teacherId || !period.startTime || !period.endTime) {
                return sendError(res, 400, `Period ${period.periodNumber}: teacherId, startTime, and endTime are required.`);
            }

            const pStart = timeToMinutes(period.startTime);
            const pEnd = timeToMinutes(period.endTime);

            if (pStart >= pEnd) {
                return sendError(res, 400, `Period ${period.periodNumber}: startTime must be before endTime.`);
            }

            // Find all timetable entries on the same day in this school
            // that are NOT the current class+section (other classes)
            const otherEntries = await Timetable.find({
                schoolId,
                day,
                $or: [
                    { class: { $ne: cls } },
                    { section: { $ne: section } },
                ],
            });

            for (const entry of otherEntries) {
                for (const existing of entry.periods) {
                    if (String(existing.teacherId) === String(period.teacherId)) {
                        const eStart = timeToMinutes(existing.startTime);
                        const eEnd = timeToMinutes(existing.endTime);

                        if (rangesOverlap(pStart, pEnd, eStart, eEnd)) {
                            return sendError(
                                res,
                                409,
                                `Teacher clash: Teacher ${period.teacherId} is already assigned to ${entry.class}-${entry.section} period ${existing.periodNumber} (${existing.startTime}–${existing.endTime}) on ${day}.`
                            );
                        }
                    }
                }
            }
        }

        // Upsert the timetable entry
        const timetable = await Timetable.findOneAndUpdate(
            { schoolId, class: cls, section, day },
            { schoolId, class: cls, section, day, periods },
            { upsert: true, new: true, runValidators: true }
        );

        return sendSuccess(res, 200, 'Timetable saved', { timetable });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Get full week timetable for a class+section
// @route   GET /api/timetable/class
// @access  Admin, Teacher, Parent
const getTimetableByClass = async (req, res) => {
    try {
        const { class: cls, section } = req.query;

        if (!cls || !section) {
            return sendError(res, 400, 'class and section query params are required.');
        }

        const timetable = await Timetable.find({
            schoolId: req.user.schoolId,
            class: cls,
            section,
        })
            .populate('periods.teacherId', 'name email')
            .sort({ day: 1 });

        // Sort by weekday order
        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        timetable.sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));

        return sendSuccess(res, 200, 'Class timetable fetched', { timetable });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Get all periods assigned to a teacher for the week
// @route   GET /api/timetable/teacher/:teacherId
// @access  Admin, Teacher
const getTimetableByTeacher = async (req, res) => {
    try {
        const { teacherId } = req.params;

        // Find all timetable entries in this school that contain periods for this teacher
        const allEntries = await Timetable.find({
            schoolId: req.user.schoolId,
            'periods.teacherId': teacherId,
        }).populate('periods.teacherId', 'name email');

        // Build a clean schedule: only include the teacher's periods
        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        const schedule = allEntries.map((entry) => ({
            _id: entry._id,
            class: entry.class,
            section: entry.section,
            day: entry.day,
            periods: entry.periods.filter(
                (p) => String(p.teacherId?._id || p.teacherId) === String(teacherId)
            ),
        }));

        schedule.sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));

        return sendSuccess(res, 200, 'Teacher timetable fetched', { schedule });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// @desc    Delete timetable for a specific class+section+day
// @route   DELETE /api/timetable/:id
// @access  Admin
const deleteTimetableDay = async (req, res) => {
    try {
        const { id } = req.params;

        const timetable = await Timetable.findOneAndDelete({
            _id: id,
            schoolId: req.user.schoolId,
        });

        if (!timetable) {
            return sendError(res, 404, 'Timetable entry not found.');
        }

        return sendSuccess(res, 200, 'Timetable entry deleted', { timetable });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

module.exports = { createOrUpdateTimetable, getTimetableByClass, getTimetableByTeacher, deleteTimetableDay };
