document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("addProductForm");
  if (!form) return;

  var pendingFiles = [];
  var fileInput = document.getElementById("addFileInput");
  var previewContainer = document.getElementById("addImagePreviews");

  fileInput.addEventListener("change", function () {
    for (var i = 0; i < fileInput.files.length; i++) {
      pendingFiles.push(fileInput.files[i]);
    }
    fileInput.value = "";
    renderPreviews();
  });

  function renderPreviews() {
    previewContainer.innerHTML = "";
    pendingFiles.forEach(function (file, index) {
      var reader = new FileReader();
      reader.onload = function (ev) {
        var div = document.createElement("div");
        div.className = "position-relative";
        div.style.display = "inline-block";
        div.innerHTML =
          '<img src="' + ev.target.result + '" style="width:100px;height:100px;object-fit:cover;border-radius:6px;">' +
          '<button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0" style="border-radius:50%;padding:2px 6px;font-size:12px;line-height:1;" data-index="' + index + '">&times;</button>';
        div.querySelector("button").addEventListener("click", function () {
          pendingFiles.splice(parseInt(this.dataset.index), 1);
          renderPreviews();
        });
        previewContainer.appendChild(div);
      };
      reader.readAsDataURL(file);
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (typeof validForm === "function" && !validForm()) return;

    if (pendingFiles.length === 0) {
      Swal.fire("Error", "Please add at least one image.", "error");
      return;
    }

    Swal.fire({
      title: "Add Product?",
      text: "Are you sure you want to add this product?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#dc2626",
      confirmButtonText: "Yes, add it!",
    }).then(function (result) {
      if (!result.isConfirmed) return;

      var formData = new FormData(form);
      pendingFiles.forEach(function (file) {
        formData.append("image", file);
      });

      var xhr = new XMLHttpRequest();
      xhr.open("POST", "/admin/add-products", true);
      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          window.location.href = "/admin/view-products";
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
