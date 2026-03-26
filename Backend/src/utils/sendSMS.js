const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

const sendSMS = async (to, message) => {
    try {
        // Validation: Pakistan number formatting (minimal)
        let formattedTo = to;
        if (to.startsWith('0')) {
            formattedTo = '+92' + to.slice(1);
        } else if (!to.startsWith('+')) {
            formattedTo = '+' + to;
        }

        if (accountSid && authToken && fromPhone) {
            const client = twilio(accountSid, authToken);
            await client.messages.create({
                body: message,
                from: fromPhone,
                to: formattedTo,
            });
            console.log(`[SMS] Sent to ${formattedTo}: ${message}`);
            return true;
        } else {
            console.log(`[SMS-STUB] (No Twilio Config) → ${formattedTo}: ${message}`);
            return false;
        }
    } catch (error) {
        console.error(`[SMS-ERROR] Failed to send to ${to}:`, error.message);
        return false;
    }
};

module.exports = sendSMS;
