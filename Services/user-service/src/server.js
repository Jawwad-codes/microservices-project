const app = require('./app');

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => console.log(`User Service running on port ${PORT}`));

console.log("DATABASE_URL:", JSON.stringify(process.env.DATABASE_URL));
console.log("PORT:", process.env.PORT);