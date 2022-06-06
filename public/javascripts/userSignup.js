var psdError = document.getElementById('upsd-error');
var emailError =
    document.getElementById('uemail-error');
var nameError =
    document.getElementById('name-error');
var mobileError =
    document.getElementById('mobile-error');
var psdConError =
    document.getElementById('uconpsd-error');
const
    form = document.getElementById('form');

function validName() {
    var name =
        document.getElementById('inputEmail33').value;
    if (name.length == 0) {
        nameError.innerHTML = 'Name is required';
        return false;
    }
    if (!name.match(/^[A-Za-z]*$/)) {
        nameError.innerHTML = 'Numbers and SpecialCharectors not allowd '; return false; }
         nameError.innerHTML = ''; return true; } 
    function validEmail(){
        var email = document.getElementById('inputEmail3').value;
        if (email.length == 0) {
            emailError.innerHTML = 'Email is required....';
            return false;
        }
        if (!email.match(/^[A-Za-z\._\-[0-9]*[@][A-Za-z]*[\.][a-z]{2,4}$/)) {
            emailError.innerHTML = 'Invalid Email Format....';
            return false;
        }
        emailError.innerHTML = "";
        return true;
    }

    function validPsd() {
        var psd =
            document.getElementById('inputPassword3').value;
        if (psd.length == 0) {
            psdError.innerHTML = 'Password is required';
            return false;
        }
        if (psd.length <
            3) {
            psdError.innerHTML = 'Password must be atleast 3 charecters ';
            return
            false;
        }
        //if(!psd.match(/((?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%?=*&]).{8,20})/)){
        // psdError.innerHTML= 'Password has invalid syntax'; // return false; //}
        psdError.innerHTML = '';
        return true;
    }

    function validConPsd() {
        var psd =
            document.getElementById('inputPassword3').value;
        var psdCon =
            document.getElementById('inputPassword4').value;
        if (psdCon.length == 0) {
            psdConError.innerHTML = 'This Field is required';
            return false;
        }
        if (psd != psdCon) {
            psdConError.innerHTML = 'Password Miss Match';
            return false;
        }
        psdConError.innerHTML = '';
        return true;
    }

    function validMobile() {
        var mob =
            document.getElementById('inputMobile').value;
        if (!mob.match(/^\d*$/)) {
            mobileError.innerHTML = 'Numbers only';
            return false;
        }
        if (mob.length == 0) {
            mobileError.innerHTML = 'This Field is Required..';
            return false;
        }
        if (mob.length != 10) {
            mobileError.innerHTML = 'Invalid Mobile';
            return false;
        }
        mobileError.innerHTML = '';
        return true;
    }

    function formValid() {
        if (!validName() || !validPsd() || !validEmail() || !validConPsd() || !validMobile()) {
            return false;
        }
        return true;
    }