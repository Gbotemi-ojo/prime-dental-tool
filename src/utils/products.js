import novacrestImg1 from "../Images/novacrest-pic-2.jpg";
import novacrestImg2 from "../Images/novacrest-pic-3.jpg";
import novacrestImg3 from "../Images/novacrest-pic-1.jpg";
import novacrestImg4 from "../Images/novacrest-pic-4.jpg";
import { newproducts } from "./products_with_descriptions";

export const SliderData = [
  {
    id: 1,
    title: "Your One-Stop Pharmacy & Wellness Store",
    desc: "From trusted medications to everyday beverages, shop everything you need for your health and lifestyle at Novacrest Pharmacy.",
    cover: novacrestImg1,
  },
  {
    id: 2,
    title: "Quality Medicines, Always Available",
    desc: "We stock a wide range of prescription drugs, supplements, and over-the-counter treatments — all at competitive prices.",
    cover: novacrestImg2,
  },
  {
    id: 3,
    title: "Stay Refreshed, Stay Healthy",
    desc: "Explore our selection of healthy drinks, supplements, and energy boosters designed to keep you feeling your best.",
    cover: novacrestImg3,
  },
  {
    id: 4,
    title: "Everyday Essentials, All in One Place",
    desc: "Shop a unique blend of pharmaceuticals and lifestyle products — from wellness drinks to skin care — only at Novacrest.",
    cover: novacrestImg4,
  },
];


export const serviceData = [
  {
    icon: <ion-icon name="medkit-outline"></ion-icon>,
    title: "Professional Care",
    subtitle: "At novacrest ,Our licensed pharmacists provide expert guidance and ensure safe dispensing of medications.",
    bg: "#fdefe6",
  },
  {
    icon: <ion-icon name="ribbon-outline"></ion-icon>,
    title: "Quality Assurance",
    subtitle: "We guarantee original and high-quality products from reputable manufacturers only.",
    bg: "#ceebe9",
  },
  {
    icon: <ion-icon name="shield-checkmark-outline"></ion-icon>,
    title: "Trusted & Reliable",
    subtitle: "Years of trusted service backed by strong customer loyalty and community support.",
    bg: "#e2f2b2",
  },
  {
    icon: <ion-icon name="people-outline"></ion-icon>,
    title: "Customer-Centric Service",
    subtitle: "Friendly support and personalized attention to your health and wellness needs.",
    bg: "#d6e5fb",
  },
];

export const discoutProducts = [
  {
    id: "3578",
    productName: "VITABIOTICS PREGNACARE ORIGINAL",
    imgUrl: "https://healthplusnigeria.com/cdn/shop/files/Pregnacare_20Original_20Tablets_20x_2030_1aa9ce2b-4d65-4f67-b14a-41fd90f5381b.webp?v=1744728217",
    category: "supplements",
    price: 7000,
    shortDesc: "VITAMINS, MINERALS, FOLIC ACID, D3,B12, MODERATE IRON & ZINC",
    description: "VITAMINS, MINERALS, FOLIC ACID, D3,B12, MODERATE IRON & ZINC",
    reviews: [
      { rating: 4.5, text: "This is a high-quality product that meets expectations." }
    ],
    avgRating: 4.5
  },
  {
    id: "3641",
    productName: "WELLWOMAN 50+",
    imgUrl: "https://www.vitabiotics.com/cdn/shop/products/wellwoman_50_front_CTWEW030T5WL1ER.png?crop=center&height=1024&v=1681393227&width=1024",
    category: "supplements",
    price: 17500,
    shortDesc: "WELLWOMAN 50+",
    description: "WELLWOMAN 50+",
    reviews: [
      { rating: 4.5, text: "This is a high-quality product that meets expectations." }
    ],
    avgRating: 4.5
  },
  {
    id: "3570",
    productName: "VISIONACE ORIGINAL",
    imgUrl: "https://cdn.shopify.com/s/files/1/0027/7263/1621/files/visionace_original_front_CTVIS030T2WL2ER_resized.png?v=1711475818",
    category: "eye antioxidants",
    price: 15400,
    shortDesc: "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
    description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Optio nostrum accusantium iste, voluptas cumque provident!",
    reviews: [
      { rating: 4.5, text: "This is a high-quality product that meets expectations." }
    ],
    avgRating: 4.5
  },
    {
      id: "0581",
      productName: "CENTRUM SILVER ADULTS 50+ *125",
      imgUrl: "https://i-cf65.ch-static.com/content/dam/cf-consumer-healthcare/bp-wellness-centrum/en_US/sliced-images/global/products/NewLook-Centrum-Silver-Women-50plus.jpg?auto=format",
      category: "supplements",
      price: 24500,
      shortDesc: "CENTRUM SILVER ADULTS 50+ *125",
      description: "CENTRUM SILVER ADULTS 50+ *125",
      reviews: [
        { rating: 4.5, text: "This is a high-quality product that meets expectations." }
      ],
      avgRating: 4.5
    },
      {
        id: "1716",
        productName: "IMMUN-ACTIV VITAMIN C *100",
        imgUrl: "https://www.oaklifevitamins.com/cdn/shop/products/immun-activ.VitC.front_900x.png?v=1684761282",
        category: "drugs",
        price: 21000,
        shortDesc: "IMMUN-ACTIV VITAMIN C *100",
        description: "IMMUN-ACTIV VITAMIN C *100",
        reviews: [
          { rating: 4.5, text: "This is a high-quality product that meets expectations." }
        ],
        avgRating: 4.5
      },
        {
          id: "2882",
          productName: "PURITAN'S PRIDE BIOTIN",
          imgUrl: "https://megacare.ng/media/image/2_Jpp2cfn.png",
          category: "supplements",
          price: 6300,
          shortDesc: "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
          description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Optio nostrum accusantium iste, voluptas cumque provident!",
          reviews: [
            { rating: 4.5, text: "This is a high-quality product that meets expectations." }
          ],
          avgRating: 4.5
        },
]

export const products = newproducts;
