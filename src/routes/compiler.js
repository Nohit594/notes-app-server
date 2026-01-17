const express = require('express');
const axios = require('axios');
const router = express.Router();
const auth = require('../middleware/auth');

// Execute Code
router.post('/execute', auth, async (req, res) => {
    const { language, code } = req.body;

    // Map language names to OneCompiler format if necessary
    // OneCompiler uses 'python' for Python 3, 'java' for Java, 'cpp' for C++
    // We will assume frontend sends correct keys or map them here.

    // RapidAPI OneCompiler endpoint
    // Endpoint: https://onecompiler-apis.p.rapidapi.com/api/v1/run


    // Map language names to filenames
    const fileNames = {
        'java': 'Main.java',
        'python': 'main.py',
        'cpp': 'main.cpp',
        'c': 'main.c',
        'javascript': 'index.js'
    };

    const fileName = fileNames[language] || 'main.txt';

    try {
        const response = await axios.post('https://onecompiler-apis.p.rapidapi.com/api/v1/run', {
            language: language,
            files: [
                {
                    name: fileName,
                    content: code
                }
            ],
            stdin: "", // TODO: Add stdin support if needed
        }, {
            headers: {
                'content-type': 'application/json',
                'X-RapidAPI-Key': process.env.ONECOMPILER_API_KEY,
                'X-RapidAPI-Host': 'onecompiler-apis.p.rapidapi.com'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Compiler API Error:', error.response?.data || error.message);
        res.status(500).json({
            message: 'Execution failed',
            details: error.response?.data || error.message
        });
    }
});

module.exports = router;
