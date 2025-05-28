import { useEffect } from "react";
import { Col, Container, Row, Button } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import {
  addToCart,
  decreaseQty,
  deleteProduct,
} from "../app/features/cart/cartSlice";

const Cart = () => {
  const { cartList } = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  
  const totalPrice = cartList.reduce(
    (price, item) => price + item.qty * item.price,
    0
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleCheckout = () => {
    const phone = "2348134567268"; // International format, no '+'
    // Build message: only productName and qty
    let message = "Hello, I'd like to place an order:\n";
    cartList.forEach((item, idx) => {
      message += `${idx + 1}. ${item.productName} - Quantity: ${item.qty}\n`;
    });
    // Encode and open WhatsApp
    const encoded = encodeURIComponent(message);
    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`;
    window.open(url, "_blank");
  };

  return (
    <section className="cart-items py-5">
      <Container>
        <Row className="justify-content-center">
          <Col md={8}>
            {cartList.length === 0 ? (
              <h1 className="no-items product text-center my-5">
                No Items are added in Cart
              </h1>
            ) : (
              cartList.map((item) => {
                const productQty = item.price * item.qty;
                return (
                  <div
                    className="cart-list mb-4 p-3 border rounded"
                    key={item.id}
                  >
                    <Row className="align-items-center">
                      <Col sm={4} md={3} className="text-center">
                        <img
                          src={item.imgUrl}
                          alt={item.productName}
                          className="img-fluid rounded"
                        />
                      </Col>
                      <Col sm={8} md={9}>
                        <Row className="cart-content">
                          <Col
                            xs={12}
                            sm={9}
                            className="cart-details"
                          >
                            <h5 className="mb-2">{item.productName}</h5>
                            <p className="mb-1 text-muted">
                            ₦{item.price}.00 × {item.qty}
                            </p>
                            <h6 className="fw-bold">
                              ${productQty}.00
                            </h6>
                          </Col>
                          <Col
                            xs={12}
                            sm={3}
                            className="cartControl d-flex align-items-center justify-content-end mt-2 mt-sm-0"
                          >
                            <div className="d-flex">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                className="me-2"
                                onClick={() =>
                                  dispatch(addToCart({ product: item, num: 1 }))
                                }
                              >
                                <i className="fa-solid fa-plus"></i>
                              </Button>
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() =>
                                  dispatch(decreaseQty(item))
                                }
                              >
                                <i className="fa-solid fa-minus"></i>
                              </Button>
                            </div>
                          </Col>
                        </Row>
                      </Col>
                      <Col xs={12} className="text-end mt-3">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => dispatch(deleteProduct(item))}
                        >
                          <i className="fa-solid fa-trash"></i> Remove
                        </Button>
                      </Col>
                    </Row>
                  </div>
                );
              })
            )}
          </Col>

          {/* Cart Summary */}
          <Col md={4}>
            <div className="cart-total p-4 border rounded shadow-sm">
              <h4 className="mb-4 text-center">Cart Summary</h4>
              <div className="d-flex justify-content-between mb-3">
                <span className="fw-medium">Total Price:</span>
                <span className="fw-bold">₦{totalPrice}.00</span>
              </div>

              {/* Checkout Button */}
              <div className="d-grid gap-2 mt-4">
                <Button
                  variant="success"
                  size="lg"
                  onClick={handleCheckout}
                >
                  Proceed to Checkout
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default Cart;

