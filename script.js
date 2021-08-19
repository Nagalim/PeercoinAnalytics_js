//Resdata is the array of processed values with length equal to the number of transactions.
var rawdata = null;
var resdata = [];

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
function plotdata(eggs, why, grapharea)
{
        var trace = {
                x: eggs,
                y: why,
                mode: 'lines+markers',
                type: 'scatter'
        };
        var data = [trace];
        try{Plotly.newPlot(grapharea, data);}
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
        	let thisrow = rows[i].split('","');
        	let dating = Date.parse(thisrow[1]);
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
                let readate = new Date(resdata[k][0]);
        	AmtTot = AmtTot + parseFloat(resdata[k][1]);
		resdata[k].push(readate);
		resdata[k].push(AmtTot);
		txndate.push(readate);
        	txnamount.push(AmtTot);
        }
	plotdata(txndate,txnamount,areaone);
	document.getElementById('windowstart').value=resdata[0][4].toISOString().substring(0,10);
	alert("Processed and Graphed");
}

//Calculate annualized interest and other things based on a given date window.
function calcintrst(mindate,maxdate)
{
	var avg = 0, reward = 0, len=resdata.length, onswitch = 1, i=-1;
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
	let interest=100*reward*1000*3600*24*365/avg
	return[avg, reward, interest];
}

//Use the date window to spit out averages.
function datedata()
{
	var mind = Date.parse(document.getElementById('windowstart').value);
	var maxd = Date.parse(document.getElementById('windowend').value);
	let avgint = calcintrst(mind,maxd);
	var xint = [], yint = [];
	document.getElementById('avg').innerHTML=avgint[0]/(maxd-mind);
	document.getElementById('stake').innerHTML=avgint[1];
	document.getElementById('interest').innerHTML=avgint[2];
	if (avgint[2] > 3.25){
		document.getElementById('prediction').innerHTML="You were a CONTINUOUS minter during this period";
	} else {
		document.getElementById('prediction').innerHTML="You were a PERIODIC minter during this period";
	}
	for (let i=mind;i<maxd; i=i+1000*3600*24){
		let calculate = calcintrst(i-1000*3600*24*365,i);
		let day = new Date(i);
		xint.push(day);
		yint.push(calculate[2]);
	}
	plotdata(xint,yint,areatwo);
	alert("Date Window Processed and Graphed");
}
