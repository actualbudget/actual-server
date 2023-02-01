/** @type {import('fastify').FastifyPluginCallback} */
module.exports = (fastify, opts, done) => {
  fastify.get('/health', () => {
    return { status: 'UP' };
  });

  fastify.get('/info', () => {
    const packageJSON = require('./package.json');

    return {
      build: {
        name: packageJSON.name,
        version: packageJSON.version
      }
    };
  });

  fastify.get('/metrics', () => {
    return {
      mem: process.memoryUsage(),
      uptime: process.uptime()
    };
  });

  done();
};
