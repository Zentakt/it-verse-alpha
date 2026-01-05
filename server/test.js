const express = require('express');
const app = express();
app.get('/test', (req, res) => res.json({ status: 'ok' }));
app.listen(5001, () => console.log('Test server on 5001'));
