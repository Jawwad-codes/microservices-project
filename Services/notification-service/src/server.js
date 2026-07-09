const app = require('./app');

const PORT = process.env.PORT || 4005;
app.listen(PORT, () => console.log(`Notification Service running on port ${PORT}`));
