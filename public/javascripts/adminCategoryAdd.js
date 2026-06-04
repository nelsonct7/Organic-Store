var check = document.getElementById('isSubCategory');
var group = document.getElementById('parentDropdownGroup');
if (check && group) {
  check.addEventListener('change', function () {
    group.style.display = this.checked ? 'block' : 'none';
  });
}

var categoryError = document.getElementById('category-error');
function validCategory() {
  var title = document.getElementById('category-name').value;
  if (title === '') {
    categoryError.innerHTML = 'Category name is required';
    return false;
  }
  if (!title.match(/^[A-Za-z\s]+$/)) {
    categoryError.innerHTML = 'Letters and spaces only';
    return false;
  }
  categoryError.innerHTML = '<i class="fa-solid fa-circle-check" style="color: #16a34a;"></i>';
  return true;
}

document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("add-category-form");
  if (!form) return;

  var catFile = null;
  var fileInput = document.getElementById("formFile");
  var previewContainer = document.getElementById("cat-image-preview");

  fileInput.addEventListener("change", function () {
    if (fileInput.files.length > 0) {
      catFile = fileInput.files[0];
    }
    renderPreview();
  });

  function renderPreview() {
    previewContainer.innerHTML = "";
    if (!catFile) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      var div = document.createElement("div");
      div.className = "position-relative";
      div.style.display = "inline-block";
      div.innerHTML =
        '<img src="' + ev.target.result + '" style="width:100px;height:100px;object-fit:cover;border-radius:6px;">' +
        '<button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0" style="border-radius:50%;padding:2px 6px;font-size:12px;line-height:1;">&times;</button>';
      div.querySelector("button").addEventListener("click", function () {
        catFile = null;
        fileInput.value = "";
        renderPreview();
      });
      previewContainer.appendChild(div);
    };
    reader.readAsDataURL(catFile);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validCategory()) return;

    if (!catFile) {
      Swal.fire("Error", "Please select an image.", "error");
      return;
    }

    Swal.fire({
      title: "Add Category?",
      text: "Are you sure you want to add this category?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#dc2626",
      confirmButtonText: "Yes, add it!",
    }).then(function (result) {
      if (!result.isConfirmed) return;

      var formData = new FormData(form);
      formData.set("category_image", catFile);

      var xhr = new XMLHttpRequest();
      xhr.open("POST", "/admin/add-category", true);
      xhr.onload = function () {
        if (xhr.status === 201) {
          window.location.href = "/admin/view-category";
        } else if (xhr.status >= 400) {
          Swal.fire("Error", "Failed to add category", "error");
        } else {
          document.open();
          document.write(xhr.responseText);
          document.close();
        }
      };
      xhr.onerror = function () {
        Swal.fire("Error", "Something went wrong", "error");
      };
      xhr.send(formData);
    });
  });
});
