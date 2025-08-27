const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Enable CORS with specific configuration for Vercel
app.use(cors({
    origin: true, // Allow all origins in development/production
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Add middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle preflight OPTIONS requests
app.options('*', (req, res) => {
    res.set({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400' // 24 hours
    });
    res.status(200).send();
});

// Serve static files from current directory
app.use(express.static('.'));

// Root route to serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint to fetch Google Form
app.get('/fetch-form', async (req, res) => {
    try {
        const formUrl = req.query.url;
        if (!formUrl) {
            return res.status(400).json({ error: 'No URL provided' });
        }

        // Add proper headers to mimic a real browser request
        const response = await axios.get(formUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Cache-Control': 'max-age=0'
            },
            timeout: 30000, // 30 second timeout for Vercel
            maxRedirects: 5
        });
        
        // Set CORS headers explicitly for the response
        res.set({
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
            'Cache-Control': 'no-cache'
        });
        
        res.send(response.data);
    } catch (error) {
        console.error('Error fetching form:', error);
        
        // Set CORS headers for error response too
        res.set({
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
        });
        
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            res.status(503).json({ error: 'Unable to reach Google Forms. Please check the URL and try again.' });
        } else if (error.code === 'ETIMEDOUT') {
            res.status(504).json({ error: 'Request timeout. Please try again.' });
        } else {
            res.status(500).json({ error: 'Failed to fetch form' });
        }
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.set({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
    });
    res.status(500).json({ error: 'Internal server error' });
});

// Handle 404s
app.use('*', (req, res) => {
    res.set({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
    });
    res.status(404).json({ error: 'Not found' });
});

// For Vercel deployment
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

module.exports = app; 