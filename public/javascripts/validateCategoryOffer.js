let offerError=document.getElementById('offer-error')
 function validateOffer()
    {
         let offer=document.getElementById('offeramount').value
        if(offer>90)
            {
                 offerError.innerHTML='Invalid Percentage'
                  return false
                 }
    offerError.innerHTML=''
     return true
     }