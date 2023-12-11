document.addEventListener('DOMContentLoaded', () => {
    fetchUsers();
    fetchUserInfo();
});

async function fetchUsers() {
    try {
        const response = await fetch('/api/users');
        const users = await response.json();

        renderUserTable(users);
    } catch (error) {
        console.error('Error fetching users:', error);
    }
}

function renderUserTable(users) {
    const userTableContainer = document.getElementById('userTableContainer');

    // Clear existing content
    userTableContainer.innerHTML = '';

    // Create a table element
    const table = document.createElement('table');
    table.classList.add('table', 'table-bordered', 'mt-4');

    // Create table headers
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Username</th>
            <th>Total Tasks</th>
            <th>Pending Tasks</th>
            <th>Completed Tasks</th>
            <th>Delete User</th>
        </tr>
    `;
    table.appendChild(thead);

    // Create table body
    const tbody = document.createElement('tbody');
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.username}</td>
            <td>${user.totalTasks}</td>
            <td>${user.incompleteTasks}</td>
            <td>${user.completedTasks}</td>
            <td><button class="btn btn-danger" onclick="deleteUser('${user.username}')">Delete</button></td>
        `;
        tbody.appendChild(row);
    });
    table.appendChild(tbody);

    // Append the table to the container
    userTableContainer.appendChild(table);
}

function deleteUser(username) {
    // Confirm deletion with the user (optional)
    const confirmDeletion = confirm(`Are you sure you want to delete the user '${username}'?`);

    if (confirmDeletion) {
        // Make a DELETE request to the server
        fetch(`/api/users/${username}`, {
            method: 'DELETE',
        })
            .then(response => response.json())
            .then(result => {
                console.log(result.message);
                // You can update the table or perform any other actions after successful deletion
                // For example, refreshing the user list
                fetchUsers();
            })
            .catch(error => console.error('Error deleting user:', error));
    }
}

async function fetchUserInfo() {
    try {
        const token = localStorage.getItem('jwtToken');
        
        if (token) {
            console.log(token)
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

function logout() {
    // Remove the token from localStorage
    localStorage.removeItem('jwtToken');

    // Redirect to the login page
    window.location.href = '/login.html'; // Replace '/login' with your actual login page URL
}
document.getElementById('logoutButton').addEventListener('click', logout);