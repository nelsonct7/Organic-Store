var fnameError = document.getElementById('fname-error'); var snameError = document.getElementById('sname-error'); var hnameError = document.getElementById('hname-error'); var streetError = document.getElementById('street-error'); var pinError = document.getElementById('pin-error'); function validFname() {

    var title = document.getElementById('fname').value;

    if (title.length == 0) {
        fnameError.innerHTML = 'First name is required....';
        return false;
    }
    if (!title.match(/^[A-Za-z ]*$/)) {
        fnameError.innerHTML = 'Invalid format....';
        return false;
    }
    fnameError.innerHTML = ' ';
    return true;
}; function validSname() {

    var title = document.getElementById('sname').value;

    if (title.length == 0) {
        snameError.innerHTML = 'Second name is required....';
        return false;
    }
    if (!title.match(/^[A-Za-z ]*$/)) {
        snameError.innerHTML = 'Invalid format....';
        return false;
    }
    snameError.innerHTML = ' ';
    return true;
}; function validHname() {

    var title = document.getElementById('hname').value;

    if (title.length == 0) {
        hnameError.innerHTML = 'House Name is required....';
        return false;
    }
    if (!title.match(/^[A-Za-z ]*$/)) {
        hnameError.innerHTML = 'Invalid format....';
        return false;
    }
    hnameError.innerHTML = ' ';
    return true;
}; function validStreet() {

    var title = document.getElementById('street').value;

    if (title.length == 0) {
        streetError.innerHTML = 'Street is required....';
        return false;
    }
    if (!title.match(/^[A-Za-z ]*$/)) {
        streetError.innerHTML = 'Invalid format....';
        return false;
    }
    streetError.innerHTML = ' ';
    return true;
}; function validPin() {

    var title = document.getElementById('pin').value;

    if (title.length == 0) {
        pinError.innerHTML = 'PIN is required....';
        return false;
    }
    if (title.length !== 6) {
        pinError.innerHTML = 'Invalid PIN....';
        return false;
    }
    if (!title.match(/^\d*$/)) {
        pinError.innerHTML = 'Invalid format....';
        return false;
    }
    pinError.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
    return true;
}; function validForm() {
    if (!validFname() || !validSname() || !validHname() || !validStreet() || !validPin()) {

        return false;
    }
    
    return true;
};

let alertCoupon=document.getElementById('couponAlert')
function validateCoupon(){
coupon=document.getElementById('coupon').value
let walletAmnt=document.getElementById('wallet').innerHTML
if(coupon.length!=7){
alertCoupon.innerHTML='Invalid Coupon'
}else{
$.ajax({
url:'/check-coupon/'+coupon,
method:'post',
success:(response)=>{
if(response.couponInvalid){
Swal.fire({
title: 'Failed',
text: "Invalid Coupon",
icon: 'warning',
showCancelButton: false,
confirmButtonColor: '#11B619',
cancelButtonColor: '#A19391',
confirmButtonText: 'Ok'
}).then((result) => {
             if (result.isConfirmed) {
                                    return false
                                    }
        })

}else if(response.couponExpired){
Swal.fire({
title: 'Failed',
text: "Coupon Expired",
icon: 'warning',
showCancelButton: false,
confirmButtonColor: '#11B619',
cancelButtonColor: '#A19391',
confirmButtonText: 'Ok'
}).then((result) => {
             if (result.isConfirmed) {
                                    return false
                                    }
        })

}else if(response.couponUsed){
Swal.fire({
title: 'Failed',
text: "You already used this coupon",
icon: 'warning',
showCancelButton: false,
confirmButtonColor: '#11B619',
cancelButtonColor: '#A19391',
confirmButtonText: 'Ok'
}).then((result) => {
             if (result.isConfirmed) {
                                    return false
                                    }
        })

}else if(response.couponSuccess){
        Swal.fire({
        title: 'Success',
        text: "Coupon Applied Successfully",
        icon: 'success',
        showCancelButton: false,
        confirmButtonColor: '#11B619',
        cancelButtonColor: '#A19391',
        confirmButtonText: 'Ok'
        }).then((result) => {
             if (result.isConfirmed) {
                                                                                        document.getElementById('coupon').disabled=true
                                    document.getElementById('totalView').innerHTML=response.couponTotal
                                    document.getElementById('total').value=response.couponTotal
                                    
                                    let amnt=response.couponTotal
                                   
                                    if(response.couponTotal>walletAmnt){
                                        amnt=response.couponTotal-walletAmnt
                                        walletAmnt=0
                                       
                                    }else if(response.couponTotal<walletAmnt){
                                        walletAmnt=walletAmnt-response.couponTotal
                                        amnt=0
                                        
                                    }else{
                                        walletAmnt=0
                                        amnt=0 
                                    }
                                    document.getElementById('totalView1').innerHTML=walletAmnt
                                    document.getElementById('wallet').value=walletAmnt
                                    document.getElementById('totalView2').innerHTML=amnt
                                    document.getElementById('amountPay').value=amnt

                                    }
        })
    
}else{
Swal.fire({
title: 'Warning',
text: "Ajax Error",
icon: 'warning',
showCancelButton: false,
confirmButtonColor: '#11B619',
cancelButtonColor: '#A19391',
confirmButtonText: 'Ok'
}).then((result) => {
             if (result.isConfirmed) {
                                    return false
                                    }
        })

}

}
})
}
return false
}