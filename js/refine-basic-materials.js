import { outputValueWithCoins } from "./modules.js";

(function(){
	const refineBasicMaterials = function() {
		// Variables
		const tableHeadings = ["Refined Material", "Raw Material", "Quantity", "Additional Material", "Quantity", "Sell Profit"];
		const listingUrl = "https://api.guildwars2.com/v2/commerce/listings";
		const dataUrl = "https://api.guildwars2.com/v2/items";
		let materialIDArray = [];
		let apiData = {};

		// Item Name and IDs
		const materialsStructureObject = [
			{
				name: "Cloth Scrap", 
				materials: [
					// Bolt of Jute
					{refinedID: 19720, rawID: 19718, rawQuantity: 2},
					// Bolt of Wool
					{refinedID: 19740, rawID: 19739, rawQuantity: 2},
					// Bolt of Cotton
					{refinedID: 19742, rawID: 19741, rawQuantity: 2},
					// Bolt of Linen
					{refinedID: 19744, rawID: 19743, rawQuantity: 2},
					// Bolt of Silk
					{refinedID: 19747, rawID: 19748, rawQuantity: 3},
					// Bolt of Gossamer
					{refinedID: 19746, rawID: 19745, rawQuantity: 2}
				]
			},
			{
				name: "Ore",
				materials: [
					// Copper Ingot
					{refinedID: 19680, rawID: 19697, rawQuantity: 2},
					// Bronze Ingot
					{refinedID: 19679, refinedOutput: 5, rawID: 19697, rawQuantity: 10, additionalID: 19704, additionalQuantity: 1, additionalPrice: 8},
					// Iron Ingot
					{refinedID: 19683, rawID: 19699, rawQuantity: 3},
					// Steel Ingot
					{refinedID: 19688, rawID: 19699, rawQuantity: 3, additionalID: 19750, additionalQuantity: 1, additionalPrice: 16},
					// Silver Ingot
					{refinedID: 19687, rawID: 19703, rawQuantity: 2},
					// Gold Ingot
					{refinedID: 19682, rawID: 19698, rawQuantity: 2},
					// Platinum Ingot
					{refinedID: 19686, rawID: 19702, rawQuantity: 2},
					// Darksteel Ingot
					{refinedID: 19681, rawID: 19702, rawQuantity: 2, additionalID: 19924, additionalQuantity: 1, additionalPrice: 48},
					// Mithril Ingot
					{refinedID: 19684, rawID: 19700, rawQuantity: 2},
					// Orichalcum Ingot
					{refinedID: 19685, rawID: 19701, rawQuantity: 2}
				]
			},
			{
				name: "Leather Section",
				materials: [
					// Stretched Rawhide Leather Square
					{refinedID: 19738, rawID: 19719, rawQuantity: 2},
					// Cured Thin Leather Square
					{refinedID: 19733, rawID: 19728, rawQuantity: 2},
					// Cured Coarse Leather Square
					{refinedID: 19734, rawID: 19730, rawQuantity: 2},
					// Cured Rugged Leather Square
					{refinedID: 19736, rawID: 19731, rawQuantity: 2},
					// Cured Thick Leather Square
					{refinedID: 19735, rawID: 19729, rawQuantity: 4},
					// Cured Hardened Leather Square
					{refinedID: 19737, rawID: 19732, rawQuantity: 3}
				]
			},
			{
				name: "Log",
				materials: [
					// Green Wood Plank
					{refinedID: 19710, rawID: 19723, rawQuantity: 3},
					// Soft Wood Plank
					{refinedID: 19713, rawID: 19726, rawQuantity: 2},
					// Seasoned Wood Plank
					{refinedID: 19714, rawID: 19727, rawQuantity: 3},
					// Hard Wood Plank
					{refinedID: 19711, rawID: 19724, rawQuantity: 3},
					// Elder Wood Plank
					{refinedID: 19709, rawID: 19722, rawQuantity: 3},
					// CAncient Wood Plank
					{refinedID: 19712, rawID: 19725, rawQuantity: 3}
				]
			}
		];

		// Setup API URLs
		materialsStructureObject.forEach(materialType => {
			materialType['materials'].forEach(refinedMaterial => {
				if (!materialIDArray.includes(refinedMaterial.refinedID)) {
					materialIDArray.push(refinedMaterial.refinedID);
				}

				if (!materialIDArray.includes(refinedMaterial.rawID)) {
					materialIDArray.push(refinedMaterial.rawID);
				}

				if (refinedMaterial.additionalID && !materialIDArray.includes(refinedMaterial.additionalID)) {
					materialIDArray.push(refinedMaterial.additionalID);
				}
			});
		});

		const materialIDString = materialIDArray.join(',');
		const apiDataURLs = [
			listingUrl + '?ids=' + materialIDString,
			dataUrl + '?ids=' + materialIDString
		];


		// Create the Data Table
		const generateTable = function() {
			// Get the container for the table
			const container = document.getElementById("refine-basic-materials-table");
			
			// Create the <table> element
			const table = document.createElement("table");
			table.classList.add("table");
			
			// Creating headings
			const tHead = document.createElement("thead");
			const headingRow = document.createElement("tr");

			tableHeadings.forEach(heading => {
				const cell = document.createElement("th");
				const cellText = document.createTextNode(heading);
				cell.appendChild(cellText);
				headingRow.appendChild(cell);
			});
			tHead.appendChild(headingRow);

			table.appendChild(tHead);

			// Creating tbody for each material type
			materialsStructureObject.forEach((materialType, b) => {
				const tBody = document.createElement("tbody");
				tBody.classList.add("with-header");
				const tr = document.createElement("tr");
				const th = document.createElement("th");
				th.setAttribute("colspan", tableHeadings.length);
				const thText = document.createTextNode(materialType.name);
				th.appendChild(thText);
				tr.appendChild(th);
				tBody.appendChild(tr);

				materialType['materials'].forEach((refinedMaterial, i) => {
					const tr = document.createElement("tr");
					tr.setAttribute("id", `b${b}_r${i}`);

					for (let j = 0; j < tableHeadings.length; j++) {
						const td = document.createElement("td");
						td.setAttribute("id", `b${b}_r${i}_c${j}`)
						const tdText = document.createTextNode("loading api...");
						td.appendChild(tdText);
						tr.appendChild(td);
						tBody.appendChild(tr);
					}
				});

				table.appendChild(tBody);
			});
		
			// Add the table to the DOM
			container.appendChild(table);
		}


		// Populate the table
		const populateTable = function() {
			materialsStructureObject.forEach((materialType, b) => {

				materialType['materials'].forEach((refinedMaterial, i) => {
					// Calculate profit
					const refinedOutput = refinedMaterial.refinedOutput ? refinedMaterial.refinedOutput : 1;
					const refinedValue = (apiData[refinedMaterial.refinedID].sells[0].unit_price * 0.85) * refinedOutput;
					const rawValue = (apiData[refinedMaterial.rawID].sells[0].unit_price * 0.85) * refinedMaterial.rawQuantity;
					const additionalValue = refinedMaterial.additionalID ? refinedMaterial.additionalPrice * refinedMaterial.additionalQuantity : 0;
					const sellProfit = Math.round(refinedValue - (rawValue + additionalValue));

					// Populate refined material
					let targetCell = document.getElementById(`b${b}_r${i}_c0`);
					targetCell.innerHTML = 
						`<span class="table__material-cell">
							<img class="table__material-cell-image" src="${apiData[refinedMaterial.refinedID].icon}" />
							${apiData[refinedMaterial.refinedID].name}
						</span>`;

					// Populate raw material
					targetCell = document.getElementById(`b${b}_r${i}_c1`);
					targetCell.innerHTML = 
						`<span class="table__material-cell">
							<img class="table__material-cell-image" src="${apiData[refinedMaterial.rawID].icon}" />
							${apiData[refinedMaterial.rawID].name}
						</span>`;

					// Populate raw quantity
					targetCell = document.getElementById(`b${b}_r${i}_c2`);
					targetCell.innerHTML = `<p class="table__value-cell">${refinedMaterial.rawQuantity}</p>`;

					// Populate additional material
					targetCell = document.getElementById(`b${b}_r${i}_c3`);

					if (refinedMaterial.additionalID) {
						targetCell.innerHTML = 
							`<span class="table__material-cell">
								<img class="table__material-cell-image" src="${apiData[refinedMaterial.additionalID].icon}" />
								${apiData[refinedMaterial.additionalID].name}
							</span>`;
					} else {
						targetCell.innerHTML = '';
					}

					// Populate additional quantity
					targetCell = document.getElementById(`b${b}_r${i}_c4`);
					targetCell.innerHTML = refinedMaterial.additionalID ? `<p class="table__value-cell">${refinedMaterial.additionalQuantity}</p>` : '';

					// Populate sell profit
					targetCell = document.getElementById(`b${b}_r${i}_c5`);
					targetCell.innerHTML = `<span class="table__value-cell coinContainer">${outputValueWithCoins(sellProfit)}</span>`;

					if (sellProfit > 0) {
						targetCell.classList.add("profitable");
						document.getElementById(`b${b}_r${i}`).classList.add("profitableRow");
					} else if (sellProfit < 0) {
						targetCell.classList.add("notProfitable");
					}
				});
			});
		}

		// App startup code
		const fetchAPIData = function() {
			Promise.all(apiDataURLs.map(url => {
				return fetch(url)
					.then(response => response.json())
			}))
			.then(apiDataJson => {
				const [listings, data] = apiDataJson;
				
				listings.forEach((item, i) => {
					apiData[item.id] = {...item, ...data[i]};
				});

				populateTable();
			});
		}


		// Trigger the application to run
		generateTable();
		fetchAPIData();
	}

	// Initialize the T6 App once the DOM is ready
	document.addEventListener('DOMContentLoaded', function () {
		refineBasicMaterials();
	});
})()