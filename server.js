const fs = require('fs')
const path = require("path");
const dotenv = require("dotenv")
let https;

dotenv.config()

if (fs.existsSync(path.join(__dirname, 'server.key')))
    https = {
        key: fs.readFileSync(path.join(__dirname, 'server.key')),
        cert: fs.readFileSync(path.join(__dirname,  'server.crt'))
    }
const fastify = require('fastify')({
    logger: true,
    https: https
})

fastify.register(require('@fastify/static'), {
    root: path.join(require('os').homedir(), '.containers'),
    prefix: '/containers/', // optional: default '/'
  })

fastify.register(require('@fastify/mongodb'),{
    forceClose: true,
    url: `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}/${process.env.MONGO_DB}`
})

fastify.register(require('@fastify/websocket'))

fastify.register(require('@fastify/jwt'), {
    secret: 'b1gOne5ecretS'
})

fastify.addHook('onRequest', (req, reply, done)=>{
    if(req.url.indexOf('/pvt/') != -1){
        let authHeader;
        for(let header of Object.keys(req.headers) ) {
            console.log(header.toUpperCase())
            if(header.toUpperCase() === 'AUTHORIZATION') {
                try{
                    authHeader = req.headers[header]
                    console.log(authHeader.split(' '))
                    const payload = authHeader.split(' ')[1]
                    if(!payload)
                        return reply.status(401).send("Unauthorized")
                    const token_obj = fastify.jwt.verify(payload)
                    if(!token_obj)
                        return reply.status(401).send("Invalid token")
                    console.log(token_obj)
                    req.client_id = token_obj.client_id
                    done()
                    return
                }catch (e) {
                    console.log(e)
                    return reply.status(401).send("Unathorized")
                }


            }
        }
        return reply.status(401).send("Unathorized")

    }
    done()
})

fastify.register(require('./routes/login'), {prefix: 'api/clients'})
fastify.register(require('./routes/hosts'), {prefix: 'api/pvt/hosts'})
fastify.register(require('./routes/configs'), {prefix: 'api/admin/configs'})
fastify.register(require('./routes/containers'), {prefix: 'api/pvt/containers'})
fastify.register(require('./routes/wshandler'), {prefix: 'api/ws'})

const start = async () => {
    try {
        await fastify.listen({ port: 3000})
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}
start()
