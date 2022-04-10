//Resdata is the array of processed values with length equal to the number of transactions.
var resdata = [];
var txnjson = [];
//365 days, 24 hours, 3600 seconds, 1000 milliseconds
let oneyear = 365*24*3600*1000;
let oneday = 24*3600*1000;


function Get(yourUrl){
	var Httpreq = new XMLHttpRequest(); // a new request
	Httpreq.open("GET",yourUrl,false);
	Httpreq.send(null);
	return Httpreq.responseText;          
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function looptxns(addr) {
	for (let l=0; l<addr.transactions.length; l+=1){
			imptx=addr.transactions[l];
			address=addr.addrStr;
                        txnwebsite='https://blockbook.peercoin.net/api/tx/'+imptx;
                        txnjson[l] = JSON.parse(Get(txnwebsite));
                        document.getElementById('txnnum').innerHTML=l+1;
                        await sleep(50);
	}
	document.getElementById('importbutton').style.background='#008000';
        document.getElementById('datebtn').style.background='#FF0000';
	document.getElementById('importbutton').innerHTML='Imported';
	document.getElementById('importbutton').onclick = impdata_online;
	procdata(address);
}


//Form the API call and fill rawdata.  Calls on blockbook.peercoin.net block explorer.  Made for Peercoin but works with Bitcoin.
function impdata_online()
{
	try{
		document.getElementById('importbutton').innerHTML='Waiting...';
		document.getElementById('importbutton').onclick = null;
		document.getElementById('importbutton').style.background='#FF0000';
		targaddress=document.getElementById('targetaddress').value;
		addrwebsite = 'https://blockbook.peercoin.net/api/address/'+targaddress;
		var addr = JSON.parse(Get(addrwebsite));
		document.getElementById('totaltxn').innerHTML=addr.transactions.length;
		//loop over txns
		txnjson=[];
		looptxns(addr);
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
    	catch(err){alert(err)};
}

//Process the data.  This will recreate the resdata.
//resdata = [date, amount, txntag, address, readable date, balance]
//It also feeds the wallet [date,balance] out to the plotter
function procdata(targetaddr = "All")
{
	var txnid = []; var indxid = [];
	for (var m=0;m<txnjson.length;m++){
		idtxn = txnjson[m].txid;
		if (!(txnid.includes(idtxn))){
			txnid.push(idtxn);
			indxid.push(m);
		}
	}
	resdata = [];
	var txndate = [], txnamount = [];
    	var dated = [], amnt = [], tag = [], subtag = [];
    	for (var i=0;i<indxid.length;i++){
		indx=indxid[i];
		jsonindx=txnjson[indx];
        	dated.push(jsonindx.time*1000);
		txnamnt=0;
		for (var n=0;n<jsonindx.vout.length;n++){
			if (jsonindx.vout[n].scriptPubKey.addresses[0]==targetaddr){
				txnamnt=txnamnt+Number(jsonindx.vout[n].value);
			}
		}
		for (var p=0;p<jsonindx.vin.length;p++){
			if (jsonindx.vin[p].addresses[0]==targetaddr){
				txnamnt=txnamnt-Number(jsonindx.vin[p].value);
                        }
		}
		amnt.push(txnamnt);
		if (jsonindx.fees==0){thistag='Mint by stake'}else{thistag='Send/Receive'}
		tag.push(thistag);
		subtag.push('placeholder');
    	}
	var j = -1, k = -1, AmtTot = 0;
    	while(dated[++j]){
		resdata.push([dated[j],amnt[j],tag[j],subtag[j]]);
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
	alert("Processed and Graphed");
}

//Calculate average balance, stake minted, annualized interest over date window, and total reward as percentage of balance.
function calcintrst(mindate,maxdate)
{
	var sum = 0, reward = 0, len=resdata.length, onswitch = 0, i=-1;
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
        var posdate = [], posreward = [], posdatediff = [], k=-1, i=-1;
        while(resdata[++i]){
                if (resdata[i][0]>mindate && resdata[i][0]<maxdate) {
                        if (resdata[i][2] == "Mint by stake")
                        {
				k=k+1;
				posdate.push(resdata[i][4]);
				posreward.push(parseFloat(resdata[i][1]));
				if (k > 0) {
					posdatediff.push((posdate[k]-posdate[k-1])/oneday);
				} else {
					posdatediff[0] = 0;
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
