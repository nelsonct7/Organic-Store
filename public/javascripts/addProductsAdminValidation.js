var titleError = document.getElementById('title-error');
var categoryError =
    document.getElementById('category-error');
var descriptionError =
    document.getElementById('description-error');
var imageError =
    document.getElementById('image-error');
var priceError =
    document.getElementById('price-error');
var specError =
    document.getElementById('spec-error');
var gdStockError =
    document.getElementById('gdStock-error');
var statusError =
    document.getElementById('status-error');

function validTitle() {
    var title =
        document.getElementById('title').value;
    if (title.length == 0) {
        titleError.innerHTML = 'Title is required';
        return false;
    }
    if (!title.match(/^[A-Za-z ]*$/)) {
        titleError.innerHTML = 'Invalid format';
        return false;
    }
    titleError.innerHTML = '<i class="fa-solid fa - circle - check "></i>'; return true; } function validCategory(){ var category = document.getElementById('category').value;
    if (category == 'Default') {
        categoryError.innerHTML = 'Please select a category';
        return false;
    }
    psdError.innerHTML = '';
    return true;
}

function validDescription() {
    var description =
        document.getElementById('description').value;
    if (description.length == 0) {
        descriptionError.innerHTML = 'Description is required';
        return false;
    }
    if (description.length > 500) {
        descriptionError.innerHTML = 'Description Should not exceed 50 Charectors'; return false; } descriptionError.innerHTML = ''; return true; } function validImage(){
        var image = document.getElementById('formFile').value;
         if (image == null) {
            imageError.innerHTML = 'Please select 2 images'; return false; } if(image.length<2){ imageError.innerHTML='Please select 2 images...';
            return false;
        } psdError.innerHTML = ''; return true; } 
        function validPrice(){
        var title = document.getElementById('price').value;
        if (title.length == 0) {
            priceError.innerHTML = 'Price is required';
            return false;
        }
        if (!title.match(/^\d*$/)) {
            priceError.innerHTML = 'Invalid format';
            return
            false;
        }
        priceError.innerHTML = '';
        return true;
    }

    function validSpecification() {
        var spec =
            document.getElementById('spec').value;
        if (spec.length == 0) {
            specError.innerHTML = 'Specification is required is required';
            return false;
        }
        if (!title.match(/^[A-Za-z ]*$/)) {
            specError.innerHTML = 'Invalid format';
            return false;
        }
        specError.innerHTML = ''; return true; } 
        function validGdStock(){ var gdStock =
        document.getElementById('gdStock').value;
        if (gdStock.length == 0) {
            gdStockError.innerHTML = 'Stock is required';
            return false;
        }
        if (!gdStock.match(/^\d*$/)) {
            gdStockError.innerHTML = 'Invalid format';
            return false;
        }
        gdStockError.innerHTML = ''; return true; } 
        function validStatus(){ var sta =
        document.getElementById('spec').value;
        if (sta.length == 0) {
            statusError.innerHTML = 'Status is required';
            return false;
        }
        if (!sta.match(/^[A-Za-z ]*$/)) {
            statusError.innerHTML = 'Invalid format';
            return false;
        }
        statusError.innerHTML = ''; return true; } 
        function validForm(){ if(!validTitle() ||
            !validCategory() || !validDescription() || !validImage() || validPrice()) {
        return false;
    }
}