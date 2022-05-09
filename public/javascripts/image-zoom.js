document.getElementById('img-container').addEventListener('mouseover',()=>{
imageZoom('featured')
})


function imageZoom(imgId){
let img=document.getElementById(imgId)
let lens=document.getElementById('lens')
lens.style.backgroundImage=`url(${img.src})`

let ratio = 3
lens.style.backgroundSize =(img.width*ratio)+'px '+(img.height*ratio)+'px'

img.addEventListener("mousemove",moveLens)
lens.addEventListener("mousemove",moveLens)

function moveLens(){
let pos=getCursor()

let positionLeft=pos.x-(lens.offsetWidth/2)
let positionTop=pos.y-(lens.offsetHeight/2)



if(positionLeft<0){
    positionLeft=0
}
if(positionTop<0){
    positionTop=0
}

if(positionLeft > (img.width-lens.offsetWidth/3)){
    positionLeft=img.width-lens.offsetWidth/3
}

if(positionTop > (img.height-lens.offsetWidth/3)){
    positionTop=img.height-lens.offsetWidth/3
}

lens.style.left=positionLeft+'px'
lens.style.top=positionTop+'px'
lens.style.backgroundPosition='-'+(pos.x*ratio)+'px -'+(pos.y*ratio)+'px'

 

}

function getCursor(){

    let ev=window.event
    let bounds=img.getBoundingClientRect()
     
    let x=ev.pageX-bounds.left
    let y=ev.pageY-bounds.top
    return {'x':x,'y':y}
}

}
imageZoom('featured')