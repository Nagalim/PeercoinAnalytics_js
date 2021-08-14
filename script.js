    var rawdata = null;
    let txndate = [];
    let txnamount = [];
    function impdata()
    {
        try{
        var reader = new FileReader();	
        reader.onload = function (e) {rawdata = e.target.result};
        reader.readAsText(document.getElementById('fileInput').files[0]);
        alert("Data Imported");
        }
        catch(err){alert(err);}
    }
    
    function procdata()
    {
        var rows = rawdata.split("\n");
        var TotalAmount = 0;
        var dated = [], amnt = [];
        for (var i=1;i<rows.length-1;i++)
        {
            var thisrow = rows[i].split('","');
            var dating = Date.parse(thisrow[1]);
            dated.push(dating);
            amnt.push(thisrow[5]);
        }
        var result = [], j = -1, k = -1, AmtTot = 0;
        while(dated[++j]){
            result.push([dated[j],amnt[j]]);
            }
        result.sort(function(a,b) {return a[0]-b[0]});
        while(result[++k]){
            AmtTot = AmtTot + parseFloat(result[k][1]);
            result[k][1]= AmtTot;
            txndate.push(result[k][0]);
            txnamount.push(result[k][1]);
            }
        alert("Processed, don't click this again (fix in future versions)")
    }
    
    function plotdata()
    {
    var trace3 = {
      x: txndate,
      y: txnamount,
      mode: 'lines+markers',
      type: 'scatter'
    };
    
    let dater=txndate.toString();
    
    var data = [trace3];
    try{Plotly.newPlot('myDiv', data);}
    catch(err){Alert(err)}
    }