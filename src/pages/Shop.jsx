import { Col, Container, Row } from "react-bootstrap";
import FilterSelect from "../components/FilterSelect";
import SearchBar from "../components/SeachBar/SearchBar";
import { Fragment, useState, useEffect } from "react"; // Import useEffect
import { products } from "../utils/products";
import ShopList from "../components/ShopList";
import Banner from "../components/Banner/Banner";
import useWindowScrollToTop from "../hooks/useWindowScrollToTop";

const Shop = () => {
  // Initialize with antimalarial as before
  const [filterList, setFilterList] = useState(
    products.filter((item) => item.category === "antimalarial")
  );

  // State to hold the banner title
  const [bannerTitle, setBannerTitle] = useState("Products"); // Default title

  useWindowScrollToTop();

  // Use useEffect to update the banner title when filterList changes
  useEffect(() => {
    if (filterList.length > 0) {
      // Capitalize the first letter for better presentation
      const category = filterList[0].category;
      setBannerTitle(category.charAt(0).toUpperCase() + category.slice(1));
    } else {
      setBannerTitle("Products"); // Reset to default if filterList becomes empty
    }
  }, [filterList]); // Dependency array ensures this runs when filterList changes

  return (
    <Fragment>
      {/* Use the bannerTitle state for the title prop */}
      <Banner title={bannerTitle} />
      <section className="filter-bar">
        <Container className="filter-bar-contianer">
          <Row className="justify-content-center">
            <Col md={4}>
              <FilterSelect setFilterList={setFilterList} />
            </Col>
            <Col md={8}>
              <SearchBar setFilterList={setFilterList} />
            </Col>
          </Row>
        </Container>
        <Container>
          <ShopList productItems={filterList} />
        </Container>
      </section>
    </Fragment>
  );
};

export default Shop;