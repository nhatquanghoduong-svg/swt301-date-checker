// server.js - Chỉ chịu trách nhiệm khởi động server
// Logic đã được tách sang app.js để có thể test độc lập
const { app } = require('./app');
const PORT = 3001;

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
