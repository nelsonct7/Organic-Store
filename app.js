const {createServer} = require("./server");
const http = require('http');
const debug = require('debug')('shoppingcart:server');
const dotenv = require("dotenv");
dotenv.config();

const env = require("./config/env.config");

const PORT = normalizePort(env.port || '3000');

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    return val;
  }

  if (port >= 0) {
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof PORT === 'string'
    ? 'Pipe ' + PORT
    : 'Port ' + PORT;

  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening(server, port) {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
  console.log(`Server is running on port ${port}`);
}

/**
 * Start server if this is the main module
 */
if (require.main === module) {
  (async () => {
    try {
      const app = await createServer();
      const port = normalizePort(PORT || '3000');
      app.set('port', port);
      
      const server = http.createServer(app);
      server.listen(port);
      server.on('error', onError);
      server.on('listening', () => onListening(server, port));
    } catch (err) {
      console.error('Failed to start server:', err);
      process.exit(1);
    }
  })();
}

module.exports = createServer;