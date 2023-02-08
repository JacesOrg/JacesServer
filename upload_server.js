const fs = require('fs')
const path = require("path");
const dotenv = require("dotenv")
const {pipeline} = require('stream')
const util = require('util')

let https;
const pump = util.promisify(pipeline)

dotenv.config()

if (fs.existsSync('/etc/letsencrypt/live/s01.jaces.org/cert.pem'))
    https = {
        key: fs.readFileSync('/etc/letsencrypt/live/s01.jaces.org/privkey.pem'),
        cert: fs.readFileSync('/etc/letsencrypt/live/s01.jaces.org/cert.pem')
    }
const fastify = require('fastify')({
    logger: true,
    https: https
})

fastify.register(require('@fastify/multipart'))

fastify.register(require('@fastify/mongodb'),{
    forceClose: true,
    url: `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}/${process.env.MONGO_DB}`
})

fastify.register(require('@fastify/jwt'), {
    secret: 'b1gOne5ecretS'
})

fastify.addHook('onRequest', (req, reply, done)=>{
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
    done()
})

fastify.post('/upload', async (req, reply)=>{
    try {
        const data = await req.file()
        console.log(req.body);
        console.log(data);
        const filename = path.join(require('os').homedir(), '.containers', data.filename)
        const storedFile = fs.createWriteStream(filename)
        await pump(data.file, storedFile)
        const uploadsColl = fastify.mongo.db.collection('files')
        await uploadsColl.insertOne({filename: data.filename, path: filename, created: new Date()})
        return { success: true }
    } catch (error) {
        console.log(error);
        return reply.status(500).send({success: false, message: error.message})
    }
    
})

fastify.post('/uploaddetails', async(req, reply)=>{
    try {
        const {filename, image} = req.body
        const uploadsColl = fastify.mongo.db.collection('files')
        await uploadsColl.updateOne({filename: filename}, {$set: {image: image}})
        return { success: true }
    } catch (error) {
        console.log(error);
        return reply.status(500).send({success: false, message: error.message})
    }
})

const start = async () => {
    try {
        await fastify.listen({host: '0.0.0.0', port: 41536})
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}
start()