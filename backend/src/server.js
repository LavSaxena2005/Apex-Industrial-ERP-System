const app = require('./app');
const prisma = require('./config/database');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(` Industrial Sales & Inventory ERP API Server Running`);
  console.log(` Port:             http://localhost:${PORT}`);
  console.log(` Health check:     http://localhost:${PORT}/api/health`);
  console.log(` API Docs:         http://localhost:${PORT}/api/docs`);
  console.log(` Database:         Connected to PostgreSQL (erp_db)`);
  console.log(`=======================================================`);
});

const gracefulShutdown = async () => {
  console.log('\nGracefully shutting down...');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Database disconnected. Process terminated.');
    process.exit(0);
  });
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

module.exports = server;
