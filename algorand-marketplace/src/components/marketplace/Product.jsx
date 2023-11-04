import React, { useState } from "react";
import PropTypes from "prop-types";
import { Badge, Button, Card, Col, FloatingLabel, Form, Stack } from "react-bootstrap";
import { microAlgosToString, truncateAddress } from "../../utils/conversions";
import Identicon from "../utils/Identicon";
import GiftModal from "./GiftModal";
import UpdateProduct from "./UpdateProduct";

/**
 * Product component displays information about a specific product
 * and provides functionalities such as buying, gifting, updating, and deleting the product.
 * @component
 *
 * @param {string} address - The address of the user.
 * @param {Object} product - The product data.
 * @param {function} giftProduct - Function to gift the product to another user.
 * @param {function} updateProduct - Function to update the product's information.
 * @param {function} buyProduct - Function to buy the product.
 * @param {function} deleteProduct - Function to delete the product.
 */
const Product = ({ address, product, giftProduct, updateProduct, buyProduct, deleteProduct }) => {
    const { name, image, description, price, sold, appId, owner } =
        product;

    const [count, setCount] = useState(1);

    return (
        <>
            <Col key={appId}>
                <Card className="h-100">
                    <Card.Header>
                        <Stack direction="horizontal" gap={2}>
                            <span className="font-monospace text-secondary">{truncateAddress(owner)}</span>
                            <Identicon size={28} address={owner} />
                            <Badge bg="secondary" className="ms-auto">
                                {sold} Sold
                            </Badge>
                        </Stack>
                    </Card.Header>
                    <div className="ratio ratio-4x3">
                        <img src={image} alt={name} style={{ objectFit: "cover" }} />
                    </div>
                    <Card.Body className="d-flex flex-column text-center">
                        <Card.Title>{name}</Card.Title>
                        <Card.Text className="flex-grow-1">{description}</Card.Text>
                        <Form className="d-flex align-content-stretch flex-row gap-2">
                            {product.owner === address ? (
                                <>
                                    <GiftModal giftProduct={giftProduct} product={product} />
                                    <Button
                                        variant="outline-danger"
                                        onClick={() => deleteProduct(product)}
                                        className="btn"
                                    >
                                        <i className="bi bi-trash"></i>
                                    </Button>
                                    <UpdateProduct updateProduct={updateProduct} product={product} />
                                </>
                            ) : (
                                <>
                                    <FloatingLabel
                                        controlId="inputCount"
                                        label="Count"
                                        className="w-25"
                                    >
                                        <Form.Control
                                            type="number"
                                            value={count}
                                            min="1"
                                            max="10"
                                            onChange={(e) => {
                                                setCount(Number(e.target.value));
                                            }}
                                        />
                                    </FloatingLabel>
                                    <Button
                                        variant="outline-dark"
                                        onClick={() => buyProduct(product, count)}
                                        className="w-75 py-3"
                                    >
                                        Buy for {microAlgosToString(price) * count} ALGO
                                    </Button>
                                </>
                            )}
                        </Form>
                    </Card.Body>
                </Card>
            </Col>
        </>
    );
};

Product.propTypes = {
    address: PropTypes.string.isRequired,
    product: PropTypes.instanceOf(Object).isRequired,
    buyProduct: PropTypes.func.isRequired,
    giftProduct: PropTypes.func.isRequired,
    deleteProduct: PropTypes.func.isRequired,
};

export default Product;
