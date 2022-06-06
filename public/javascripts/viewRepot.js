function getPdf(){
     let sdate=document.getElementById('startDate').value
     let edate=document.getElementById('endDate').value
      if(sdate=='' || edate=='' || sdate>edate){
           Swal.fire('Invalid Date Formats') 
        }else{
             $.ajax({
                url:'/pdf/limitpdf', 
                method:'post', 
                data:{ sdate:sdate, edate:edate },
                success:(responce)=>{
                     if(responce.status){
                          location.href='/documents/'+responce.file 
                        } 
                    } 
                }) 
            } 
        } 
    function getXml(){
         let sdate=document.getElementById('startDate').value 
         let edate=document.getElementById('endDate').value 
            if(sdate=='' || edate=='' || sdate>edate){
                 Swal.fire('Invalid Date Formats') 
                }else{
                     $.ajax({
                        url:'/pdf/limitxml', 
                        method:'post', 
                        data:{ sdate:sdate, edate:edate },
                        success:(responce)=>{
                             if(responce.status){
                                    location.href='/documents/'+responce.file+'.xlsx' 
                                } 
                            } 
                        }) 
                    } 
                }