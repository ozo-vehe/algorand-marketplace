import { useState } from "react";
import { Button } from "react-bootstrap";

/**
 * UpdateProduct component provides a modal for updating a product.
 * @component
 *
 * @param {function} updateProduct - Function to update a product.
 * @param {Object} product - The product to be updated.
 */
const UpdateProduct = ({ updateProduct, product }) => {
    const [visible, setVisible] = useState(false);
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState(null);

    /**
     * Sends the update request for the product.
     */
    const sendUpdate = async () => {
        if (
            description.length < 0 ||
            !description ||
            description === "" ||
            price < 0 ||
            !price ||
            price === ""
        )
            return false;
        try {
            console.log(description);
            console.log("Updating...");
            await updateProduct(product, Number(price), description);
            console.log("Updated, thanks");
        } catch (error) {
            console.log(error);
        } finally {
            console.log("finished");
        }
    };

    return (
        <>
            <Button
                variant="outline-dark"
                onClick={() => setVisible(true)}
                className="btn w-75 py-3"
            >
                Update
            </Button>
            {visible && (
                <div className="giftModal">
                    <div className="content">
                        <h2>Update Product</h2>
                        <form>
                            <input
                                type="text"
                                placeholder="Description"
                                onChange={(e) => {
                                    setDescription(e.target.value);
                                }}
                            />

                            <input
                                type="number"
                                placeholder="New price"
                                onChange={(e) => {
                                    setPrice(e.target.value);
                                }}
                            />
                            <div className="formBtn">
                                <Button
                                    variant="outline-dark"
                                    onClick={() => setVisible(false)}
                                    className="btn"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="outline-dark"
                                    onClick={sendUpdate}
                                    className="btn active"
                                >
                                    Update
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default UpdateProduct;
