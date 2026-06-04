function deleteData(id) {
  Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, delete it!",
  }).then((result) => {
    if (result.isConfirmed) {
      $.ajax({
        url: "/admin/delete-category/" + id,
        method: "delete",
        success: (responce) => {
          if (responce.success) {
            location.reload();
          } else {
            Swal.fire("Error", responce.message || "Failed to delete category.", "error");
          }
        },
        error: (xhr) => {
          var msg = "Failed to delete category.";
          try { var r = JSON.parse(xhr.responseText); if (r.message) msg = r.message; } catch(e) {}
          Swal.fire("Error", msg, "error");
        }
      });
    }
  });
}
