document.addEventListener('DOMContentLoaded', ()=>{
    console.log('Hello')
    //request();
    document.getElementById('loginForm').reset();
    //registerNew();
})

async function login(event) {
    event.preventDefault();

    const role = document.getElementById('user-role').value;
    const name = document.getElementById('username').value;
    const pass = document.getElementById('pass').value;

    if (!name || !pass) {
        alert('Fill up all fields!');
        return;
    }

    const data = {
        role: role,
        username: name,
        pass: pass,
    };

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(data),
        });
        
        const responseData = await response.json();
        
        if (response.ok) {
            const token = responseData.token;
            localStorage.setItem('jwtToken', token);
        
            // Redirect to UserSide.html or perform any other actions
            if(role == 'user')
            window.location.href = 'UserSide.html';
            else window.location.href = 'AdminSide.html';
        } else {
            // Handle login failure
            console.error('Error:', responseData.message);
            alert('Login failed. Please check your credentials.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
}
