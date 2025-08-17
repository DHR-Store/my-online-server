const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'user_data.json');

// Middleware
app.use(cors());
app.use(express.json());

// Check if data file exists, if not, create it
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '{}', 'utf8');
}

// Helper function to read user data
const readUserData = () => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading user data file:', error);
        return {};
    }
};

// Helper function to write user data
const writeUserData = (data) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing user data file:', error);
    }
};

// API endpoint to log user activity
app.post('/api/user-ping', (req, res) => {
    const { userId, platform } = req.body;
    
    // Check if the request is being received
    console.log(`Received ping from userId: ${userId} on platform: ${platform}`);

    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }

    let users = readUserData();
    users[userId] = {
        lastSeen: new Date().toISOString(),
        platform: platform || 'unknown'
    };
    writeUserData(users);

    res.status(200).json({ message: 'User activity logged' });
});

// API endpoint to get all users
app.get('/api/users', (req, res) => {
    const users = readUserData();
    res.status(200).json(users);
});

app.listen(PORT, () => {
    // Corrected console.log to show the full URL
    console.log(`Server is running at http://localhost:${PORT}`);
});
