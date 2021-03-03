const app = require('./src/app')
const port = process.env.PORT;

// Divided the express server file, so that it doesn't run while testing with Jest, this file is vercel's entry point
app.listen(port, () => {
    console.log('Server is up at port', port);
})

