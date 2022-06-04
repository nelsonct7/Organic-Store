var categoryError = document.getElementById("category-error");
function validCategory() {
  var title = document.getElementById("category-name").value;
  alert('title : ')
  if (title === '') {
    titleError.innerHTML = "Category name is required";
    return false;
  }
  if (!title.match(/^[A-Za-z]*$/)) {
    titleError.innerHTML = "Invalid format";
    return false;
  }
  titleError.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
  return true;
}
