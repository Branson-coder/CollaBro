require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const tasksRoutes = require('./routes/tasks');
const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('Backend running'));
app.use('/auth', authRoutes);
app.use('/tasks', tasksRoutes);
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
