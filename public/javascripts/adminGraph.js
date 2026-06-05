//Getting data from page
let placed=document.getElementById('placed').value;
let pending=document.getElementById('pending').value;
let orderpro=document.getElementById('orderpro').value;
let orderout=document.getElementById('orderout').value;
let ordrdel=document.getElementById('ordrdel').value;
let paypal=document.getElementById('paypal').value;
let cod=document.getElementById('cod').value;
let razor=document.getElementById('razor').value;

//bar chart-------
const ctx = document.getElementById('myChart');
const myChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['Placed', 'Pending', 'Under Process', 'Out for delivery', 'Canceled'],
        datasets: [{
            label: 'Orders',
            data: [parseInt(placed), parseInt(pending),parseInt(orderpro), parseInt(orderout), parseInt(ordrdel)],
            backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)'
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)'
            ],
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true,
                title: {
                  color: 'blue',
                  display: true,
                  text: 'Number of orders'
                }
            }
        }
    }
});

//donut chart------
const data = {
  labels: [
    'Paypal',
    'COD',
    'Razor Pay'
  ],
  datasets: [{
    label: 'My First Dataset',
    data: [parseInt(paypal), parseInt(cod), parseInt(razor)],
    backgroundColor: [
      'rgb(255, 99, 132)',
      'rgb(54, 162, 235)',
      'rgb(255, 205, 86)'
    ],
    hoverOffset: 4
  }]
};
const config = {
  type: 'doughnut',
  data: data,

};




//line chart------
function salesChart(){
const ctxdon = document.getElementById('donChart');
const donChart = new Chart(ctxdon, config)
let monthData=[0,0,0,0,0,0,0,0,0,0,0,0]
  $.ajax({
    url:'/admin/get-line-data',
    data:{},
    method:'post',
    success:(response)=>{
     
      
      for(i=0;i<12;i++){
        for(j=0;j<response.data.length;j++){
          if(i===parseInt(response.data[j]._id)-1){
            monthData[i]=(response.data[j].totalAmount)/100
          }
        }
        }
        
    console.log(monthData);

  const labels = ['Jan','Feb','Mar','Apr','May','Jun','July','Aug','Sep','Oct','Nov','Dec'];
  const data1 = {
    labels: labels,
    datasets: [{
      label: 'Year Dataset',
      data: monthData,
      fill: true,
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.5
    }]
  };
  const config1 = {
    type: 'line',
    data: data1,
    options: {
      scales: {
        x: {
          title: {
            color: 'white',
            display: true,
            text: 'Month'
          }
        },
        y: {
          title: {
            color: 'white',
            display: true,
            text: 'Percentage'
          }
        }
      }
    }
  };
const ctxline = document.getElementById('lineChart');
const lineChart = new Chart(ctxline, config1)
}})}
  

//------
