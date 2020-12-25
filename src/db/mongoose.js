const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URL,{
                  useNewUrlParser: true,
                  useCreateIndex: true, 
                  useUnifiedTopology: true,
                  useFindAndModify: false
                }).then( () => console.log('Connected to db successfully!'))
                  .catch( (e) => console.log('Connection failed! ', e))


