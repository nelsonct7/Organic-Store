//functions for payment
var paymethod=null
function addPayment(str){
    paymethod=str
}

function validatePayment(addressId){
    if(paymethod==null){
        Swal.fire({
            title: 'Select',
            text: "Please select a payment option",
            icon: 'warning',
            showCancelButton: false,
            confirmButtonColor: '#A19391',
            cancelButtonColor: '#A19391',
            confirmButtonText: 'Ok'
            }).then((result) => {
                 if (result.isConfirmed) {
                                        location.reload()
                                        }
            })
    }
    else if(paymethod==='cod' || paymethod==='razor' || paymethod==='paypal'){
        $.ajax({
            url:'/place-order',
            data:{
                addressId:addressId,
                paymentOptions:paymethod
            },
            method:'post',
            success:(response)=>{
                
                if(response.codSuccess){
                    Swal.fire({
                        title: 'Success',
                        text: "Order Placed Success fully",
                        icon: 'success',
                        showCancelButton: false,
                        confirmButtonColor: '#11B619',
                        cancelButtonColor: '#A19391',
                        confirmButtonText: 'Ok'
                        }).then((result) => {
                             if (result.isConfirmed) {
                                                    window.location.href='/';
                                                    }
                        })
                    
                }
                else if(response.razorSuccess){
                   // console.log("\nDAta : "+JSON.stringify(response));
                    let data=response.order
                    let user=response.user
                    razorPayment(data,user)

                    // Swal.fire({
                    //     title: 'Success',
                    //     text: "Order Placed Success fully Using Razor pay",
                    //     icon: 'success',
                    //     showCancelButton: false,
                    //     confirmButtonColor: '#11B619',
                    //     cancelButtonColor: '#A19391',
                    //     confirmButtonText: 'Ok'
                    //     }).then((result) => {
                    //          if (result.isConfirmed) {
                    //                                 window.location.href='/';
                    //                                 }
                    //     })

                }
                else if(response.paypalSuccess){
                    data=response.data
                    //console.log("EEEEEEEEEee"+JSON.stringify(data))
                    for(i=0;i<data.links.length;i++){
                        if(data.links[i].rel==='approval_url'){
                            window.location.href=(data.links[i].href);
                        }
                    }

                       
                }else{
                    Swal.fire({
                        title: 'Failed',
                        text: "Ajax Error",
                        icon: 'warning',
                        showCancelButton: false,
                        confirmButtonColor: '#11B619',
                        cancelButtonColor: '#A19391',
                        confirmButtonText: 'Ok'
                        }).then((result) => {
                             if (result.isConfirmed) {
                                                    window.location.href='/';
                                                    }
                        })
                }
                
            }

            
        })

    }else{
        Swal.fire({
            title: 'Failed',
            text: "Ajax Error",
            icon: 'warning',
            showCancelButton: false,
            confirmButtonColor: '#11B619',
            cancelButtonColor: '#A19391',
            confirmButtonText: 'Ok'
            }).then((result) => {
                 if (result.isConfirmed) {
                                        window.location.href='/';
                                        }
            })

    }
}

function razorPayment(data,user){
    // console.log(JSON.stringify(data));
    var options = {
        "key": "rzp_test_PXSooyoIiq4q2A", // Enter the Key ID generated from the Dashboard
        "amount": data.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        "currency": "INR",
        "name": "Organic Store",
        "description": "Test Transaction",
        "image": "",
        "order_id": data.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
        "handler": function (response){
            // alert(response.razorpay_payment_id);
            // alert(response.razorpay_order_id);
            // alert(response.razorpay_signature)

            verifyPayment(response,data)
        },
        "prefill": {
            "name": user.user_name,
            "email": user.user_email,
            "contact": user.user_mobile
        },
        "notes": {
            "address": "Razorpay Corporate Office"
        },
        "theme": {
            "color": "#2ad418"
        }
    };
    var rzp1 = new Razorpay(options);
    rzp1.open();
    // rzp1.on('payment.failed', function (response){
    //         alert(response.error.code);
    //         alert(response.error.description);
    //         alert(response.error.source);
    //         alert(response.error.step);
    //         alert(response.error.reason);
    //         alert(response.error.metadata.order_id);
    //         alert(response.error.metadata.payment_id);
    // });
}
function verifyPayment(resp,order){
    $.ajax({
        url:'/verifyPayment',
        data:{
            resp,
            order
        },
        method:'post',
        success:(responce)=>{
            Swal.fire({
                title: 'Success',
                text: "Payment Success",
                icon: 'succes',
                showCancelButton: false,
                confirmButtonColor: '#11B619',
                cancelButtonColor: '#A19391',
                confirmButtonText: 'Ok'
                }).then((result) => {
                     if (result.isConfirmed) {
                                            window.location.href='/';
                                            }
                })
        }
    })
}
function paypalPayment(payResponse){
    
}
