module.exports = (fastify, opts, done) => { 
    fastify.get('/receive', {websocket: true}, async (conn, req)=>{
        conn.socket.on('message', message => {
            // message.toString() === 'hi from client'
            console.log(JSON.parse(req.headers.headers));
            console.log(message.toString());
            conn.socket.send('hi from server')
          })
        
    })

    done()
}