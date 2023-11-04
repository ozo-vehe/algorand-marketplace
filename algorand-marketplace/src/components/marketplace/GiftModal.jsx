import { useState } from "react";
import { Button } from "react-bootstrap";

/**
 * GiftModal component provides a button to initiate the gifting process for a product.
 * @component
 *
 * @param {function} giftProduct - Function to gift the product to another user.
 * @param {Object} product - The product data.
 */
const GiftModal = ({ giftProduct, product }) => {
    const [visible, setVisible] = useState(false);
    const [receiver, setReceiver] = useState("");

    /**
     * Function to send the gift.
     * Checks if the receiver's address is valid before initiating the gift process.
     */
    const sendGift = async () => {
        if (receiver.length < 58 || !receiver || receiver === "") return false;
        try {
            console.log(receiver);
            console.log("Sending...");
            await giftProduct(product, receiver);
            console.log("Sent, thanks");
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
                Gift
            </Button>
            {visible && (
                <div className="giftModal">
                    <div className="content">
                        <h2>Gift Product</h2>
                        <form>
                            <input
                                type="text"
                                placeholder="Receiver's wallet address"
                                onChange={(e) => {
                                    setReceiver(e.target.value);
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
                                    onClick={sendGift}
                                    className="btn active"
                                >
                                    Gift
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default GiftModal;
