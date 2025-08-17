const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection URI from Vercel Environment Variables
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors());
app.use(express.json());

// Check for MONGODB_URI
if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI environment variable is not set.');
    // In a real application, you would handle this more gracefully.
    process.exit(1); 
}

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Successfully connected to MongoDB Atlas.'))
    .catch(err => console.error('MongoDB connection error:', err));

// Define a Mongoose schema for the user data
const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    lastSeen: { type: Date, required: true },
    platform: { type: String, default: 'unknown' }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

const User = mongoose.model('User', userSchema);

// API endpoint to log user activity
// This will find and update an existing user or create a new one
app.post('/api/user-ping', async (req, res) => {
    const { userId, platform } = req.body;
    
    console.log(`Received ping from userId: ${userId} on platform: ${platform}`);

    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }

    try {
        const updatedUser = await User.findOneAndUpdate(
            { userId: userId }, // Find a user by their ID
            { 
                lastSeen: new Date(),
                platform: platform || 'unknown'
            },
            { 
                new: true, // Return the updated document
                upsert: true, // Create the document if it doesn't exist
                setDefaultsOnInsert: true // Apply default values on creation
            }
        );
        res.status(200).json({ message: 'User activity logged', user: updatedUser });
    } catch (error) {
        console.error('Error logging user activity:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// API endpoint to get all users
app.get('/api/users', async (req, res) => {
    try {
        // Fetch all users from the database
        const users = await User.find({}, 'userId lastSeen platform');
        
        // Format the users into a single object for the dashboard
        const formattedUsers = {};
        users.forEach(user => {
            formattedUsers[user.userId] = {
                lastSeen: user.lastSeen,
                platform: user.platform
            };
        });

        res.status(200).json(formattedUsers);
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
