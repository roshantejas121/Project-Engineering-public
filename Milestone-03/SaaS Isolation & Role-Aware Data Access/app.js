const express = require('express');
const usersRouter = require('./routes/users');
const projectsRouter = require('./routes/projects');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    name: 'CorpFlow SaaS API',
    version: '1.0.0-beta',
    status: 'online',
    message: 'Welcome to the CorpFlow internal workforce management API.'
  });
});

app.use('/users', usersRouter);
app.use('/projects', projectsRouter);
app.use((req, res) => res.status(404).json({ error: 'Endpoint not found.' }));

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`CorpFlow SaaS API running on port ${PORT}`);
  });
}

module.exports = app;
