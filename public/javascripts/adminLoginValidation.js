var psdError = document.getElementById('psd-error');
var emailError = document.getElementById('email-error');

const form = document.getElementById('form');

function validName() {

    var name = document.getElementById('inputAdmin').value;

    if (name.length == 0) {
        emailError.innerHTML = 'Admin is required....';
        return false;
    }
    if (! name.match(/^[A-Za-z]*$/)) {
        emailError.innerHTML = 'Invalid  Format....';
        return false;
    }
    emailError.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
    return true;
}

function validPsd() {

    var psd = document.getElementById('inputAdminPassword').value;
    if (psd.length == 0) {
        psdError.innerHTML = 'Password is required';
        return false;
    }
    if (psd.length < 3) {
        psdError.innerHTML = 'Password must be atleast 3 charecters ';
        return false;
    }
    /*if(!psd.match(/((?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%?=*&]).{8,20})/)){
psdError.innerHTML= 'Password has invalid syntax';
return false;
}*/
    psdError.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
    return true;
}
function formValid() {
    if (! validName() || ! validPsd()) {
        return false;
    }
    return true;
}