const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const port = 3000;

// Enable CORS
app.use(cors());

// Serve static files from current directory
app.use(express.static('.'));

// Endpoint to fetch Google Form
app.get('/fetch-form', async (req, res) => {
    try {
        const formUrl = req.query.url;
        if (!formUrl) {
            return res.status(400).json({ error: 'No URL provided' });
        }

        const response = await axios.get(formUrl);
        res.send(response.data);
    } catch (error) {
        console.error('Error fetching form:', error);
        res.status(500).json({ error: 'Failed to fetch form' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 