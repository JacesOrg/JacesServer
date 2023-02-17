const clients = require('../lib/processWsRequest')
module.exports = (fastify, opts, done) => {
    fastify.get('/receive', {websocket: true}, async (conn, req) => {
        clients[req.host_id] = conn

        conn.socket.on('message', async message => {
            // message.toString() === 'hi from client'
            try {
                console.log('Message received from', req.host_id); 
                const msg = JSON.parse(message.toString())
                console.log(message.toString());
                if(msg.type === 'hostStat'){
                    const hostColl = fastify.mongo.db.collection('hosts');
                    const host = await hostColl.findOne({_id: new fastify.mongo.ObjectId(msg.hostStats.host_id)})
                    const statColl = fastify.mongo.db.collection('hosts_stat');
                    const stat_obj =msg.hostStats 
                    stat_obj.created = new Date()
                    stat_obj.host_id = new fastify.mongo.ObjectId(msg.hostStats.host_id)
                    await statColl.insertOne(stat_obj)
                    conn.socket.send(JSON.stringify({success: true, message: 'Stats saved successfully'}))
                }else if(msg.type === 'updateConfigs'){
                    const to_send = []
                    const hostColl = fastify.mongo.db.collection('hosts');
                    const host = hostColl.findOne({_id: new fastify.mongo.ObjectId(msg.host_id)})
                    for(let conf of host.configs)
                        if(conf.status == 'UPDATE')
                            to_send.push(conf)
                    if(to_send.length > 0)
                        conn.socket.send(JSON.stringify({type: 'updateConf', configs: to_send}))
                }
            } catch (error) {
                console.log(error);
                conn.socket.send(JSON.stringify({success: false, message: error.message})) 
            }

        })

        conn.socket.on('close', function (reasonCode, description) {
            console.log(req.host_id, 'disconnected');
            delete clients[req.host_id]     
            console.log(clients)
        });

    })

    done()
}
