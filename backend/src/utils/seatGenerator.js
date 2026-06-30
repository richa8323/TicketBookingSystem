/**
 * Convert a 0-indexed number to an alphabetic row label (A, B, C... Z, AA, AB...)
 * @param {number} index
 * @returns {string}
 */
const getRowLabel = (index) => {
  let label = '';
  let temp = index;
  while (temp >= 0) {
    label = String.fromCharCode((temp % 26) + 65) + label;
    temp = Math.floor(temp / 26) - 1;
  }
  return label;
};

/**
 * Generate seat layout list based on rows, columns, and seat categories
 * @param {number} rows - Number of rows in grid
 * @param {number} cols - Number of columns in grid
 * @param {Array} seatCategories - Array of category objects { name, priceMultiplier }
 * @returns {Array} List of seat metadata objects
 */
const generateSeatLayout = (rows, cols, seatCategories = []) => {
  const seats = [];
  
  // Extract category names. Default to ['Standard'] if empty
  const categories = seatCategories.length > 0 
    ? seatCategories.map(cat => cat.name) 
    : ['Standard'];

  const numCategories = categories.length;

  for (let r = 0; r < rows; r++) {
    const rowLabel = getRowLabel(r);
    
    // Distribute categories by splitting the rows horizontally.
    // E.g., if we have ['Premium', 'Standard'], front segment gets Premium, remaining get Standard.
    let categorySelected;
    if (numCategories > 1) {
      const segmentIndex = Math.floor((r / rows) * numCategories);
      categorySelected = categories[Math.min(segmentIndex, numCategories - 1)];
    } else {
      categorySelected = categories[0];
    }

    for (let c = 1; c <= cols; c++) {
      seats.push({
        seatId: `${rowLabel}${c}`,
        row: rowLabel,
        number: c,
        category: categorySelected
      });
    }
  }

  return seats;
};

module.exports = { generateSeatLayout, getRowLabel };
