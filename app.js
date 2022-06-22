const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/time', (req,res) => {
    let dt = new Date().toISOString();
    res.send(dt);
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
