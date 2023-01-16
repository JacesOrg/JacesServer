const YAML = require('yaml')

module.exports = function (fastify, opts, done) {
    fastify.post('/register', async (req, reply)=>{
        try{
            const {host_id} = req.body
            const hosts = fastify.mongo.db.collection('hosts')
            await hosts.insertOne({host_id: host_id})
            return reply.send({success: true})
        }catch (e) {
            return reply.status(500).send('Bad response')
        }
    })

    fastify.post('/sync', async (req, reply)=>{
        try{
            const {host_id, temp, cpu, hdd, ram} = req.body;
            const client_id = req.client_id
            const hosts = fastify.mongo.db.collection('hosts')
            const configs = fastify.mongo.db.collection('hosts')

            await hosts.updateOne({host_id: host_id}, {$set: {temp: temp, cpu: cpu, hdd: hdd, ram: ram}})
            const config = await configs.findOne({client_id: client_id, host_id: host_id})
            const doc = new YAML.Document();
            doc.contents = config;
            return reply.send(doc)
        }catch (e) {
            return reply.status(500).send('Bad response')
        }
    })

    fastify.get('/get', async (req, reply)=>{
        const hosts_coll = fastify.mongo.db.collection('hosts')
        console.log(req.client_id)
        try{
            const hosts = await hosts_coll.find({client_id: req.client_id}).toArray()
            console.log(hosts)
            return reply.send(hosts)
        }catch (e) {
            return reply.status(500).send('Bad response')
        }
    })

    fastify.get('/gethostbyid', async (req, reply)=>{
        const hosts_coll = fastify.mongo.db.collection('hosts')
        try{
            const hosts = await hosts_coll.findOne({client_id: req.client_id, _id: new fastify.mongo.ObjectId(req.query._id)})
            return reply.send(hosts)
        }catch (e) {
            return reply.status(500).send('Bad response')
        }
    })

    fastify.post('/update', async (req, reply)=>{
        const client_id = req.client_id
        try{
            const hosts_coll = fastify.mongo.db.collection('hosts')
            await hosts_coll.updateOne({client_id: client_id, host_id: req.body.host_id}, req.body)
            return reply.send({success: true})
        }catch (e) {
            return reply.status(500).send('Bad response')
        }
    })

    done()
}
