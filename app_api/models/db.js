const mongoose = require('mongoose');

const host = process.env.DB_HOST || '127.0.0.1';
const dbURI = `mongodb://${host}/travlr`;

const connect = () => {
  setTimeout(() => mongoose.connect(dbURI), 1000);
};

mongoose.connection.on('connected', () => {
  console.log(`Mongoose connected to ${dbURI}`);
});
mongoose.connection.on('error', (err) => {
  console.log('Mongoose connection error:', err);
});
mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

const gracefulShutdown = async (msg, callback) => {
  await mongoose.connection.close();
  console.log(`Mongoose disconnected through ${msg}`);
  callback();
};

process.once('SIGUSR2', () => {
  gracefulShutdown('nodemon restart', () => process.kill(process.pid, 'SIGUSR2'));
});
process.on('SIGINT', () => {
  gracefulShutdown('app termination', () => process.exit(0));
});
process.on('SIGTERM', () => {
  gracefulShutdown('app shutdown', () => process.exit(0));
});

connect();

require('./travlr'); // registers the schema on connect

module.exports = mongoose;

require('./user');
