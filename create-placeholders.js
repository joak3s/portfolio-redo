const fs = require('fs');
const path = require('path');

const imageNames = [
  'teardrop.jpg',
  'world-rugby.jpg',
  'dream-house.jpg',
  'fabrication.jpg',
  'portfolio.jpg'
];

const placeholderDir = path.join('public', 'images', 'journey');

// Ensure the directory exists
if (!fs.existsSync(placeholderDir)) {
  fs.mkdirSync(placeholderDir, { recursive: true });
}

// Create placeholder text files as a temporary stand-in for images
imageNames.forEach(imageName => {
  const filePath = path.join(placeholderDir, imageName);
  
  // Create a text file with a message
  fs.writeFileSync(filePath, `This is a placeholder for ${imageName}. Please replace with an actual image.`);
  
  console.log(`Created placeholder for ${imageName}`);
});

console.log('\nPlaceholder files created successfully. Replace these with actual images before deploying.'); 