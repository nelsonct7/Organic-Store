var catError = document.getElementById("category-error");
var desError = document.getElementById("description-error");
function viewImage(event) {
  document.getElementById("imgView1").src = URL.createObjectURL(
    event.target.files[0]
  );
}

function validCategory() {
  let categ = document.getElementById("cate").value;

  if (categ.length == 0) {
    catError.innerHTML = "Invalid format....";
    return false;
  }
  if (!categ.match(/^[A-Za-z]*$/)) {
    catError.innerHTML = "Invalid format....";
    return false;
  }
  catError.innerHTML = " ";
  return true;
}

function validCategoryDes() {
  let des = document.getElementById("catedes").value;
  if (des.length == 0) {
    DesError.innerHTML = "Invalid format....";
    return false;
  }
  if (!des.match(/^[A-Za-z ]*$/)) {
    desError.innerHTML = "Invalid format....";
    return false;
  }
  desError.innerHTML = " ";
  return true;
}

function validForm() {
  if (!validCategory() || !validCategoryDes()) {
    return false;
  }
  return true;
}
