// Reusable Modules

// Output Item Value with Coin Icons
export const outputValueWithCoins = function(value) {
	const goldImage = '<img class="coinImage" title="gold coin" src="images/coinGold.png" />';
	const silverImage = '<img class="coinImage" title="silver coin" src="images/coinSilver.png" />';
	const bronzeImage = '<img class="coinImage" title="bronze coin" src="images/coinBronze.png" />';
	const negative = value < 0;
	const valueString = negative ? (value * -1).toFixed() : value.toFixed();
	let goldValue, silverValue, bronzeValue;
	goldValue = silverValue = bronzeValue = '';

	// Handle Gold Value
	if (valueString.length >= 5) {
		const goldDigits = valueString.slice(0, valueString.length - 4).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		goldValue = goldDigits + goldImage;
	}

	// Handle Silver Value
	if (valueString.length >= 3) {
		const silverDigits = valueString.slice(-4,-2);
		silverValue = (silverDigits.length === 2 && silverDigits.charAt(0) === '0' ? silverDigits.slice(-1) : silverDigits ) + silverImage;
	}

	// Handle Bronze
	const bronzwDigits = valueString.slice(-2);
	bronzeValue = (bronzwDigits.length === 2 && bronzwDigits.charAt(0) === '0' ? bronzwDigits.slice(-1) : bronzwDigits ) + bronzeImage;

	// Return Value String
  return (negative ? '-' : '') + goldValue + silverValue + bronzeValue;
}