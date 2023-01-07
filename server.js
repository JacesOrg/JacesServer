const fs = require('fs')
const path = require("path");
let https;
if (fs.existsSync(path.join(__dirname, 'server.key')))
    https = {
        key: fs.readFileSync(path.join(__dirname, 'server.key')),
        cert: fs.readFileSync(path.join(__dirname,  'server.crt'))
    }
const fastify = require('fastify')({
    logger: true,
    https: https
})

fastify.register(require('@fastify/mongodb'),{
    forceClose: true,
    url: 'mongodb://localhost:27017/jaces'
})

fastify.register(require('@fastify/jwt'), {
    secret: 'b1gOne5ecretS'
})

fastify.register(require('./routes/login'), {prefix: 'api/clients'})
fastify.register(require('./routes/hosts'), {prefix: 'api/pvt/hosts'})

const start = async () => {
    try {
        await fastify.listen({ port: 3000 })
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}
start()
