var globalname = "I'm a global variable";
// Fetch user information and update the HTML
fetchTasks();
document.addEventListener('DOMContentLoaded', () => {
    
    const token = localStorage.getItem('jwtToken');
    // Do something with the token (e.g., send it in headers for authenticated requests)
    if (token) {
        fetchUserInfo();
        
        console.log('Token:', token);
    } else {
        // Token not found, handle accordingly
        console.log('Token not found');
    }
    const taskForm = document.getElementById('taskForm');
    const taskList = document.getElementById('taskList');
    const priorityFilter = document.getElementById('priorityFilter');
    const compFilter = document.getElementById('compFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    const dateSortCheckbox = document.getElementById('dateSortCheckbox');
    const searchInput = document.getElementById('search'); // Add this line

    taskForm.addEventListener('submit', createTask);
    taskList.addEventListener('click', handleTaskListClick);

    //fetchTasks();

    priorityFilter.addEventListener('change', fetchTasks);
    compFilter.addEventListener('change', fetchTasks);
    categoryFilter.addEventListener('change', fetchTasks);
    dateSortCheckbox.addEventListener('change', fetchTasks);
    //searchButton.addEventListener('click', handleSearch); // Add this line
    searchInput.addEventListener('input', () => {
        fetchTasks();
    });


    //fetchTasks();
});

async function fetchUserInfo() {
    try {
        const token = localStorage.getItem('jwtToken');
        
        if (token) {
            const headers = {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            };

            const response = await fetch('/user-info', { headers });
            const userData = await response.json();

            console.log('User Info:', userData);
            globalname = userData.username;

            // Update the HTML with user information
            document.getElementById('username').innerText = userData.username;
            document.getElementById('email').innerText = userData.email;
        } else {
            console.log('Token not found');
        }
    } catch (error) {
        console.error('Error fetching user information:', error);
    }
}



window.onload = function () {
    resetFormInputs();
    fetchUserInfo()
        .then(() => {
            fetchTasks();
        });
};

function resetFormInputs() {
    const titleInput = document.getElementById('title');
    const descriptionInput = document.getElementById('description');
    const dueDateInput = document.getElementById('dueDate');
    const priorityInput = document.getElementById('priority');
    const categoryInput = document.getElementById('category');
    const priorityFilter = document.getElementById('priorityFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    const searchInput = document.getElementById('search'); // Add this line

    priorityFilter.value = '';
    categoryFilter.value = '';
    searchInput.value = ''; // Add this line
    titleInput.value = '';
    descriptionInput.value = '';
    dueDateInput.value = '';
    priorityInput.value = '';
    categoryInput.value = '';
}

function fetchTasks() {
    const priorityFilter = document.getElementById('priorityFilter').value;
    const compFilter = document.getElementById('compFilter').value;
    const categoryFilter = document.getElementById('categoryFilter').value;
    const dateSortCheckbox = document.getElementById('dateSortCheckbox');
    const searchQuery = document.getElementById('search').value.trim().toLowerCase();
    //alert(searchQuery);
    let apiUrl = `/api/tasks?priority=${priorityFilter}&completed=${compFilter}&category=${categoryFilter}&user=${globalname}`;

    if (searchQuery) {
        apiUrl += `&search=${encodeURIComponent(searchQuery)}`;
    }

    fetch(apiUrl)
        .then(response => response.json())
        .then(tasks => {
            const taskList = document.getElementById('taskList');
            taskList.innerHTML = '';

            if (dateSortCheckbox.checked) {
                tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
            }

            tasks.forEach(task => {
                const taskItem = createTaskElement(task);
                taskList.appendChild(taskItem);
            });
        })
        .catch(error => console.error('Error fetching tasks:', error));
}

// Add this function for handling the search button click
function handleSearch() {
    fetchTasks();
}

// The rest of your existing functions remain unchanged...

function createTaskElement(task) {
    const taskTile = document.createElement('div');
    taskTile.classList.add('task-tile');
    const dueDate = new Date(task.dueDate);
    taskTile.innerHTML = `
        <h2>${task.title}</h2>
        <p>Description: ${task.description}</p>
        <p>Due Date   : ${dueDate.toLocaleDateString()}</p>
        <p>Priority   : ${task.priority}</p>
        <p>Category   : ${task.category}</p>
        <p>Completed  : ${task.completed ? 'Yes' : 'No'}</p>
        <button class="delete-button" data-task-id="${task._id}">Delete Task</button>
        <button class="complete-button" data-task-id="${task._id}">Complete Task</button>
    `;

    if (task.completed) {
        taskTile.classList.add('completed');
        console.log('Task marked as completed:', task._id);
    }

    return taskTile;
}

function handleTaskListClick(event) {
    const target = event.target;

    if (target.classList.contains('delete-button')) {
        const taskId = target.dataset.taskId;
        deleteTask(taskId);
    } else if (target.classList.contains('complete-button')) {
        const taskId = target.dataset.taskId;
        completeTask(taskId);
    }
}

function deleteTask(taskId) {
    fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
    })
        .then(response => response.json())
        .then(result => {
            console.log(result.message);
            fetchTasks();
        })
        .catch(error => console.error('Error deleting task:', error));
}

function completeTask(taskId) {
    fetch(`/api/tasks/${taskId}/complete`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(response => response.json())
        .then(updatedTask => {
            console.log('Task completed:', updatedTask);
            fetchTasks();
        })
        .catch(error => console.error('Error completing task:', error));
}

function createTask(event) {
    event.preventDefault();

    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const dueDate = document.getElementById('dueDate').value;
    const priority = document.getElementById('priority').value;
    const category = document.getElementById('category').value;

    const taskData = {
        title,
        description,
        dueDate,
        priority,
        category,
        completed: false,
        user: globalname,
    };

    fetch('/api/tasks', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
    })
        .then(response => response.json())
        .then(newTask => {
            console.log('Task created:', newTask);
            fetchTasks();
            resetFormInputs();
        })
        .catch(error => console.error('Error creating task:', error));
}

//For logging out
function logout() {
    // Remove the token from localStorage
    localStorage.removeItem('jwtToken');

    // Redirect to the login page
    window.location.href = '/login.html'; // Replace '/login' with your actual login page URL
}
document.getElementById('logoutButton').addEventListener('click', logout);