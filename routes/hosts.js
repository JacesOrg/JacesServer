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

        return reply.send(doc)
        try{
            const {temp, cpu, hdd, ram} = req.body;
            const host_id = req.host_id

            const hosts = fastify.mongo.db.collection('hosts')
            const configs = fastify.mongo.db.collection('hosts')

            await hosts.updateOne({host_id: host_id}, {$set: {temp: temp, cpu: cpu, hdd: hdd, ram: ram}})
            const config = await configs.findOne({host_id: host_id})
            const doc = new YAML.Document();
            doc.contents = config;
        }catch (e) {
            return reply.status(500).send('Bad response')
        }
    })

    fastify.get('/get', async (req, reply)=>{
        const hosts_coll = fastify.mongo.db.collection('hosts')
        try{
            const hosts = await hosts_coll.find({client_id: req.client_id}).toArray()
            console.log(hosts)
            return reply.send(hosts)
        }catch (e) {
            return reply.status(500).send('Bad response')
        }
    })

    done()
}
