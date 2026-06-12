const toPreHandler = (middleware) => {
    return (request, reply, next) => {
        // Polyfill Express compatibility on the Fastify reply object
        reply.json = (data) => reply.send(data);
        
        // Execute standard Express middleware
        middleware(request, reply, next);
    };
};

module.exports = toPreHandler;
