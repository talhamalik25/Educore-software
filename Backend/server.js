require('dotenv').config();

// Fail-fast: ensure JWT_SECRET is set before anything else runs
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables. Check your .env file.');
}

const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`✅ EduCore server running on port ${PORT}`);
});
