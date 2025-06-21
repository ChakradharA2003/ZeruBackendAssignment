const express = require('express');
require('dotenv').config();

const connectDB = require('./config/index');
const apiRoutes = require('./routes');
const { executeAllDataFetching,syncValidators } = require('./scripts/fetchData')

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.use('/api', apiRoutes); 

async function startServer() {
  try {
    await connectDB();
    
    // await executeAllDataFetching();

    app.get('/', (req, res) => {
      res.send('EigenLayer Restaking API is running');
    });

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
