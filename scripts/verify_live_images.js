const http = require('http');

http.get('http://localhost:3000/discover', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const hasSheetImages = data.includes('sheet') || data.includes('item_r000');
    console.log('DOES /discover CONTAIN REAL SPREADSHEET IMAGES?', hasSheetImages);
    const matches = data.match(/item_r[0-9a-zA-Z_]+/g);
    console.log('Extracted sheet item matches in page payload:', matches ? matches.slice(0, 10) : 'None');

  });
});
