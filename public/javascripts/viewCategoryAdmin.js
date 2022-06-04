$(function () {
  $("#categorytable").DataTable();
});
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
        url: "/admin/delete-category?id=" + id,
        method: "get",
        success: (responce) => {
          if (responce.success) {
            location.reload();
          }
        },
      });
    }
  });
}
