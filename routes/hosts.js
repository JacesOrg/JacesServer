
module.exports = function (fastify, opts, done) {
    fastify.post('/register', async (req, reply)=>{
        try{
            const {host_id} = req.body
            const hostInfo = req.body
            hostInfo.configs = []
            hostInfo.client_id = req.client_id

            const hosts = fastify.mongo.db.collection('hosts')
            let insResult = await hosts.insertOne(hostInfo)
            console.log(insResult);
            return reply.send({success: true, id: insResult.insertedId})
        }catch (e) {
            return reply.status(500).send('Bad response')
        }
    })

    fastify.post('/stats/set/:hostid', async (req, reply)=>{
        try {
            const host_id = req.params.hostid;
            const hostColl = fastify.mongo.db.collection('hosts');
            const host = await hostColl.findOne({_id: new fastify.mongo.ObjectId(host_id)})
            console.log(host);
            if(!host)
                return reply.status(404).send({success: false, message: 'Host with specified id not found'})
            const statColl = fastify.mongo.db.collection('hosts_stat');
            const stat_obj = req.body
            stat_obj.created = new Date()
            stat_obj.host_id = new fastify.mongo.ObjectId(host_id)
            await statColl.insertOne(stat_obj)
            return reply.send({success: true})
        } catch (error) {
            return reply.send({success: false, message:  error.message})
        }

    })

    fastify.post('/logs/set/:hostid', async (req, reply)=>{
        try {
            const host_id = req.params.hostid;
            const hostColl = fastify.mongo.db.collection('hosts');
            const host = await hostColl.findOne({_id: new fastify.mongo.ObjectId(host_id)})
            console.log(host);
            if(!host)
                return reply.status(404).send({success: false, message: 'Host with specified id not found'})
            const logsColl = fastify.mongo.db.collection('hosts_logs');
            const stat_obj = req.body
            stat_obj.created = new Date()
            stat_obj.host_id = new fastify.mongo.ObjectId(host_id)
            await logsColl.insertOne(stat_obj)
            return reply.send({success: true})
        } catch (error) {
            return reply.send({success: false, message:  error.message})
        }

    })

    fastify.get('/logs/get', async (req, reply)=>{
        try {
            const host_id = req.query.hostid;
            const hostColl = fastify.mongo.db.collection('hosts');
            const host = await hostColl.findOne({_id: new fastify.mongo.ObjectId(host_id)})
            console.log(host);
            if(!host)
                return reply.status(404).send({success: false, message: 'Host with specified id not found'})
            const logsColl = fastify.mongo.db.collection('hosts_logs');
            const logs = await logsColl.find({hostid: host_id}).sort({created: -1}).toArray()
            return reply.send(logs)
        } catch (error) {
            console.log(error)
            return reply.send({success: false, message:  error.message})
        }
    })

    fastify.get('/sync', async (req, reply)=>{
        try{
            const {host_id} = req.query;
            const hostsColl = fastify.mongo.db.collection('hosts')
            const hosts = await hostsColl.findOne({_id: new fastify.mongo.ObjectId(host_id)})            
            return reply.send(hosts.configs)
        }catch (e) {
            console.log(e);
            return reply.status(500).send('Bad response')
        }
    })

    fastify.get('/get', async (req, reply)=>{
        const hosts_coll = fastify.mongo.db.collection('hosts')
        const hosts_stats_coll = fastify.mongo.db.collection('hosts_stat')
        const containersColl = fastify.mongo.db.collection('containers')
        console.log(req.client_id)
        try{
            const hosts = await hosts_coll.find({client_id: req.client_id}).toArray()
            
            for(let i =0; i < hosts.length; i++){
                const host_stat = await hosts_stats_coll.find({host_id: new fastify.mongo.ObjectId(hosts[i]._id)}).sort({created: -1}).limit(1).toArray()
                console.log("🚀 ~ file: hosts.js:98 ~ fastify.get ~ host_stat", host_stat)
                
                for(let k=0; k < hosts[i].configs.length; k ++){ 
                    console.log("🚀 ~ file: hosts.js:102 ~ fastify.get ~ hosts[i].configs[k].id", hosts[i].configs[k].id)
                    const container = await containersColl.findOne({container_id: hosts[i].configs[k].id, client_id: req.client_id})
                    
                    console.log("🚀 ~ file: hosts.js:102 ~ fastify.get ~ container", container)
                    if(container)
                        hosts[i].configs[k].status = container.status
                    else
                        hosts[i].configs[k].status = "Offline"
                }
                if(host_stat && host_stat.length > 0){
                    console.log("🚀 ~ file: hosts.js:106 ~ fastify.get ~ host_stat", host_stat)
                    hosts_stat = host_stat[0]
                    console.log("🚀 ~ file: hosts.js:108 ~ fastify.get ~ host_stat", host_stat)
                    let hostInfo = ""
                    for(let el of Object.keys(hosts_stat))
                        hostInfo += el+': '+hosts_stat[el] + ', '
                    hostInfo = hostInfo.slice(0, hostInfo.length-2)
                    hosts[i].info = hostInfo
                    hosts[i].stats = hosts_stat

                }}
            console.log(hosts)
            return reply.send(hosts)
        }catch (e) {
            console.log(e);
            return reply.status(500).send('Bad response')
        }
    })

    fastify.get('/gethostbyid', async (req, reply)=>{
        const hosts_coll = fastify.mongo.db.collection('hosts')
        try{
            const hosts = await hosts_coll.findOne({client_id: req.client_id, _id: new fastify.mongo.ObjectId(req.query._id)})
            console.log(hosts)
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
    fastify.post('/updatebyid', async (req, reply)=>{
        const client_id = req.client_id
        try{
            const hosts_coll = fastify.mongo.db.collection('hosts')
            const {_id} = req.body
            delete req.body._id
            await hosts_coll.updateOne({client_id: client_id, _id: new fastify.mongo.ObjectId(_id)}, {$set: req.body})
            return reply.send({success: true})
        }catch (e) {
            return reply.status(500).send('Bad response')
        }
    })

    done()
}
