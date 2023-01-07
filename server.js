const fastify = require('fastify')({ logger: true })

fastify.register(require('@fastify/mongodb'),{
    forceClose: true,
    url: 'mongodb://localhost:27017/jaces'
})
fastify.register(require('@fastify/jwt'), {
    secret: 'b1gOne5ecretS'
})

fastify.register(require('./routes/login'), {prefix: 'api/clients'})

const start = async () => {
    try {
        await fastify.listen({ port: 3000 })
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}
start()
