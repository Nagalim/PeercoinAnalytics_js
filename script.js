//Resdata is the array of processed values with length equal to the number of transactions.
var rawdata = null;
let resdata = [];

//Import the transaction export csv.  Works with standard wallet exports, made for Peercoin but works with Bitcoin.
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

//Make plotting easier through Plotly
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

//Process the data.  This will recreate the resdata.
//It also feeds the wallet [date,balance] out to the plotter
function procdata()
{
        resdata = [];
	var txndate = [], txnamount = [];
	var rows = rawdata.split("\n");
        var dated = [], amnt = [], tag = [], addr = [];
        for (var i=1;i<rows.length-1;i++){
        	var thisrow = rows[i].split('","');
        	var dating = Date.parse(thisrow[1]);
        	dated.push(dating);
        	amnt.push(thisrow[5]);
		tag.push(thisrow[2]);
		addr.push(thisrow[4]);
        }
	var j = -1, k = -1, AmtTot = 0;
        while(dated[++j]){
		resdata.push([dated[j],amnt[j],tag[j],addr[j]]);
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

//Use the date window to spit out averages.
function datedata()
{
	var avg = 0; reward = 0; i=-1;
	var mindate = Date.parse(document.getElementById('windowstart').value);
	var maxdate = Date.parse(document.getElementById('windowend').value);
	var len = resdata.length;
	var onswitch = 0;
	while(resdata[++i]){
		if (resdata[i][0]>mindate && resdata[i][0]<maxdate) {
			if (onswitch == 0 && i!=0) {
				avg = avg + resdata[i-1][5]*(resdata[i][0]-mindate);
			} else {
				if (i+1==len || resdata[i+1][5]>maxdate) {
					avg = avg + resdata[i][5]*(maxdate-resdata[i][0]);
				} else {
					avg = avg + resdata[i][5]*(resdata[i+1][0]-resdata[i][0]);
				}
			}
			if (resdata[i][2] == "Mint by stake")
			{
				reward = reward + parseFloat(resdata[i][1]);
			}
			onswitch = 1;
		}
	}
	document.getElementById('avg').innerHTML=avg/(maxdate-mindate);
	document.getElementById('stake').innerHTML=reward;
	document.getElementById('interest').innerHTML=100*reward*(maxdate-mindate)/avg;
	alert("Date Window Processed");
}

