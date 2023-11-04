import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import AddProduct from "./AddProduct";
import Product from "./Product";
import Loader from "../utils/Loader";
import { NotificationError, NotificationSuccess } from "../utils/Notifications";
import {
  buyProductAction,
  createProductAction,
  deleteProductAction,
  updateProductAction,
  giftProductAction,
  getProductsAction,
} from "../../utils/marketplace";
import PropTypes from "prop-types";
import { Row } from "react-bootstrap";

/**
 * Products component displays a list of products and provides
 * functionalities such as creating, buying, updating, deleting, and gifting products.
 * @component
 *
 * @param {string} address - The address of the user.
 * @param {function} fetchBalance - Function to fetch the balance of the user.
 */
const Products = ({ address, fetchBalance }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * Fetches the list of products from the smart contract on component mount.
   */
  const getProducts = async () => {
    try {
      setLoading(true);
      const fetchedProducts = await getProductsAction();
      if (!fetchedProducts) {
        return;
      }
      console.log(fetchedProducts);
      setProducts(fetchedProducts);
    } catch (e) {
      console.log({ e });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getProducts();
  }, []);

  /**
   * Creates a new product and updates the product list and user balance.
   * @param {Object} data - Product data to be created.
   */
  const createProduct = async (data) => {
    try {
      setLoading(true);
      await createProductAction(address, data);
      toast(<NotificationSuccess text="Product added successfully." />);
      await getProducts();
      await fetchBalance(address);
    } catch (error) {
      console.log(error);
      toast(
        <NotificationError
          text={error?.message || "Failed to create a product."}
        />
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Buys a product and updates the product list and user balance.
   * @param {Object} product - The product to be bought.
   * @param {number} count - The quantity to be bought.
   */
  const buyProduct = async (product, count) => {
    try {
      setLoading(true);
      await buyProductAction(address, product, count);
      toast(<NotificationSuccess text="Product bought successfully." />);
      await getProducts();
      await fetchBalance(address);
    } catch (error) {
      console.log(error);
      toast(
        <NotificationError
          text={error?.message || "Failed to create a product."}
        />
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Deletes a product and updates the product list and user balance.
   * @param {Object} product - The product to be deleted.
   */
  const deleteProduct = async (product) => {
    try {
      setLoading(true);
      await deleteProductAction(address, product.appId);
      toast(<NotificationSuccess text="Product deleted successfully" />);
      getProducts();
      fetchBalance(address);
    } catch (error) {
      console.log(error);
      toast(<NotificationError text="Failed to delete product." />);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gifts a product to another user and updates the product list and user balance.
   * @param {Object} product - The product to be gifted.
   * @param {string} receiver - The address of the recipient.
   */
  const giftProduct = async (product, receiver) => {
    try {
      console.log("Received");
      setLoading(true);
      await giftProductAction(address, product.appId, receiver);
      toast(<NotificationSuccess text="Product gifted successfully" />);
      getProducts();
      fetchBalance(address);
    } catch (error) {
      console.log(error);
      toast(<NotificationError text="Failed to gift product." />);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Updates a product's price and description and updates the product list and user balance.
   * @param {Object} product - The product to be updated.
   * @param {number} price - The new price of the product.
   * @param {string} description - The new description of the product.
   */
  const updateProduct = async (product, price, description) => {
    try {
      console.log("Received");
      console.log(price, description);
      setLoading(true);
      await updateProductAction(address, product.appId, price, description);
      toast(<NotificationSuccess text="Product updated successfully" />);
      getProducts();
      fetchBalance(address);
    } catch (error) {
      console.log(error);
      toast(<NotificationError text="Failed to update product." />);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fs-4 fw-bold mb-0">Street Food</h1>
        <AddProduct createProduct={createProduct} />
      </div>
      <Row xs={1} sm={2} lg={3} className="g-3 mb-5 g-xl-4 g-xxl-5">
        <>
          {products.map((product, index) => (
            <Product
              address={address}
              product={product}
              buyProduct={buyProduct}
              deleteProduct={deleteProduct}
              giftProduct={giftProduct}
              updateProduct={updateProduct}
              key={index}
            />
          ))}
        </>
      </Row>
    </>
  );
};

Products.propTypes = {
  address: PropTypes.string.isRequired,
  fetchBalance: PropTypes.func.isRequired,
};

export default Products;