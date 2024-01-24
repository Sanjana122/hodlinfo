const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const ejs = require('ejs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"))

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/cryptoData', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Define a schema for storing crypto data
const cryptoSchema = new mongoose.Schema({
  name: String,
  last: Number,
  buy: Number,
  sell: Number,
  volume: Number,
  base_unit: String,
});

const CryptoModel = mongoose.model('Crypto', cryptoSchema);

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Fetch data from the API and store it in the database
app.get('/fetchAndStoreData', async (req, res) => {
  try {
    const apiResponse = await axios.get('https://api.wazirx.com/api/v2/tickers');
    const top10Data = Object.values(apiResponse.data).slice(0, 10);
    console.log(top10Data);
    let count = 1;
    // Store data in MongoDB
    await Promise.all(
      top10Data.map(async (crypto) => {
        const newCrypto = new CryptoModel({
          count: count,
          name: crypto.name,
          last: crypto.last,
          buy: crypto.buy,
          sell: crypto.sell,
          volume: crypto.volume,
          base_unit: crypto.baseAsset,
        });
        await newCrypto.save();
        count = count + 1;
      })
    );

    res.json({ success: true, message: 'Data stored successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching or storing data' });
  }
});

// Fetch and display data from the database on a webpage
app.get('/', async (req, res) => {
  try {
    const cryptoData = await CryptoModel.find();
    res.render('index', { cryptoData });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching data from the database');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});