//Resdata is the array of processed values with length equal to the number of transactions.
var rawdata = null;
var resdata = [];
//365 days, 24 hours, 3600 seconds, 1000 milliseconds
let oneyear = 365*24*3600*1000;
let oneday = 24*3600*1000;

document.getElementById('fileInput').onchange = function () {
	try{
		let filetext = this.value.replace("C:\\fakepath\\", "");
		alert(filetext);
		document.getElementById('filearea').innerHTML=filetext;
		document.getElementById('selfilebtn').style.background='#008000';
		document.getElementById('impdatabtn').style.background='#FF0000';
	}catch(err){alert(err)};
}

//Import the transaction export csv.  Works with standard wallet exports, made for Peercoin but works with Bitcoin.
function impdata()
{
  	try{
        	var reader = new FileReader();
        	reader.onload = function (e) {rawdata = e.target.result};
		reader.onloadend = function () {procdata()};
        	reader.readAsText(document.getElementById('fileInput').files[0]);
		document.getElementById('impdatabtn').style.background='#008000';
		document.getElementById('datebtn').style.background='#FF0000';
    	}
    	catch(err){alert(err);}
}

//Make plotting easier through Plotly
function plotdata(eggs, why, grapharea, mode, ylabel)
{
    	var trace = {
        	x: eggs,
        	y: why,
        	mode: mode,
        	type: 'scatter'
    	};
    	var data = [trace];
	document.getElementById(grapharea).innerHTML='';
    	try{Plotly.newPlot(grapharea, data, {yaxis:{title:{text: ylabel}}});}
    	catch(err){Alert(err)};
}

/*
function plotlayout(ptitle, xlabel, ylabel)
{      
	var layout = {
		title: {
			text: 'Title',
                        font: {
				family: 'Times New Roman',
                                size: 24
			}
		},
		xaxis: {
                        title: {
                                text: xlabel,
                                font: {
                                        family: 'Courier New, monospace',
                                        size: 18,
                                        color: '#7f7f7f'
                                }
                        }
                },
                yaxis: {
                        title: {
                                text: ylabel,
                                font: {
                                        family: 'Courier New, monospace',
                                        size: 18,
                                        color: '#7f7f7f'
                                }
                        }
                }
	};
        return[layout];
}
*/

//Process the data.  This will recreate the resdata.
//resdata = [date, amount, txntag, address, readable date, balance]
//It also feeds the wallet [date,balance] out to the plotter
function procdata(targetaddr = "All")
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
		if (targetaddr==addr[j] || targetaddr=="All"){
			resdata.push([dated[j],amnt[j],tag[j],addr[j]]);
    		}
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
	//Plot and date ranges
	plotdata(txndate,txnamount,'areaone','lines+markers','Balance (# Coins)');
	document.getElementById('windowstart').value=resdata[0][4].toISOString().substring(0,10);
	endindex = resdata.length-1;
	document.getElementById('windowend').value=resdata[endindex][4].toISOString().substring(0,10);
	//Setup address select if unpopulated
	popaddr=document.getElementById('addressarea').length;
	if (popaddr == 1){
		var select = document.getElementById('addressarea'), usedaddr = [];
		var ii=-1; jj=-1;
		while(addr[++jj]){
			if (!(usedaddr.includes(addr[jj]))){
				usedaddr.push(addr[jj]);
			}
		}
		while(usedaddr[++ii]){
			var address = usedaddr[ii];
			var addresses = document.createElement("option");
			addresses.textContent = address;
			addresses.value = address;
			select.appendChild(addresses);
		}
	}
	document.getElementById('trgtaddr').innerHTML=targetaddr;
	alert("Processed and Graphed");
}

function impaddr()
{
	selectaddr = document.getElementById('addressarea').value;
	document.getElementById('impaddrbtn').style.background='#008000';
        document.getElementById('datebtn').style.background='#FF0000';
	procdata(selectaddr);
}

//Calculate average balance, stake minted, annualized interest over date window, and total reward as percentage of balance.
function calcintrst(mindate,maxdate)
{
	var sum = 0, reward = 0, len=resdata.length, onswitch = 1, i=-1;
        while(resdata[++i]){
                if (resdata[i][0]>mindate && resdata[i][0]<maxdate) {
                        if (onswitch == 0 && i!=0) {
                            sum = sum + resdata[i-1][5]*(resdata[i][0]-mindate);
                        } else {
                            if (i+1==len || resdata[i+1][5]>maxdate) {
                                sum = sum + resdata[i][5]*(maxdate-resdata[i][0]);
                            } else {
                                sum = sum + resdata[i][5]*(resdata[i+1][0]-resdata[i][0]);
                            }
                        }
                        if (resdata[i][2] == "Mint by stake")
                        {
                                reward = reward + parseFloat(resdata[i][1]);
                        }
                        onswitch = 1;
                }
        }
	let avg = sum/(maxdate-mindate);
	let interest=100*reward*oneyear/sum;
	let rewardpercent = 100*reward*(maxdate-mindate)/sum;
	return[avg, reward, interest, rewardpercent];
}

function posreward(mindate,maxdate)
{
        var posdate = [], posreward = [], posdatediff = [], onswitch=0, i=-1;
        while(resdata[++i]){
                if (resdata[i][0]>mindate && resdata[i][0]<maxdate) {
                        if (resdata[i][2] == "Mint by stake")
                        {
                                posdate[i] = resdata[i][4];
				posreward[i] = parseFloat(resdata[i][1]);
				if (onswitch == 1) {
					posdatediff[i] = (posdate[i]-posdate[i-1])/oneday;
				} else {
					posdatediff[0] = 0;
					onswitch = 1;
				}
                        }
                }
        }
        return[posdate, posreward, posdatediff];
}

//Set the bar for Continuous Minting as earning 0.75% average interest before v0.9 and 3.75% after.
function expavgint(min,max)
{
	var cnfbar = 0.75;
	var switchdate = new Date("2020-06-05T01:00:00Z");
	var binter = 1;
	var ainter = 5;
	var astart  = 0;
	var tintage = 0;
	if (min<switchdate){
		tintage = tintage+binter*(switchdate-min);
		astart = switchdate;
	} else {astart = min;}
	if (switchdate<max){
		tintage = tintage+ainter*(max-astart);
	} else {tintage = tintage+binter*(max-astart);}
	var tinter = cnfbar*tintage/(max-min);
	return tinter;
}

//Use the date window to spit out averages.
function datedata()
{
	var mind = Date.parse(document.getElementById('windowstart').value);
	var maxd = Date.parse(document.getElementById('windowend').value);
	let avgint = calcintrst(mind,maxd);
	var xint = [], yint2 = [], yint3 = [];
	document.getElementById('avg').innerHTML=avgint[0];
	document.getElementById('stake').innerHTML=avgint[1];
	document.getElementById('interest').innerHTML=avgint[2];
	if (avgint[2] > expavgint(mind,maxd)){
		document.getElementById('prediction').innerHTML="You were a CONTINUOUS minter during this period";
	} else {
		document.getElementById('prediction').innerHTML="You were a PERIODIC minter during this period";
	}
	for (let i=mind;i<maxd; i=i+oneday){
		let annualized = calcintrst(i-oneyear,i);
		let day = new Date(i);
		xint.push(day);
		yint2.push(annualized[2]);
		let cumint = calcintrst(mind,i);
		yint3.push(cumint[3]);
	}
	//plots 4 and 5 (mint events)
	var xintpos = [], yint4 = [], yint5 = [];
	graphreward = posreward(mind,maxd);
	xintpos = graphreward[0];
	yint4 = graphreward[1];
	yint5 = graphreward[2];
	plotdata(xint,yint2,'areatwo','lines+markers','Annualized Interest (%)');
	plotdata(xint,yint3,'areathree','lines+markers','Percentage of Balance Minted (%)');
	plotdata(xintpos,yint4,'areafour','markers','Mint Reward (# Coins)');
	plotdata(xintpos,yint5,'areafive','markers','Time Between Mint Events (Days)');
	document.getElementById('datebtn').style.background='#008000';
	alert("Date Window Processed and Graphed");
}
