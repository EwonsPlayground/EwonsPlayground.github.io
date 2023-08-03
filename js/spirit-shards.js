(function(){
	const initT6FineCrafting = function() {
		// Variables
		const tableHeadings = ["Item Result", "AVG Return", "Crafting Materials", "Total Cost", "Profit", "ROI", "Profit / SS"];
		const chartHeadings = ["T6 Material", "T6 Price", "T5 Price", "Dust Price", "Cost", "T6 Sell"];
		const commaRegex = /\B(?=(\d{3})+(?!\d))/g; // Regex to add , to thousands place
		const listingUrl = "https://api.guildwars2.com/v2/commerce/listings";
		const dataUrl = "https://api.guildwars2.com/v2/items";
		const accountUrl = "https://api.guildwars2.com/v2/account/wallet?access_token=";
		const stoneImage = "images/Philosophers_Stone.png";
		const silverImage = '<img class="coinImage" title="silver" src="images/Silver_Coin.png" />';
		const goldImage = '<img class="coinImage" title="gold" src="images/Gold_Coin.png" />';
		const spiritShardImage = '<img class="coinImage" title="spirit shard" src="images/Spirit_Shard.png" />';
		const enterKey = 13;
		const baseReturn = 6.91;
		const ssBaseProfit = 40.00;
		const spiritShardId = 23;
		const dustId = 24277;
		let avgReturn = baseReturn;
		let idealSSProfit =  ssBaseProfit;
		let highestProfit = -9999;
		let profitableAmounts = [];
		let craftingData = {};


		// Item Name and IDs
		const itemIDArray = [
			{name: "Ancient Bone", id: 24358, materialID: 24341},
			{name: "Armored Scale", id: 24289, materialID: 24288},
			{name: "Elaborate Totem", id: 24300, materialID: 24299},
			{name: "Powerful Venom Sac", id: 24283, materialID: 24282},
			{name: "Vial of Powerful Blood", id: 24295, materialID: 24294},
			{name: "Vicious Claw", id: 24351, materialID: 24350},
			{name: "Vicious Fang", id: 24357, materialID: 24356}
		];


		// Setup API URLs
		let materialIDArray = [dustId];

		itemIDArray.forEach((t6) => {
			materialIDArray.push(t6.id, t6.materialID);
		});

		const materialIDString = materialIDArray.join(',');
		const apiDataURLs = [
			listingUrl + '?ids=' + materialIDString,
			dataUrl + '?ids=' + materialIDString
		];


		// Check Local Storage and Set Fields
		// T6 Average Retrun
		if (localStorage.getItem("t6avg")) {
			document.getElementById("avgResultInput").value = localStorage.getItem("t6avg");
			avgReturn = parseFloat(localStorage.getItem("t6avg"));
		}

		// Ideal Profit per Spirit Shard
		if (localStorage.getItem("ideal_ss_profit")) {
			document.getElementById("ssbreakpointInput").value = localStorage.getItem("ideal_ss_profit");
			idealSSProfit = parseFloat(localStorage.getItem("ideal_ss_profit"));
		}


		// Functions
		// Add Guild Wars 2 Account API and Set Spirit Shard Display
		const addAccountAPIDetails = function() {
			let apiKey = localStorage.getItem("api_key");
			apiKey = apiKey ? apiKey : document.getElementById("#settings-api-key").value;

			// Don't continue if there isn't an api key
			if (!apiKey) { return; }

			let spiritShardOwned;
			let ssProfit;
			let ssAvgProfit;

			//TODO: Add try catch for invalid api keys?
			fetch(`${accountUrl}${apiKey}`)
				.then(function(response) {return response.json() })
				.then(function(json) {
					if (json.text !== "invalid key") {
						const ssFilter = json.find(item => item.id == spiritShardId);
						spiritShardOwned = ssFilter.value;

						ssProfit = spiritShardOwned * highestProfit / 100;
						ssAvgProfit = spiritShardOwned * ( profitableAmounts.reduce((a,b) => a + b, 0) / profitableAmounts.length ) / 100;

						document.getElementById("ssOwned").innerHTML = spiritShardOwned.toString().replace(commaRegex, ",") + spiritShardImage;
						document.getElementById("ssAvgProfit").innerHTML = "N/A";
						if (!isNaN(ssAvgProfit)) {
							document.getElementById("ssAvgProfit").innerHTML = ssAvgProfit.toFixed(2).replace(commaRegex, ",") + goldImage;
						}
						document.getElementById("ssProfit").innerHTML = ssProfit.toFixed(2).replace(commaRegex, ",") + goldImage;
					} else {
						alert("Invalid API Key");
					}
					
				})
			
		}

		// Set the custom avg result, and update the calculations
		const setAVGReturn = function() {
			// Grab average return
			avgReturn = parseFloat(document.getElementById("avgResultInput").value);

			if (!isNaN(avgReturn)) {
				// Store average return in local storage
				localStorage.setItem("t6avg", avgReturn);

				calculateProfit();
				populateTable();
				populateDataChart();
				addAccountAPIDetails();
			} else {
				avgReturn = baseReturn;
			}
		}

		// Reset the average return
		const resetAVGReturn = function() {
			avgReturn = baseReturn;
			localStorage.removeItem("t6avg");
			document.getElementById("avgResultInput").value = "";

			calculateProfit();
			populateTable();
			populateDataChart();
			addAccountAPIDetails();
		}

		// Set the spirit shard profit break point
		const setSSBreakPoint = function() {
			// Grab Ideal Profit
			idealSSProfit = parseFloat(document.getElementById("ssbreakpointInput").value);

			if (!isNaN(idealSSProfit)) {
				// Store ideal profit in local storage
				localStorage.setItem("ideal_ss_profit", idealSSProfit);

				calculateProfit();
				populateTable();
				populateDataChart();
				addAccountAPIDetails();
			} else {
				idealSSProfit = ssBaseProfit;
			}
		}

		// Reset the spirit shard profit break point
		const resetSSBreakPoint = function() {
			idealSSProfit = ssBaseProfit;
			localStorage.removeItem("ideal_ss_profit");
			document.getElementById("ssbreakpointInput").value = "";

			calculateProfit();
			populateTable();
			populateDataChart();
			addAccountAPIDetails();
		}

		// Create the Data Table
		const generateTable = function() {
			// get the reference for the body
			const container = document.getElementById("displayData");
			
			// create <table>, <thead>, <tbody> elements
			const tbl = document.createElement("table");
			const tblHead = document.createElement("thead");
			const tblBody = document.createElement("tbody");
			
			// creating headings
			const headingRow = document.createElement("tr");

			for (let i = 0; i < tableHeadings.length; i++) {
				const cell = document.createElement("th");
				const cellText = document.createTextNode(tableHeadings[i]);
				cell.appendChild(cellText);
				headingRow.appendChild(cell);
			}
			tblHead.appendChild(headingRow);

			// creating all cells
			for (let i = 0; i < itemIDArray.length; i++) {
				// creates a table row
				const row = document.createElement("tr");
				row.setAttribute("id", `cell_r${i}`);
			
				for (let j = 0; j < tableHeadings.length; j++) {
				// Create a <td> element and a text node, make the text
				// node the contents of the <td>, and put the <td> at
				// the end of the table row
				const cell = document.createElement("td");
				cell.setAttribute("id", `cell_r${i}c${j}`)
				const cellText = document.createTextNode("loading api...");
				cell.appendChild(cellText);
				row.appendChild(cell);
				}
			
				// add the row to the end of the table body
				tblBody.appendChild(row);
			}
			
			// put the <tbody> in the <table>
			tbl.appendChild(tblHead);
			tbl.appendChild(tblBody);
			// appends <table> into <body>
			container.appendChild(tbl);
		}

		// Create the data chart overlay
		const generateDataChart = function() {
			// get the reference for the body
			const container = document.getElementById("dataChart");
			
			// creates a <table> element and a <tbody> element
			const tbl = document.createElement("table");
			const tblHead = document.createElement("thead");
			const tblBody = document.createElement("tbody");
			
			// creating headings
			const headingRow = document.createElement("tr");

			for (let i = 0; i < chartHeadings.length; i++) {
				const cell = document.createElement("th");
				const cellText = document.createTextNode(chartHeadings[i]);
				cell.appendChild(cellText);
				headingRow.appendChild(cell);
			}
			tblHead.appendChild(headingRow);

			// creating all cells
			for (let i = 0; i < itemIDArray.length; i++) {
				// creates a table row
				const row = document.createElement("tr");
			
				for (let j = 0; j < chartHeadings.length; j++) {
				// Create a <td> element and a text node, make the text
				// node the contents of the <td>, and put the <td> at
				// the end of the table row
				const cell = document.createElement("td");
				cell.setAttribute("id", `chart_r${i}c${j}`)
				const cellText = document.createTextNode("loading api...");
				cell.appendChild(cellText);
				row.appendChild(cell);
				}
			
				// add the row to the end of the table body
				tblBody.appendChild(row);
			}
			
			// put the <tbody> in the <table>
			tbl.appendChild(tblHead);
			tbl.appendChild(tblBody);
			// appends <table> into <body>
			container.appendChild(tbl);
		}

		// Populate the Table with all Data
		const populateTable = function() {
			// Populate Item Result
			itemIDArray.forEach((item, i) => {
				const itemName = item.name;
				const itemID = item.id;
				const materialID = item.materialID;

				// Populate Item Result
				let targetCell = document.getElementById(`cell_r${i}c0`);
				targetCell.innerHTML = 
					`<div class="gridRow">
						<img class="mainMaterialImage" src="${craftingData[itemID].icon}" />
					 	<div class="itemText">
							<p><strong>${itemName}</strong></p>
							<p class="coinContainer"><strong>Sell</strong>: ${craftingData[itemID].sells[0].unit_price / 100}${silverImage}</p>
					 	</div>
					 </div>`;

				// Populate AVG Result
				targetCell = document.getElementById(`cell_r${i}c1`);
				targetCell.setAttribute("class", "avgReturnRow");
				targetCell.innerHTML = avgReturn;

				// Populate the Crafting Materials
				targetCell = document.getElementById(`cell_r${i}c2`);
				targetCell.setAttribute("class", "craftingMaterialsRow");
				targetCell.innerHTML = 
					`<p><img class="materialImage" src="${craftingData[itemID].icon}" /><span class="coinContainer"> 1 ${itemName} | <strong class="divider">Buy</strong>: ${craftingData[itemID].buys[0].unit_price / 100}${silverImage}/ ea.</span></p>
					 <p><img class="materialImage" src="${craftingData[dustId].icon}" /><span class="coinContainer"> 5 ${craftingData[dustId].name} | <strong class="divider">Buy</strong>: ${craftingData[dustId].buys[0].unit_price / 100}${silverImage}/ ea.</span></p>
					 <p><img class="materialImage" src="${craftingData[materialID].icon}" /><span class="coinContainer"> 50 ${craftingData[materialID].name} | <strong class="divider">Buy</strong>: ${craftingData[materialID].buys[0].unit_price / 100}${silverImage}/ea.</span></p>
					 <p><img class="materialImage" src="${stoneImage}" /><span class="coinContainer"> 5 Philosopher's Stones | 0.5 ${spiritShardImage} / ea.</span></p>`;
				

				// Populate Total Cost
				targetCell = document.getElementById(`cell_r${i}c3`);
				targetCell.innerHTML = `<p class="coinContainer singleValue">${craftingData[itemID].craftingCost}${silverImage}</p>`;
				
				// Populate Profit
				targetCell = document.getElementById(`cell_r${i}c4`);
				targetCell.innerHTML = `<p class="coinContainer singleValue">${craftingData[itemID].avgProfit}${silverImage}</p>`;

				// Populate Return on Investment
				targetCell = document.getElementById(`cell_r${i}c5`);
				targetCell.innerHTML = `<p class="singleValue">${craftingData[itemID].returnOnInvestment}%</p>`;

				// Populate Profit per Spirit Shard
				targetCell = document.getElementById(`cell_r${i}c6`);
				targetCell.innerHTML = `<p class="coinContainer singleValue">${craftingData[itemID].profitPerSS}${silverImage}</p>`;

				if (craftingData[itemID].profitPerSS > idealSSProfit) {
					document.getElementById(`cell_r${i}`).classList.add("profitableRow");
					targetCell.classList.add("profitable");
				}
			});
		}

		// Populate the Chart with all Data
		const populateDataChart = function() {
			itemIDArray.forEach((item, i) => {
				const itemName = item.name;
				const itemID = item.id;
				const materialID = item.materialID;

				// Populate T6 Material
				targetCell = document.getElementById(`chart_r${i}c0`);
				targetCell.classList.remove("profitable");
				targetCell.innerHTML = itemName;

				// Populate T6 Price
				targetCell = document.getElementById(`chart_r${i}c1`);
				targetCell.innerHTML = craftingData[itemID].buys[0].unit_price / 100;

				// Populate T5 Price
				targetCell = document.getElementById(`chart_r${i}c2`);
				targetCell.innerHTML = craftingData[materialID].buys[0].unit_price / 100;

				// Populate Dust Material
				targetCell = document.getElementById(`chart_r${i}c3`);
				targetCell.innerHTML = craftingData[dustId].buys[0].unit_price / 100;

				// Populate Cost
				targetCell = document.getElementById(`chart_r${i}c4`);
				targetCell.innerHTML = "";

				// Populate T6 Sell Price
				targetCell = document.getElementById(`chart_r${i}c5`);
				targetCell.innerHTML = craftingData[itemID].sells[0].unit_price / 100;
			});
		}

		// Function to Calculate Profits for each item
		const calculateProfit = function() {
			highestProfit = -9999;
			profitableAmounts = [];

			itemIDArray.forEach((item, i) => {
				// Variables
				const itemID = item.id;
				const materialID = item.materialID;

				const t6Price = craftingData[itemID].buys[0].unit_price / 100;
				const t6Needed = 1;
				const t5Price = craftingData[materialID].buys[0].unit_price / 100;
				const t5Needed = 50;
				const dustPrice = craftingData[dustId].buys[0].unit_price / 100;
				const dustNeeded = 5;

				const t6SellPrice = craftingData[itemID].sells[0].unit_price / 100;
				const tpFeeMultilpier = 0.85;
				const avgOutput = avgReturn;

				const spiritShardsUsed = 0.5;

				const craftingCost = (t6Price * t6Needed) + (t5Price * t5Needed) + (dustPrice * dustNeeded);
				const avgProfit = (t6SellPrice * avgOutput * tpFeeMultilpier) - craftingCost;
				const profitPerSS = avgProfit / spiritShardsUsed;

				const returnOnInvestment =  (avgProfit / craftingCost) * 100;

				// Add calculations to craftingData
				craftingData[itemID].craftingCost = parseFloat(craftingCost.toFixed(2));
				craftingData[itemID].avgProfit = parseFloat(avgProfit.toFixed(2));
				craftingData[itemID].profitPerSS = parseFloat(profitPerSS.toFixed(2));
				craftingData[itemID].returnOnInvestment = parseFloat(returnOnInvestment.toFixed(2));

				// Set profits for Account API Profit
				if (profitPerSS > highestProfit) {
					highestProfit = parseFloat(profitPerSS.toFixed(2));
				}

				if (profitPerSS > idealSSProfit) {
					profitableAmounts.push(profitPerSS);
				}
			});
		}

		// app startup code
		const fetchAPIData = function() {
			Promise.all(apiDataURLs.map(url => {
				return fetch(url)
					.then(response => response.json())
			}))
			.then(apiDataJson => {
				const [listings, data] = apiDataJson;
				
				listings.forEach((item, i) => {
					craftingData[item.id] = {...item, ...data[i]};
				});

				calculateProfit();
				populateTable();
				populateDataChart();
				addAccountAPIDetails();
			});
		}
		

		// On "Enter" functions for the text inputs
		const setAVGReturnEnter = function(keyPressed){
			if (keyPressed.keyCode == enterKey || keyPressed.which == enterKey){
				setAVGReturn();
			}
		}

		const setSSBreakPointEnter = function(keyPressed){
			if (keyPressed.keyCode == enterKey || keyPressed.which == enterKey){
				setSSBreakPoint();
			}
		}


		// Display a data chart overlay for copy/paste
		const openChart = function() {
			document.getElementById("dataChartOverlay").style.display = "block";
		}
			
		const closeChart = function(clickedZone) {
			const closeZones = '#dataChartOverlay, #closebtn';
			if (clickedZone.target.matches(closeZones)) {
				document.getElementById("dataChartOverlay").style.display = "none";
			}
		}


		// Trigger the application to run
		generateTable();
		generateDataChart();
		fetchAPIData();


		// Add Event Listeners
		document.getElementById("setavgResult").addEventListener("click", setAVGReturn);
		document.getElementById("resetavgResult").addEventListener("click", resetAVGReturn);
		document.getElementById("setssBreakpoint").addEventListener("click", setSSBreakPoint);
		document.getElementById("resetssBreakpoint").addEventListener("click", resetSSBreakPoint);

		document.getElementById("avgResultInput").addEventListener("keypress", setAVGReturnEnter);
		document.getElementById("ssbreakpointInput").addEventListener("keypress", setSSBreakPointEnter);

		document.getElementById("displayDataChart").addEventListener("click", openChart)
		document.getElementById("dataChartOverlay").addEventListener("click", closeChart);
	}

	// Initialize the T6 App once the DOM is ready
	document.addEventListener('DOMContentLoaded', function () {
    initT6FineCrafting();
	});
})()
