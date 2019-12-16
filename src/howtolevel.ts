import encoding from 'encoding-down'
import leveldown from 'leveldown'
import levelup from 'levelup'

const db = levelup(encoding(
  leveldown("path"),
  { valueEncoding: 'json' })
);

// to add value
db.put(key, value, (err) => {
  if(err) {}
});

// to read
db.get(key, (err, value) => {
  if(err) {}
});


