const PORT = 3000

require('dotenv').config();

const nodemailer = require('nodemailer');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
    },
});

const app = express();
mongoose.connect('mongodb://localhost/securedtms', {
})
    .then(() => console.log('Connected to the database'))
    .catch(err => console.error('Error connecting to the database:', err));
app.use(bodyParser.json());
app.use(express.static(__dirname));

const taskSchema = new mongoose.Schema({
    title: String,
    description: String,
    dueDate: Date,
    priority: String,
    category: String,
    completed: Boolean,
    user: String,
});

const Task = mongoose.model('Task', taskSchema);

const userSchema = new mongoose.Schema({
    username: String,
    pass: String,
    email: String,
    role: {
        type: String,
        default: 'user'
    }
});

const User = mongoose.model('User', userSchema);

app.use('/JS', express.static(path.join(__dirname, '..', 'JS'), { 'Content-type': 'application/javascript' }));
app.use(express.static(path.join(__dirname, '..', 'Client')));
app.use('/CSS', express.static(path.join(__dirname, '../CSS')));

// Define your API endpoints here

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'Client', 'Login.html'));
})

app.post('/new', async (req, res) => {
    const { username, pass, email } = req.body;
    //console.log('Request Approaching!', username, pass);

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists.' });
        }

        const hashedPassword = await bcrypt.hash(req.body.pass, 10);
        const userInfo = new User({
            username: username,
            pass: hashedPassword,
            email: email
        });
        console.log('User created:', userInfo);

        await userInfo.save();
        console.log('User saved:', userInfo);

        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: email,
            subject: 'Registration Successful',
            text: 'Thank you for registering with our application!',
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });

        res.status(201).json(userInfo);
    } catch (error) {
        console.error('Error saving user:', error);
        res.status(500).send(error.message);
    }
});
// Endpoint to get all users with relevant information
// Endpoint to get all users with relevant information
app.get('/api/users', async (req, res) => {
    try {
        const usersInfo = await User.aggregate([
            {
                $match: { role: { $ne: 'admin' } },
            },
            {
                $lookup: {
                    from: 'tasks', // Assuming your tasks collection is named 'tasks'
                    localField: 'username',
                    foreignField: 'user',
                    as: 'tasks',
                },
            },
            {
                $project: {
                    _id: 0,
                    username: 1,
                    totalTasks: { $size: '$tasks' },
                    completedTasks: {
                        $size: {
                            $filter: {
                                input: '$tasks',
                                as: 'task',
                                cond: { $eq: ['$$task.completed', true] },
                            },
                        },
                    },
                    incompleteTasks: {
                        $size: {
                            $filter: {
                                input: '$tasks',
                                as: 'task',
                                cond: { $eq: ['$$task.completed', false] },
                            },
                        },
                    },
                },
            },
        ]);

        res.json(usersInfo);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.delete('/api/users/:username', async (req, res) => {
    const usernameToDelete = req.params.username;

    try {
        const deletedUser = await User.findOneAndDelete({ username: usernameToDelete });

        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully', deletedUser });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.put('/api/update/:id', async (req, res) => {
    const taskId = req.params.id;
    const { description } = req.body;

    try {
        // Update the task in the database
        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            { description },
            { new: true }
        );
        if (!updatedTask) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.json({ message: 'Task updated successfully', updatedTask });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

app.post('/login', async (req, res) => {
    const { role, username, pass } = req.body;
    console.log(req.body)

    try {
        console.log(username)
        const existingUser = await User.findOne({ username: username, role: role });
        console.log(existingUser);

        if (!existingUser || !(await bcrypt.compare(pass, existingUser.pass))) {
            return res.status(401).json({ message: 'Bad credentials!' });
        }

        // Generate a JWT token
        const token = jwt.sign(
            { username: existingUser.username, email: existingUser.email },
            '200041106',
            { expiresIn: '1h' }
        );

        console.log('Generated Token:', token);

        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Error logging in' });
    }
});

const getUserInfoFromToken = (req) => {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];

    if (token) {
        try {
            const decoded = jwt.verify(token, '200041106');
            return decoded;
        } catch (error) {
            console.error('Error decoding JWT:', error);
            return null;
        }
    }

    return null;
};

app.get('/user-info', (req, res) => {
    const userInfo = getUserInfoFromToken(req);
    console.log(userInfo);
    if (userInfo) {
        res.status(200).json({
            username: userInfo.username,
            email: userInfo.email,
        });
    } else {
        res.status(401).json({ message: 'Unauthorized' });
    }
});

app.post('/api/tasks', async (req, res) => {
    try {
        const task = new Task(req.body);
        await task.save();
        res.status(201).json(task);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.get('/api/tasks', async (req, res) => {
    try {
        const { priority, completed, category, search, user } = req.query;
        let filters = { user: user };

        // Add filters if provided
        if (priority) filters.priority = priority;

        // Handle completion filter
        if (completed && completed !== 'All') {
            filters.completed = completed === 'Completed';
        }

        if (category) filters.category = category;

        let tasks = await Task.find(filters);

        // Handle search query
        if (search) {
            const searchRegex = new RegExp(search, 'i'); // Case-insensitive search
            tasks = tasks.filter(task => task.title.match(searchRegex));
        }

        res.json(tasks);
    } catch (error) {
        res.status(500).send(error.message);
    }
});


app.delete('/api/tasks/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;
        const deletedTask = await Task.findByIdAndDelete(taskId);

        if (!deletedTask) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json({ message: 'Task deleted successfully', deletedTask });
    } catch (error) {
        res.status(500).send(error.message);
    }
});
app.put('/api/tasks/:taskId/complete', async (req, res) => {
    try {
        const { taskId } = req.params;
        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            { completed: true },
            { new: true }
        );

        if (!updatedTask) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json(updatedTask);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.listen(PORT, () => {
    console.log('Server is listening!')
})