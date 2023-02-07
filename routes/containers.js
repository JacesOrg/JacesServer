module.exports = function (fastify, opts, done) {

    fastify.post('/stat/set/:container_id', async (req, reply)=>{
        try{
            const container_id = req.params.container_id;
            const containerColl = fastify.mongo.db.collection('containers')
            const stat = req.body

            const cont = containerColl.findOne({client_id: req.client_id, container_id: container_id})
            if(!cont)
                return reply.status(404).send({success: false, message: 'Container not found'})
            await containerColl.updateOne({client_id: req.client_id, container_id: container_id}, {$set: stat})
        }catch (e) {
            console.log(e)
            return reply.send({success: false, message:  e.message})
        }

    })

    fastify.get('/stat/get/:container_id', async (req, reply)=>{
        try{
            const container_id = req.params.container_id;
            const containerColl = fastify.mongo.db.collection('containers')
            const cont = containerColl.findOne({client_id: req.client_id, container_id: container_id})
            if(!cont)
                return reply.status(404).send({success: false, message: 'Container not found'})
            return reply.send(cont)
        }catch (e) {
            console.log(e)
            return reply.send({success: false, message:  e.message})
        }
    })

    done()
}
