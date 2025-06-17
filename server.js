const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your-secret-key'; // In production, use environment variable

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Database setup
const db = new sqlite3.Database('users.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the users database.');
});

// Create users table
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullName TEXT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'customer',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    lastLogin DATETIME
)`);

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        console.log('Login attempt:', { email, role });

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        db.get('SELECT * FROM users WHERE email = ? AND role = ?', [email, role], async (err, user) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Database error' });
            }
            if (!user) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            try {
                const validPassword = await bcrypt.compare(password, user.password);
                if (!validPassword) {
                    return res.status(401).json({ message: 'Invalid credentials' });
                }

                const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET);
                
                // Update last login time
                db.run('UPDATE users SET lastLogin = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
                
                console.log('Login successful:', { email, role });
                res.json({ 
                    token, 
                    role: user.role,
                    message: 'Login successful'
                });
            } catch (error) {
                console.error('Password comparison error:', error);
                res.status(500).json({ message: 'Error validating credentials' });
            }
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin login endpoint
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('Admin login attempt:', { username });

        // Convert admin@petverse.com to admin for database lookup
        const adminUsername = username === 'admin@petverse.com' ? 'admin' : username;

        if (!adminUsername || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        db.get('SELECT * FROM users WHERE email = ? AND role = ?', [adminUsername, 'admin'], async (err, user) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Database error' });
            }
            if (!user) {
                return res.status(401).json({ message: 'Invalid admin credentials' });
            }

            try {
                const validPassword = await bcrypt.compare(password, user.password);
                if (!validPassword) {
                    return res.status(401).json({ message: 'Invalid admin credentials' });
                }

                const token = jwt.sign({ userId: user.id, role: 'admin' }, JWT_SECRET);
                
                // Update last login time
                db.run('UPDATE users SET lastLogin = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
                
                console.log('Admin login successful:', { username });
                res.json({ 
                    token, 
                    role: 'admin',
                    message: 'Login successful'
                });
            } catch (error) {
                console.error('Password comparison error:', error);
                res.status(500).json({ message: 'Error validating credentials' });
            }
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Register endpoint
app.post('/api/register', async (req, res) => {
    try {
        const { fullName, email, password } = req.body;
        console.log('Registration attempt:', { email });

        if (!fullName || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, row) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ message: 'Database error' });
            }
            if (row) {
                return res.status(400).json({ message: 'User already exists' });
            }

            try {
                const hashedPassword = await bcrypt.hash(password, 10);
                db.run('INSERT INTO users (fullName, email, password, role) VALUES (?, ?, ?, ?)',
                    [fullName, email, hashedPassword, 'customer'],
                    function(err) {
                        if (err) {
                            console.error('Error creating user:', err);
                            return res.status(500).json({ message: 'Error creating user' });
                        }
                        const token = jwt.sign({ userId: this.lastID, role: 'customer' }, JWT_SECRET);
                        console.log('Registration successful:', { email });
                        res.status(201).json({ 
                            message: 'User created successfully',
                            token,
                            role: 'customer'
                        });
                    }
                );
            } catch (error) {
                console.error('Password hashing error:', error);
                res.status(500).json({ message: 'Error creating user' });
            }
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create initial admin user
const createAdminUser = async () => {
    const adminPassword = await bcrypt.hash('admin123', 10);
    db.run(`INSERT OR IGNORE INTO users (fullName, email, password, role) 
            VALUES (?, ?, ?, ?)`,
        ['Admin User', 'admin@petverse.com', adminPassword, 'admin']
    );
};

// Protected routes
app.use('/api/protected', verifyToken, (req, res) => {
    res.json({ message: 'Access granted to protected route' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    createAdminUser();
    console.log('Server is ready to accept connections');
});
