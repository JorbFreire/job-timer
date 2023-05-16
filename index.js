const app = require('./api/index.js')

const PORT = 3333

app.listen(PORT, () =>
  console.log(`listening on port ${PORT}!`),
);
