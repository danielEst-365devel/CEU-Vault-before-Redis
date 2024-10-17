const https = require('https');
const { app, credentials } = require('./app');
const port = 8000; // Change to a different port if needed

const httpsServer = https.createServer(credentials, app);

httpsServer.listen(port, () => {
    console.log(`HTTPS Server running on port ${port}`);
});