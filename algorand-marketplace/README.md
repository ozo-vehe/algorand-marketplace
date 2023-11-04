# Algorand Food Marketplace

## Overview

Algorand Food Marketplace is a decentralized marketplace built on the Algorand blockchain, providing a transparent and secure platform for food vendors and consumers. Vendors can list their unique products, including name, image, description, and price, while consumers can seamlessly buy these products using Algorand's native cryptocurrency, ALGO. Additionally, vendors can gift their products to a customer using the customer's Algorand wallet address. With features like real-time updates and ownership transfers through smart contracts, ALgorand Food Marketplace fosters a trustful and efficient ecosystem for street food enthusiasts.

## Features
- **Create Products:** Street food vendors can add their products to the marketplace by providing details such as name, image, description, and price.
- **Buy Products:** Users can purchase street food products using Algorand's native cryptocurrency (ALGO). The smart contract ensures secure and transparent transactions. Users can also purchase multiple products.
- **Gift Products:** Users have the option to gift a product to another Algorand wallet address. The smart contract handles the transfer of ownership securely.
- **Update Product Information:** Street food vendors can update the price and description of their products through the marketplace.

## Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```
   
2. **Run the Application:**
   ```bash
   npm start
   ```

3. **Access the Marketplace:**
   Open your browser and navigate to [http://localhost:3000](http://localhost:3000).

## Usage

1. **Add a Product:**
   - Click on the "+" button to add a new street food product.
   - Fill in the required details and save the product.

2. **Buy a Product:**
   - Browse the list of available products.
   - Enter the quantity and click "Buy" to purchase a product.
   - You can increase the amount of product you want to by using the input field beside the `buy` button

3. **Gift a Product:**
   - Select a product and click "Gift."
   - Enter the recipient's Algorand wallet address.

4. **Update Product Information:**
   - For products you own, click "Update" to modify the price and description.

## Contributing
If you'd like to contribute to this project, please follow the standard Git workflow:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Make changes and commit (`git commit -m 'Add new feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Create a pull request.
