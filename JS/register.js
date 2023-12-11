document.addEventListener('DOMContentLoaded', ()=>{
    console.log('Hello')
    //request();
    document.getElementById('regForm').reset();
    //registerNew();
})

async function registerNew(event){

    event.preventDefault();

    const name = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    const reconfirm = document.getElementById('confirm-password').value;
    const email = document.getElementById('email').value;
    console.log(name, pass, reconfirm, email)

    if(pass !== reconfirm){
        alert('Passwords Must Match!')
        return;
    }
    if(!name || !pass || !reconfirm || !email){
        alert('Fillup all fields!')
        return;
    }
    const data = {
        username: name, // Ensure the property name is 'username'
        pass: pass,
        email: email,
    };

    try {
        const response = await fetch('/new', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(data),
        });
        const responseData = await response.json();
        // if(responseData.message.includes('Username already exists.')){
        //     alert('Username already exists.');
        // }
        // else{
        //     alert('User Created!')
        // }
        console.log(responseData);
    } catch (error) {
        if (error.message.includes('Username already exists.')) {
            alert('Username already exists. Please choose a different username.');
        } else {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        }
    }
}