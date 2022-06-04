function validateForm() {
  //let walletAmnt=document.getElementById('wallet').innerHTML
  //alert(walletAmnt)
  var radios = document.getElementsByName("arrdessIndex");
  var formValid = false;

  var i = 0;
  while (!formValid && i < radios.length) {
    if (radios[i].checked) formValid = true;
    i++;
  }

  if (!formValid) {
    Swal.fire({
      title: "Warning",
      text: "Please select one address",
      icon: "warning",
      showCancelButton: false,
      confirmButtonColor: "#11B619",
      cancelButtonColor: "#A19391",
      confirmButtonText: "Ok",
    });
  }
  return formValid;
}
let alertCoupon = document.getElementById("couponAlert");

function validateCoupon() {
  let coupon = document.getElementById("coupon").value;
  let walletAmnt = document.getElementById("wallet").innerHTML;

  if (coupon.length != 7) {
    alertCoupon.innerHTML = "Invalid Coupon";
  } else {
    $.ajax({
      url: "/check-coupon/" + coupon,
      method: "post",
      success: (response) => {
        if (response.couponInvalid) {
          Swal.fire({
            title: "Failed",
            text: "Invalid Coupon",
            icon: "warning",
            showCancelButton: false,
            confirmButtonColor: "#11B619",
            cancelButtonColor: "#A19391",
            confirmButtonText: "Ok",
          });
        } else if (response.couponExpired) {
          Swal.fire({
            title: "Failed",
            text: "Coupon Expired",
            icon: "warning",
            showCancelButton: false,
            confirmButtonColor: "#11B619",
            cancelButtonColor: "#A19391",
            confirmButtonText: "Ok",
          });
        } else if (response.couponUsed) {
          Swal.fire({
            title: "Failed",
            text: "You already used this coupon",
            icon: "warning",
            showCancelButton: false,
            confirmButtonColor: "#11B619",
            cancelButtonColor: "#A19391",
            confirmButtonText: "Ok",
          });
        } else if (response.couponSuccess) {
          Swal.fire({
            title: "Success",
            text: "Coupon Applied Successfully",
            icon: "success",
            showCancelButton: false,
            confirmButtonColor: "#11B619",
            cancelButtonColor: "#A19391",
            confirmButtonText: "Ok",
          }).then((result) => {
            if (result.isConfirmed) {
              document.getElementById("coupon").disabled = true;
              document.getElementById("totalView").innerHTML =
                response.couponTotal;
              document.getElementById("total").value = response.couponTotal;

              let amnt = response.couponTotal;

              if (response.couponTotal > walletAmnt) {
                amnt = response.couponTotal - walletAmnt;
                walletAmnt = 0;
              } else if (response.couponTotal < walletAmnt) {
                walletAmnt = walletAmnt - response.couponTotal;
                amnt = 0;
              } else {
                walletAmnt = 0;
                amnt = 0;
              }
              document.getElementById("totalView1").innerHTML = walletAmnt;
              document.getElementById("wallet").value = walletAmnt;
              document.getElementById("totalView2").innerHTML = amnt;
              document.getElementById("amountPay").value = amnt;
            }
          });
        } else {
          Swal.fire({
            title: "Warning",
            text: "Ajax Error",
            icon: "warning",
            showCancelButton: false,
            confirmButtonColor: "#11B619",
            cancelButtonColor: "#A19391",
            confirmButtonText: "Ok",
          });
        }
      },
    });
  }
}
