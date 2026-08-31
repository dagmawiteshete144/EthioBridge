const mongoose = require('mongoose');
(async () => {
  await mongoose.connect('mongodb://localhost:27017/ethiobridge');
  const users = await mongoose.connection.db.collection('users').find({}, { projection: { email: 1, role: 1, password: 1 } }).toArray();
  const bad = [];
  users.forEach((u) => {
    const p = u.password || '';
    if (!p.startsWith('$2')) {
      bad.push({ email: u.email, role: u.role, pass: p.slice(0, 20) });
    }
  });
  if (bad.length) {
    console.log('NON-BCRYPT passwords:');
    bad.forEach((b) => console.log(' -', b.email, b.role, JSON.stringify(b.pass)));
  } else {
    console.log('All', users.length, 'users have valid bcrypt hashes');
  }
  await mongoose.disconnect();
})();
