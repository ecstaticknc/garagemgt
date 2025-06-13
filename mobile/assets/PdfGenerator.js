// src/utils/pdfGenerator.js
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import { Platform, Alert } from 'react-native';

// Helper function to convert local image to Base64
const getBase64Image = async (imagePath) => {
  try {
    const asset = Asset.fromModule(imagePath);
    await asset.downloadAsync(); // Ensure the asset is downloaded locally
    const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    // Return the full Data URI string
    return `data:${asset.type};base64,${base64}`;
  } catch (error) {
    console.error("Error converting image to Base64:", error);
    return null;
  }
};

// Helper function to generate HTML list for items
const generateHtmlList = (items) => {
  if (!items || items.length === 0) return '<tr><td colspan="4" style="text-align: center;">सामग्री उपलब्ध नाही</td></tr>';
  const sortedItems = [...items].sort((a, b) => {
    const categoryA = a.category ? a.category.toLowerCase() : '';
    const categoryB = b.category ? b.category.toLowerCase() : '';
    return categoryA.localeCompare(categoryB);
  });

  return sortedItems.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${item.name || 'N/A'}</td>
      <td>${item.category || 'N/A'}</td>
      <td>${item.quantity || 'N/A'} ${item.unit || ''}</td>
    </tr>
  `).join('');
};

// Helper function to get Marathi meal category titles
const getMarathiMealCategoryTitle = (key) => {
  const titles = {
    'sweetDishes': 'गोड पदार्थ',
    'dryVegetableDishes': 'सुकी भाजी',
    'gravyVegetableDishes': 'रस्सा भाजी',
    'breads': 'चपाती',
    'rice': 'भात',
    'others': 'इतर पदार्थ',
  };
  return titles[key] || key;
};

// Helper function to generate meal menu HTML
const generateMealMenuHtml = (mealMenu) => {
  if (!mealMenu) return '<tr><td colspan="6" style="text-align: center;">जेवण मेनू उपलब्ध नाही</td></tr>';

  const headers = [
    'sweetDishes',
    'dryVegetableDishes',
    'gravyVegetableDishes',
    'breads',
    'rice',
    'others',
  ];

  const headerRow = headers.map(key => `<th>${getMarathiMealCategoryTitle(key)}</th>`).join('');
  const valueRow = headers.map(key => {
    const items = mealMenu[key];
    return `<td>${(items && items.length > 0) ? items.join(', ') : 'नाही'}</td>`;
  }).join('');

  return `
    <thead>
      <tr>${headerRow}</tr>
    </thead>
    <tbody>
      <tr>${valueRow}</tr>
    </tbody>
  `;
};

// Main function to generate PDF content
const generatePDFContent = (customer, logoBase64) => {
  const finalLogoData = logoBase64 || ''; // Use empty string if not loaded yet

  return `
    <!DOCTYPE html>
    <html lang="mr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>समर्थ केटरर्स - तपशील</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <style>
          :root {
            --primary-blue: #2f80ed;
            --accent-yellow: #ffc107;
            --text-dark: #333;
            --text-soft: #555;
            --bg-light: #f5f7fa;
            --bg-white: #ffffff;
            --border-color: #e0e0e0;
            --card-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
            --header-gradient: linear-gradient(to right, #2f80ed, #007bff);
          }

          body {
            font-family: 'Noto Sans Devanagari', sans-serif;
            background-color: var(--bg-light);
            color: var(--text-dark);
            padding: 30px;
            margin: 0;
            line-height: 1.6;
          }

          .header-section {
            background: var(--header-gradient);
            color: white;
            padding: 15px 0;
            text-align: center;
            border-radius: 12px 12px 0 0;
            margin-bottom: 20px;
          }

          h1 {
            text-align: center;
            color: white;
            font-size: 40px;
            margin-bottom: 5px;
            padding-bottom: 8px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
          }

          .contact-details {
            text-align: center;
            font-size: 16px;
            margin-bottom: 10px;
            color: white;
          }

          .company-tagline {
            text-align: center;
            font-size: 15px;
            color: #e0e0e0;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid rgba(255, 255, 255, 0.3);
            width: 80%;
            margin-left: auto;
            margin-right: auto;
          }

          h2 {
            font-size: 24px;
            margin-bottom: 15px;
            color: var(--primary-blue);
            border-bottom: 3px solid var(--accent-yellow);
            padding-bottom: 8px;
            text-align: center;
          }

          .section {
            background: var(--bg-white);
            padding: 20px 25px;
            margin-bottom: 15px;
            border-radius: 12px;
            box-shadow: var(--card-shadow);
            border: 1px solid var(--border-color);
          }

          /* New container for customer and financial details */
          .details-container {
            display: grid;
            grid-template-columns: 1fr 1fr; /* Two equal columns */
            gap: 30px; /* Space between the two main sections */
            padding: 20px 25px; /* Match existing section padding */
            background: var(--bg-white);
            margin-bottom: 15px;
            border-radius: 12px;
            box-shadow: var(--card-shadow);
            border: 1px solid var(--border-color);
          }

          .details-column {
            /* Styling for each sub-column within the details-container */
            padding: 15px;
            border-radius: 8px;
            border: 1px solid var(--border-color); /* Subtle border for each column */
          }

          .details-column h2 {
            margin-top: 0; /* Remove top margin as it's within a sub-container */
            padding-top: 0;
            border-bottom: none; /* Remove border from here as it's handled by main h2 */
            margin-bottom: 15px;
            font-size: 20px; /* Slightly smaller for sub-headings */
            color: var(--text-dark); /* Darker color for sub-headings */
          }
          .details-column h2::after { /* Specific styling for sub-h2 underlines */
            background-color: var(--accent-yellow); /* Use accent for these underlines */
          }


          /* Style for customer details grid (inside its column) */
          .customer-details-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); /* Adjusted minmax */
            gap: 5px 15px; /* Smaller gap */
            padding-top: 5px; /* Smaller padding */
          }

          .customer-details-grid p {
            margin: 0;
            padding: 3px 0; /* Smaller padding */
            font-size: 15px; /* Slightly smaller font */
          }

          /* Financial details within its column */
          .financial-details {
            display: flex;
            flex-direction: column; /* Stack financial items vertically */
            gap: 1rem; /* Space between amounts */
            margin-top: 0.5rem; /* Space from title */
            justify-content: center; /* Center items if they don't fill space */
            background-color: transparent; /* No background here, handled by .details-column */
            padding: 0; /* No padding here */
            border: none; /* No border here */
            align-items: flex-start; /* Align amounts to the left within their column */
          }

          .amount {
            width: 90%; /* Make each amount take full width of its container */
            font-size: 16px; /* Slightly smaller for compactness */
            padding: 10px 15px;
            border-radius: 5px;
            font-weight: bold;
            background-color: #f8f8f8; /* Light background for each amount box */
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08); /* Lighter shadow */
            text-align: left; /* Align text within amount box to left */
          }

          /* New style for page breaks */
          .new-page {
            page-break-before: always;
          }

          /* Default p styling might need override for specific sections */
          p {
            font-size: 16px;
            margin: 10px 0;
          }

          p strong {
            color: var(--primary-blue);
          }

          table {
            width: 100%;
            border-collapse: collapse;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
            margin-top: 15px;
          }

          th,
          td {
            padding: 14px 16px;
            border: 1px solid var(--border-color);
            font-size: 15px;
            text-align: left;
          }

          th {
            background-color: var(--primary-blue);
            color: white;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: bold;
          }

          tbody tr:nth-child(even) {
            background-color: #f9f9f9;
          }

          .customer-tips-section {
            background-color: #e8f0fe;
            border-left: 6px solid var(--primary-blue);
            padding: 25px;
            border-radius: 12px;
            box-shadow: var(--card-shadow);
            border: 1px solid var(--primary-blue);
          }

          .customer-tips-section h2 {
            background: none;
            color: var(--primary-blue);
            border: none;
            padding-left: 0;
            margin-bottom: 20px;
          }

          .customer-tips-section ul {
            padding: 0;
            list-style: none;
          }

          .customer-tips-section li {
            position: relative;
            padding-left: 32px;
            margin-bottom: 12px;
            font-size: 16px;
            color: var(--text-dark);
            line-height: 1.5;
          }

          .customer-tips-section li::before {
            content: '✔';
            color: var(--accent-yellow);
            font-weight: bold;
            position: absolute;
            left: 0;
            top: 1px;
            font-size: 18px;
          }
          .logo-container {
            text-align: center;
            margin-bottom: 15px;
            border-radius: 8px;
          }
          .logo {
            max-width: 120px;
            height: auto;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
          }

          /* General enhancements */
          .section h2::after {
            content: '';
            display: block;
            width: 50px;
            height: 3px;
            background-color: var(--primary-blue);
            margin: 10px auto 0 auto;
            border-radius: 2px;
          }
            .amount.total {
  color: #007bff; /* Blue */
}

.amount.advance {
  color: #28a745; /* Green */
}

.amount.balance {
  color: red;
}
        </style>
      </head>

      <body>
        <div class="header-section">
          <div class="logo-container">
            <img src="${finalLogoData}" alt="Company Logo" class="logo" />
          </div>
          <h1>समर्थ केटरर्स</h1>
          <p class="contact-details">मु.पो. पाकणी, ता.उत्तर सोलापूर मो. 9923600099/8177978555</p>
          <p class="company-tagline">साखरपुडा, हळदी, लग्न, मुंज, नामकरण, स्वागत समारंभ, वाढदिवस, भोजन इ. कॉन्ट्रॅक्ट व थाळी
          पद्धतीने ऑडर स्वीकारले जातील.</p>
        </div>

        <div class="details-container">
          <div class="details-column">
            <h2>ग्राहक तपशील</h2>
            <div class="customer-details-grid">
              <p><strong>नाव:</strong> ${customer.fullName || 'N/A'}</p>
              <p><strong>मोबाईल:</strong> ${customer.mobile || 'N/A'}</p>
              <p><strong>पत्ता:</strong> ${customer.address || 'N/A'}</p>
              <p><strong>कार्यक्रम प्रकार:</strong> ${customer.functionType || 'N/A'}</p>
              <p><strong>कार्यक्रमाची तारीख:</strong> ${customer.functionDate || 'N/A'}</p>
              <p><strong>कार्यक्रमाचा पत्ता:</strong> ${customer.venueAddress || 'N/A'}</p>
            </div>
          </div>

          <div class="details-column">
            <h2>आर्थिक तपशील</h2>
            <div class="financial-details">
              <div class="amount total"><strong>एकूण रक्कम:</strong> ₹${customer.totalAmount || 0}</div>
              <div class="amount advance"><strong>अ‍ॅडव्हान्स रक्कम:</strong> ₹${customer.advanceAmount || 0}</div>
              <div class="amount balance"><strong>शिल्लक रक्कम:</strong> ₹${customer.balanceAmount || 0}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>जेवण मेनू</h2>
          <table>
            ${generateMealMenuHtml(customer.mealMenu)}
          </table>
        </div>

        <div class="section new-page">
          <h2>सामग्री यादी</h2>
          <table>
            <thead>
              <tr>
                <th>क्र.</th>
                <th>सामग्रीचे नाव</th>
                <th>वर्ग</th>
                <th>प्रमाण</th>
              </tr>
            </thead>
            <tbody>
              ${generateHtmlList(customer.items)}
            </tbody>
          </table>
        </div>

        <div class="section customer-tips-section new-page">
          <h2>ग्राहकांसाठी सूचना</h2>
          <ul>
            <li>कृपया बुकिंग करताना सर्व माहिती अचूक व स्पष्टपणे भरा.</li>
            <li>बुकिंग कन्फर्म करताना आगाऊ रक्कम भरणे आवश्यक आहे.</li>
            <li>एकदा भरलेली आगाऊ रक्कम परत केली जाणार नाही.</li>
            <li>कृपया सदर सामुग्रीची यादी प्रमाणे सर्व सामुग्री १ ते २ दिवस अगोदर आणून देणे...</li>
            <li>कार्यक्रमाच्या किमान ३ दिवस आधी पाहुण्यांची अंतिम संख्या कळवा.</li>
            <li>कार्यक्रमात काही बदल असल्यास आम्हाला त्वरित कळवा.</li>
            <li>स्वच्छता व वेळेचे पालन हे आमचे प्रमुख धोरण आहे.</li>
            <li>सेवेसंदर्भात काही अडचण असल्यास कृपया तत्काळ संपर्क साधा.</li>
            <li>आमच्या सेवेबद्दल तुमचे अभिप्राय व सूचना आम्हाला कळवा.</li>
          </ul>
        </div>
      </body>
    </html>
  `;
};

/**
 * Generates a PDF for a given customer and shares it.
 * @param {object} customer - The customer data.
 * @param {number} logoAssetPath - The require() path to the logo image asset (e.g., require('../assets/logo.png')).
 */
export const generateAndShareCustomerPDF = async (customer) => {
  const logoAssetPath = require('../assets/samarthlogo.png'); // Adjust the path as necessary
  try {
    const logoBase64 = await getBase64Image(logoAssetPath);
    if (!logoBase64) {
      console.warn("Logo could not be loaded. Generating PDF without logo.");
    }

    const html = generatePDFContent(customer, logoBase64);
    const { uri } = await Print.printToFileAsync({ html });

    if (Platform.OS === 'android') {
      const newPath = `${FileSystem.documentDirectory}customer_${customer.fullName.replace(/\s/g, '_')}_${customer.id}.pdf`;
      await FileSystem.copyAsync({ from: uri, to: newPath });
      await Sharing.shareAsync(newPath);
    } else {
      await Sharing.shareAsync(uri);
    }
  } catch (error) {
    console.error('Error generating or sharing PDF:', error);
    Alert.alert('त्रुटी', 'PDF तयार करताना किंवा शेअर करताना त्रुटी आली');
  }
};