function cancelOrder(ordId){
    $.ajax({
        url:'/cancel-order/'+ordId,
        method:'post',
        success:(responce)=>{
            if(responce.dateError){
                    Swal.fire({
                    title: 'Sorry',
                    text: "Return date exceeded....",
                    icon: 'error',
                    showCancelButton: false,
                    confirmButtonColor: '#11B619',
                    cancelButtonColor: '#A19391',
                    confirmButtonText: 'Ok'
                    }).then((result) => {
                         if (result.isConfirmed) {
                                                $('#wallet').html(count)=parseInt(responce.walletBal)
                                                //document.getElementById('wallet').innerHTML=responce.walletBal
                                                location.reload()
                                                }
                    })
            }else if(responce.pendingError){
                Swal.fire({
                    title: 'Sorry',
                    text: "Order is pending....",
                    icon: 'error',
                    showCancelButton: false,
                    confirmButtonColor: '#11B619',
                    cancelButtonColor: '#A19391',
                    confirmButtonText: 'Ok'
                    }).then((result) => {
                         if (result.isConfirmed) {
                                                $('#wallet').html(count)=parseInt(responce.walletBal)
                                                location.reload()
                                                }
                    })
            }else if(responce.orderDeleted){
                    Swal.fire({
                    title: 'Success',
                    text: "Order Canceled Successfully",
                    icon: 'success',
                    showCancelButton: false,
                    confirmButtonColor: '#11B619',
                    cancelButtonColor: '#A19391',
                    confirmButtonText: 'Ok'
                    }).then((result) => {
                         if (result.isConfirmed) {
                                                //document.getElementById('wallet').innerHTML=responce.walletBal
                                                location.reload()
                                                }
                    })
            }else{
                    Swal.fire({
                    title: 'Error',
                    text: "Server Error",
                    icon: 'error',
                    showCancelButton: false,
                    confirmButtonColor: '#11B619',
                    cancelButtonColor: '#A19391',
                    confirmButtonText: 'Ok'
                    }).then((result) => {
                         if (result.isConfirmed) {
                                                location.href='/'
                                                }
                    })
            }
        }
    })
}