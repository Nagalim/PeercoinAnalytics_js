var rawdata = null;
let resdata = [];
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

function plotdata(eggs,why)
{
        var trace = {
                x: eggs,
                y: why,
                mode: 'lines+markers',
                type: 'scatter'
        };
        var data = [trace];
        try{Plotly.newPlot('grapharea', data);}
        catch(err){Alert(err)}
}

function procdata()
{
        resdata = []; txndate = []; txnamount = [];
	var rows = rawdata.split("\n");
        var dated = [], amnt = [];
        for (var i=1;i<rows.length-1;i++){
        	var thisrow = rows[i].split('","');
        	var dating = Date.parse(thisrow[1]);
        	dated.push(dating);
        	amnt.push(thisrow[5]);
        }
	var j = -1, k = -1, AmtTot = 0;
        while(dated[++j]){
		resdata.push([dated[j],amnt[j]]);
        }
	resdata.sort(function(a,b) {return a[0]-b[0]});
	while(resdata[++k]){
		dater=resdata[k][0].toString();
                var readate = new Date(resdata[k][0])
        	AmtTot = AmtTot + parseFloat(resdata[k][1]);
		resdata[k].push(readate);
		resdata[k].push(AmtTot);
		txndate.push(readate);
        	txnamount.push(AmtTot);
        }
	plotdata(txndate,txnamount);
        alert("Processed and Graphed")
}
     
function datedata()
{
	var avg = 0;
	var i = -1;
	var mindate = Date.parse(document.getElementById('windowstart').value);
	var maxdate = Date.parse(document.getElementById('windowend').value);
	var len = resdata.length;
	var onswitch = 0;
	while(resdata[++i]){
		if (resdata[i][0]>mindate && resdata[i][0]<maxdate) {
			if (onswitch == 0 && i!=0) {
				avg = avg + resdata[i-1][3]*(resdata[i][0]-mindate);
			} else {
				if (i+1==len || resdata[i+1][3]>maxdate) {
					avg = avg + resdata[i][3]*(maxdate-resdata[i][0]);
				} else {
					avg = avg + resdata[i][3]*(resdata[i+1][3]-resdata[i][3]);
				}
			}
		onswitch = 1;
		}
	}
	document.getElementById('math').innerHTML=avg/(maxdate-mindate);
}
