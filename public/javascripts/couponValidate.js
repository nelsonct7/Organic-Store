let offerError = document.getElementById("offer-error");
let couponError = document.getElementById("coupon-error");
function validateOffer() {
  let offer = document.getElementById("offeramount").value;
  if (offer > 90) {
    offerError.innerHTML = "Invalid percentage";
    return false;
  }
  offerError.innerHTML = "";
  return true;
}

function validateCoupon() {
  let couponName = document.getElementById("couponcode").value;
  if (couponName.length != 7) {
    couponError.innerHTML = "Invalid coupon code syntex";
    return false;
  }
  couponError.innerHTML = "";
  return true;
}
function validateForm() {
  if (!validateOffer() || !validateCoupon()) {
    return false;
  }
  return true;
}
