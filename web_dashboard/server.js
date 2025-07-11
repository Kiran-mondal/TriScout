const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  fs.readFile('../shared_data/processed.json', 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Error reading processed data.');
    }
    const parsedData = JSON.parse(data);
    res.render('index', { results: parsedData });
  });
});

app.listen(PORT, () => {
  console.log(`TriScout Dashboard running at http://localhost:${PORT}`);
});
