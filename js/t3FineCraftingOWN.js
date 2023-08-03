(function(){
	// Variables
	const tableHeadings = ["Item Result", "AVG Result", "Crafting Materials", "Total Cost / Profit", "Profit / Spirit Shard"];
	const chartHeadings = ["Dust Material", "T2 Material", "T3 Material", "T3 Price", "T2 Price", "Dust Price", "Cost", "T3 Sell"];
	const baseReturn = 18.51;
	const baseProfit = 20.00;
	const ssBaseProfit = 40.00;
	let avgReturn = baseReturn;
	let idealProfit = baseProfit;
	let idealSSProfit =  ssBaseProfit;
	let highestProfit = -1000;
	let profitableAmounts = [];
	const commaRegex = /\B(?=(\d{3})+(?!\d))/g; // Regex to add , to thousands place
	let refresh = false;
	const refreshRate = 300000; // 5 Minutes is 300,000ms
	let profitableItems;
	let marketCrash;
	const dataUrl = "https://api.guildwars2.com/v2/items/";
	const listingUrl = "https://api.guildwars2.com/v2/commerce/listings/";
	const accountUrl = "https://api.guildwars2.com/v2/account/wallet?access_token=";
	const enterKey = 13;

	// Toastr Options
	toastr.options = {
		"closeButton": true,
		"debug": false,
		"newestOnTop": false,
		"progressBar": true,
		"positionClass": "toast-bottom-right",
		"prkeyPressedDuplicates": false,
		"onclick": null,
		"showDuration": "300",
		"hideDuration": "1000",
		"timeOut": refreshRate,
		"extendedTimeOut": "1000",
		"showEasing": "swing",
		"hideEasing": "linear",
		"showMethod": "fadeIn",
		"hideMethod": "fadeOut"
	}

	// Check Local Storage and Set Fields
	// API Key
	if(localStorage.getItem("api_key")) {
		document.getElementById("apiInput").value = localStorage.getItem("api_key");
	}

	// T6 Average Retrun
	if(localStorage.getItem("t3avg")) {
		document.getElementById("avgResultInput").value = localStorage.getItem("t3avg");
		avgReturn = parseFloat(localStorage.getItem("t3avg"));
	}

	// Ideal Profit per Flip
	if(localStorage.getItem("ideal_profit")) {
		document.getElementById("breakpointInput").value = localStorage.getItem("ideal_profit");
		idealProfit = parseFloat(localStorage.getItem("ideal_profit"));
	}

	// Ideal Profit per Spirit Shard
	if(localStorage.getItem("ideal_ss_profit")) {
		document.getElementById("ssbreakpointInput").value = localStorage.getItem("ideal_ss_profit");
		idealSSProfit = parseFloat(localStorage.getItem("ideal_ss_profit"));
	}

	// Item Name and IDs
	const itemIDArray = [{name: "Bone", id: 24344, materialID: 24343},
						 {name: "Claw", id: 24348, materialID: 24347},
						 {name: "Fang", id: 24354, materialID: 24353},
						 {name: "Scale", id: 24286, materialID: 24285},
						 {name: "Totem", id: 24298, materialID: 24297},
						 {name: "Venom Sac", id: 24280, materialID: 24279},
						 {name: "Vial of Blood", id: 24292, materialID: 24291}];

	// Item Variables      
	let craftingData;
	let dustData;
	const stoneImage = "images/Philosophers_Stone.png";
	const silverImage = '<img class="coinImage" title="silver" src="images/Silver_Coin.png" />';
	const goldImage = '<img class="coinImage" title="gold" src="images/Gold_Coin.png" />';
	const spiritShardImage = '<img class="coinImage" title="spirit shard" src="images/Spirit_Shard.png" />';
	const spiritShardId = 23;
	const dustId = 24274;

	// Create Arrays for item data
	const t6ItemDataUrls = itemIDArray.map(item => {
		return `${dataUrl}${item.id}`
	})

	const t6ListingUrls = itemIDArray.map(item => {
		return `${listingUrl}${item.id}`
	})

	const t5ItemDataUrls = itemIDArray.map(item => {
		return `${dataUrl}${item.materialID}`
	})

	const t5ListingUrls = itemIDArray.map(item => {
		return `${listingUrl}${item.materialID}`
	})

	// Functions
	// Add Guild Wars 2 Account API and Set Spirit Shard Display
	const addAccountAPIDetails = function() {
		const apiKey = document.getElementById("apiInput").value;
		let spiritShardOwned;
		let ssProfit;
		let ssAvgProfit;

		// Store API Key in local storage
		localStorage.setItem("api_key", apiKey);

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

	// Function to set the custom avg result, and update the calculations
	const setAVGReturn = function() {
		// Grab average return
		avgReturn = parseFloat(document.getElementById("avgResultInput").value);

		if (!isNaN(avgReturn)) {
			// Store average return in local storage
			localStorage.setItem("t3avg", avgReturn);

			calculateProfit();
			populateTable();
			populateDataChart();
			if (document.getElementById("apiInput").value != ""){
				addAccountAPIDetails();
			}
		} else {
			avgReturn = baseReturn;
		}
	}

	// Function to reset the average return
	const resetAVGReturn = function() {
		avgReturn = baseReturn;
		localStorage.removeItem("t3avg");
		document.getElementById("avgResultInput").value = "";

		calculateProfit();
		populateTable();
		populateDataChart();
		if (document.getElementById("apiInput").value != ""){
			addAccountAPIDetails();
		}
	}

	// Function to set the profit break point
	const setBreakPoint = function() {
		// Grab Ideal Profit
		idealProfit = parseFloat(document.getElementById("breakpointInput").value);

		if (!isNaN(idealProfit)) {
			// Store ideal profit in local storage
			localStorage.setItem("ideal_profit", idealProfit);

			calculateProfit();
			populateTable();
			populateDataChart();
			if (document.getElementById("apiInput").value != ""){
				addAccountAPIDetails();
			}
		} else {
			idealProfit = baseProfit;
		}
	}

	// Function to reset the profit break point
	const resetBreakPoint = function() {
		idealProfit = baseProfit;
		localStorage.removeItem("ideal_profit");
		document.getElementById("breakpointInput").value = "";

		calculateProfit();
		populateTable();
		populateDataChart();
		if (document.getElementById("apiInput").value != ""){
			addAccountAPIDetails();
		}
	}

	// Function to set the spirit shard profit break point
	const setSSBreakPoint = function() {
		// Grab Ideal Profit
		idealSSProfit = parseFloat(document.getElementById("ssbreakpointInput").value);

		if (!isNaN(idealSSProfit)) {
			// Store ideal profit in local storage
			localStorage.setItem("ideal_ss_profit", idealSSProfit);

			calculateProfit();
			populateTable();
			populateDataChart();
			if (document.getElementById("apiInput").value != ""){
				addAccountAPIDetails();
			}
		} else {
			idealSSProfit = ssBaseProfit;
		}
	}

	// Function to reset the spirit shard profit break point
	const resetSSBreakPoint = function() {
		idealSSProfit = ssBaseProfit;
		localStorage.removeItem("ideal_ss_profit");
		document.getElementById("ssbreakpointInput").value = "";

		calculateProfit();
		populateTable();
		populateDataChart();
		if (document.getElementById("apiInput").value != ""){
			addAccountAPIDetails();
		}
	}

	// Refresh Function
	const refreshInput = function() {
		if (this.checked) {
			refresh = true;
			setTimeout(function(){
				appStartup();
			}, refreshRate);
		} else {
			refresh = false;
		}
	}

	// Function to Create the Data Table
	// Reference:
	// https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Traversing_an_HTML_table_with_JavaScript_and_DOM_Interfaces
	const generateTable = function() {
		// get the reference for the body
		const container = document.getElementById("displayData");
	  
		// creates a <table> element and a <tbody> element
		const tbl = document.createElement("table");
		const tblBody = document.createElement("tbody");
	  
		// creating headings
		const headingRow = document.createElement("tr");

		for (let i = 0; i < tableHeadings.length; i++) {
			const cell = document.createElement("th");
			const cellText = document.createTextNode(tableHeadings[i]);
			cell.appendChild(cellText);
			headingRow.appendChild(cell);
		}
		tblBody.appendChild(headingRow);

		// creating all cells
		for (let i = 0; i < itemIDArray.length; i++) {
		  // creates a table row
		  const row = document.createElement("tr");
	  
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
		tbl.appendChild(tblBody);
		// appends <table> into <body>
		container.appendChild(tbl);
	  }

	// Function to create the data chart overlay
	const generateDataChart = function() {
		// get the reference for the body
		const container = document.getElementById("dataChart");
	  
		// creates a <table> element and a <tbody> element
		const tbl = document.createElement("table");
		const tblBody = document.createElement("tbody");
	  
		// creating headings
		const headingRow = document.createElement("tr");

		for (let i = 0; i < chartHeadings.length; i++) {
			const cell = document.createElement("th");
			const cellText = document.createTextNode(chartHeadings[i]);
			cell.appendChild(cellText);
			headingRow.appendChild(cell);
		}
		tblBody.appendChild(headingRow);

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
		tbl.appendChild(tblBody);
		// appends <table> into <body>
		container.appendChild(tbl);
	}

	// Populate the Table with all Data
	const populateTable = function() {
		// Populate Item Result
		for (let i = 0; i < craftingData.length; i++) {
			const targetCell = document.getElementById(`cell_r${i}c0`);
			targetCell.setAttribute("class", "gridRow paddedCell");
			targetCell.innerHTML = `<img src="${craftingData[i].icon}" />
									<div class="itemText">
									<p><strong>${craftingData[i].name}</strong></p>
									<p class="coinContainer"><strong>Sell</strong>: ${craftingData[i].listings.sells[0].unit_price / 100}${silverImage}</p>
									</div>`;
		}

		// Populate AVG Result
		for (let i = 0; i < craftingData.length; i++) {
			const targetCell = document.getElementById(`cell_r${i}c1`);
			targetCell.setAttribute("class", "avgReturnRow");
			targetCell.innerHTML = avgReturn;
		}

		// Populate the Crafting Materials
		for (let i = 0; i < craftingData.length; i++) {
			const targetCell = document.getElementById(`cell_r${i}c2`);
			targetCell.setAttribute("class", "craftingMaterialsRow paddedCell");
			targetCell.innerHTML = `<p><img class="materialImage" src="${craftingData[i].icon}" /><span class="coinContainer"> 1 ${craftingData[i].name} | <strong class="divider">Sell</strong>: ${craftingData[i].listings.sells[0].unit_price / 100}${silverImage}/ ea.</span></p>
									<p><img class="materialImage" src="${dustData.icon}" /><span class="coinContainer"> 5 ${dustData.name} | <strong class="divider">Sell</strong>: ${dustData.listings.sells[0].unit_price / 100}${silverImage}/ ea.</span></p>
									<p><img class="materialImage" src="${craftingData[i].t5Material.icon}" /><span class="coinContainer"> 50 ${craftingData[i].t5Material.name} | <strong class="divider">Sell</strong>: ${craftingData[i].t5Material.listings.sells[0].unit_price / 100}${silverImage}/ea.</span></p>
									<p><img class="materialImage" src="${stoneImage}" /><span class="coinContainer"> 2 Philosopher's Stones | 0.2 ${spiritShardImage} / ea.</span></p>`;
		}


		// Populate Total Cost and Profit
		for (let i = 0; i < craftingData.length; i++) {
			const targetCell = document.getElementById(`cell_r${i}c3`);
			targetCell.setAttribute("class", "paddedCell");
			targetCell.innerHTML = `<p class="coinContainer"><strong>Cost</strong>: ${craftingData[i].craftingCost}${silverImage}</p>
									<p class="coinContainer"><strong>Profit</strong>: ${craftingData[i].avgProfit}${silverImage}</p>
									<p class="coinContainer"><strong>Sell</strong>: ${craftingData[i].avgSell}${silverImage}</p>`;

			if (craftingData[i].avgProfit > idealProfit) {
				targetCell.classList.add("profitable");
			}
		}

		// Populate Profit per Spirit Shard and Return on Investment
		for (let i = 0; i < craftingData.length; i++) {
			const targetCell = document.getElementById(`cell_r${i}c4`);
			targetCell.setAttribute("class", "paddedCell");
			targetCell.innerHTML = `<p class="coinContainer">${craftingData[i].profitPerSS}${silverImage} / Spirit Shard</p>
									<p><strong>ROI: </strong>${craftingData[i].returnOnInvestment}%</p>`;

			if (craftingData[i].profitPerSS > idealSSProfit) {
				targetCell.classList.add("profitable");
			}
		}
	}

	// Populate the Chart with all Data
	const populateDataChart = function() {
		// Populate Dust Material
		for (let i = 0; i < craftingData.length; i++) {
			const targetCell = document.getElementById(`chart_r${i}c0`);
			targetCell.innerHTML = dustData.name;
		}

		// Populate T5 Material
		for (let i = 0; i < craftingData.length; i++) {
			const targetCell = document.getElementById(`chart_r${i}c1`);
			targetCell.innerHTML = craftingData[i].t5Material.name;
		}

		// Populate T6 Material
		for (let i = 0; i < craftingData.length; i++) {
			const targetCell = document.getElementById(`chart_r${i}c2`);
			targetCell.classList.remove("profitable");
			targetCell.innerHTML = craftingData[i].name;

			if (craftingData[i].avgProfit > idealProfit) {
				targetCell.classList.add("profitable");
			}
		}

		// Populate T6 Price
		for (let i = 0; i < craftingData.length; i++) {
			const targetCell = document.getElementById(`chart_r${i}c3`);
			targetCell.innerHTML = craftingData[i].listings.sells[0].unit_price / 100;
		}

		// Populate T5 Price
		for (let i = 0; i < craftingData.length; i++) {
			const targetCell = document.getElementById(`chart_r${i}c4`);
			targetCell.innerHTML = craftingData[i].t5Material.listings.sells[0].unit_price / 100;
		}

		// Populate Dust Material
		for (let i = 0; i < craftingData.length; i++) {
			const targetCell = document.getElementById(`chart_r${i}c5`);
			targetCell.innerHTML = dustData.listings.sells[0].unit_price / 100;
		}

		// Populate Cost
		for (let i = 0; i < craftingData.length; i++) {
			const targetCell = document.getElementById(`chart_r${i}c6`);
			targetCell.innerHTML = "";
		}

		// Populate T6 Sell Price
		for (let i = 0; i < craftingData.length; i++) {
			const targetCell = document.getElementById(`chart_r${i}c7`);
			targetCell.innerHTML = craftingData[i].listings.sells[0].unit_price / 100;
		}
	}

	// Function to Calculate Profits for each item
	const calculateProfit = function() {
		highestProfit = -1000;
		profitableAmounts = [];

		for (var i = 0; i < craftingData.length; i++) {
			// Variables
			const t6Price = craftingData[i].listings.sells[0].unit_price / 100;
			const t6Needed = 1;
			const t5Price = craftingData[i].t5Material.listings.sells[0].unit_price / 100;
			const t5Needed = 50;
			const dustPrice = dustData.listings.sells[0].unit_price / 100;
			const dustNeeded = 5;

			const t6SellPrice = craftingData[i].listings.sells[0].unit_price / 100;
			const tpFeeMultilpier = 0.85;
			const avgOutput = avgReturn;

			const spiritShardsUsed = 0.2;

			const craftingCost = ((t6Price * t6Needed) + (t5Price * t5Needed) + (dustPrice * dustNeeded)) * 0.85;
			const avgProfit = (t6SellPrice * avgOutput * tpFeeMultilpier) - craftingCost;
			const profitPerSS = avgProfit / spiritShardsUsed;

			const returnOnInvestment =  (avgProfit / craftingCost) * 100;

			craftingData[i].craftingCost = parseFloat(craftingCost.toFixed(2));
			craftingData[i].avgSell = parseFloat(avgOutput * t6SellPrice * 0.85).toFixed(2);
			craftingData[i].avgProfit = parseFloat(avgProfit.toFixed(2));
			craftingData[i].profitPerSS = parseFloat(profitPerSS.toFixed(2));
			craftingData[i].returnOnInvestment = parseFloat(returnOnInvestment.toFixed(2));

			if (profitPerSS > highestProfit) {
				highestProfit = parseFloat(profitPerSS.toFixed(2));
			}

			if (avgProfit > idealProfit && profitPerSS > idealSSProfit) {
				profitableAmounts.push(profitPerSS);
			}
		}
	}

	//app startup code
	const appStartup = function() {
		Promise.all(t6ItemDataUrls.map(url => {
			return fetch(url)
				.then(response => response.json())
		}))
		.then(t6ItemData => {
			Promise.all(t6ListingUrls.map(url => {
				return fetch(url)
					.then(response => response.json())
			}))
			.then(t6ListingData => {
				//append images to respective listings
				for (let i = 0; i < t6ItemData.length; i++) {
					t6ItemData[i].listings = t6ListingData[i];
				}
				//get the material listings
				Promise.all(t5ItemDataUrls.map(url => {
					return fetch(url)
						.then(response => response.json())
				}))
				.then(t5MaterialData => {
					//append images to respective listings
					for (let i = 0; i < t6ItemData.length; i++) {
						t6ItemData[i].t5Material = t5MaterialData[i];
					}
					//get the material listings
					Promise.all(t5ListingUrls.map(url => {
						return fetch(url)
							.then(response => response.json())
					}))
					.then(t5ListingData => {
						//append images to respective listings
						for (let i = 0; i < t6ItemData.length; i++) {
							t6ItemData[i].t5Material.listings = t5ListingData[i];
						}

					// New method of doing multiple fetch calls
					//     return fetch(`${dataUrl}${dustId}`);
					// )
					// .then(function(response){return response.json();})
					// .then(function(json))
						
						fetch(`${dataUrl}${dustId}`)
							.then(function(response){return response.json();})
							.then(function(dustItemJson){
								dustData = dustItemJson;

								fetch(`${listingUrl}${dustId}`)
									.then(function(response) {return response.json() })
									.then(function(dustListingJson) {
										dustData.listings = dustListingJson;

										// Now the functions to populate the page can run
										craftingData = t6ItemData;
										calculateProfit();
										populateTable();
										populateDataChart();
										if (document.getElementById("apiInput").value != ""){
											addAccountAPIDetails();
										}

										// Check for a market crash
										marketCrash = craftingData.every(item => item.avgProfit < 0);

										if (marketCrash) {
											toastr.warning("This market has crashed and is no longer profitable!!", "Warning:");
										}

										// Refresh the data if requested by the user
										if (refresh == true) {
											// Toaster
											profitableItems = craftingData.filter(item => item.avgProfit > idealProfit).length;
											if (profitableItems == 1) {
												toastr.success(`${profitableItems} item is profitable!`, 'Profit Found');
											} else if (profitableItems > 1) {
												toastr.success(`${profitableItems} items are profitable!`, 'Profit Found');
											}
											setTimeout(function(){
												appStartup();
											}, refreshRate);
										}
									})
							})

					})
				})
			})
		})
	}

	// On "Enter" functions for the text inputs
	const addAccountAPIDetailsEnter = function(keyPressed){
		if (keyPressed.keyCode == enterKey || keyPressed.which == enterKey){
			addAccountAPIDetails();
		}
	}

	const setAVGReturnEnter = function(keyPressed){
		if (keyPressed.keyCode == enterKey || keyPressed.which == enterKey){
			setAVGReturn();
		}
	}

	const setBreakPointEnter = function(keyPressed){
		if (keyPressed.keyCode == enterKey || keyPressed.which == enterKey){
			setBreakPoint();
		}
	}

	const setSSBreakPointEnter = function(keyPressed){
		if (keyPressed.keyCode == enterKey || keyPressed.which == enterKey){
			setSSBreakPoint();
		}
	}

	// Display a data chart overlay for copy and paste ability
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
	appStartup();


	// Add Event Listeners
	document.getElementById("addAccountAPI").addEventListener("click", addAccountAPIDetails);
	document.getElementById("setavgResult").addEventListener("click", setAVGReturn);
	document.getElementById("resetavgResult").addEventListener("click", resetAVGReturn);
	document.getElementById("setBreakpoint").addEventListener("click", setBreakPoint);
	document.getElementById("resetBreakpoint").addEventListener("click", resetBreakPoint);
	document.getElementById("setssBreakpoint").addEventListener("click", setSSBreakPoint);
	document.getElementById("resetssBreakpoint").addEventListener("click", resetSSBreakPoint);
	document.getElementById("setRefresh").addEventListener("change", refreshInput);

	document.getElementById("apiInput").addEventListener("keypress", addAccountAPIDetailsEnter);
	document.getElementById("avgResultInput").addEventListener("keypress", setAVGReturnEnter);
	document.getElementById("breakpointInput").addEventListener("keypress", setBreakPointEnter);
	document.getElementById("ssbreakpointInput").addEventListener("keypress", setSSBreakPointEnter);

	document.getElementById("displayDataChart").addEventListener("click", openChart)
	document.getElementById("dataChartOverlay").addEventListener("click", closeChart);
	
})()
