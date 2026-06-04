var pendingFiles = [];

document
  .getElementById("newFileInput")
  .addEventListener("change", function (e) {
    for (var i = 0; i < e.target.files.length; i++) {
      pendingFiles.push(e.target.files[i]);
    }
    this.value = "";
    renderNewPreviews();
  });

function renderNewPreviews() {
  var container = document.getElementById("newImagePreviews");
  container.innerHTML = "";
  pendingFiles.forEach(function (file, index) {
    var reader = new FileReader();
    reader.onload = function (ev) {
      var div = document.createElement("div");
      div.className = "position-relative";
      div.dataset.pendingIndex = index;
      div.innerHTML =
        '<img src="' +
        ev.target.result +
        '" style="width:100px;height:100px;object-fit:cover;border-radius:6px;">' +
        '<button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0" style="border-radius:50%;padding:2px 6px;font-size:12px;line-height:1;" onclick="removePendingImage(' +
        index +
        ')">&times;</button>';
      container.appendChild(div);
    };
    reader.readAsDataURL(file);
  });
}

function removePendingImage(index) {
  pendingFiles.splice(index, 1);
  renderNewPreviews();
}

function deleteExistingImage(imageId, btn) {
  Swal.fire({
    title: "Remove this image?",
    text: "This action cannot be undone.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, remove it",
  }).then(function (result) {
    if (result.isConfirmed) {
      fetch("/admin/delete-product-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: productId, imageId: imageId }),
      })
        .then(function (r) { return r.json().catch(function(){ return {}; }); })
        .then(function (data) {
          if (data.status) {
            btn.closest("div.position-relative").remove();
            var remaining = document.querySelectorAll("#existingImages .position-relative");
            if (remaining.length === 1) {
              var lastBtn = remaining[0].querySelector("button");
              if (lastBtn) lastBtn.remove();
            }
            Swal.fire("Removed", "Image has been removed.", "success");
          } else {
            Swal.fire("Error", data.message || "Failed to remove image.", "error");
          }
        })
        .catch(function (err) {
          Swal.fire("Error", "Something went wrong.", "error");
        });
    }
  });
}

document
  .getElementById("editProductForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    var form = this;
    var formData = new FormData(form);
    pendingFiles.forEach(function (file) {
      formData.append("image", file);
    });
    Swal.fire({
      title: "Update Product?",
      text: "Are you sure you want to update this product?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#dc2626",
      confirmButtonText: "Yes, update it!",
    }).then(function (result) {
      if (result.isConfirmed) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", form.action, true);
        xhr.onload = function () {
          if (xhr.status >= 200 && xhr.status < 300) {
            window.location.href = "/admin/view-products";
          } else {
            document.open();
            document.write(xhr.responseText);
            document.close();
          }
        };
        xhr.send(formData);
      }
    });
  });
