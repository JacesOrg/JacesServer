const clients = require('../lib/processWsRequest')
module.exports = (fastify, opts, done) => {
    fastify.get('/receive', {websocket: true}, async (conn, req) => {
        clients[req.client_id] = conn

        conn.socket.on('message', message => {
            // message.toString() === 'hi from client'
            console.log(req.headers);
            console.log(message.toString());
            console.log(conn.socket)
            conn.socket.send('hi from server')
        })

        conn.socket.on('close', function (reasonCode, description) {
            delete clients[req.client_id]
            console.log(clients)
        });

    })

    done()
}
