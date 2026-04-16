const CATEGORIES = ['Women', 'Men', 'Accessories'];
const BRANDS = ['KRITA Essentials', 'KRITA Collection', 'KRITA Originals', 'KRITA Premium'];

const generateProducts = () => {
  const products = [];
  for (let i = 1; i <= 40; i++) {
    const category = CATEGORIES[i % CATEGORIES.length];
    const brand = BRANDS[i % BRANDS.length];
    const basePrice = Math.floor(Math.random() * 8000) + 1500;
    const isSale = Math.random() > 0.7;
    const discount = isSale ? Math.floor(Math.random() * 40) + 10 : 0;
    const price = isSale ? Math.floor(basePrice * (1 - discount / 100)) : basePrice;

    products.push({
      id: i.toString(),
      name: `${category === 'Accessories' ? 'Leather' : 'Signature'} ${['Tote', 'Dress', 'Jacket', 'Blouse', 'Suit', 'Scarf', 'Watch', 'Boots'][Math.floor(Math.random() * 8)]} ${i}`,
      brand,
      category,
      price: price,
      originalPrice: basePrice,
      discount,
      rating: (Math.random() * 1.5 + 3.5).toFixed(1), // 3.5 to 5.0
      reviewCount: Math.floor(Math.random() * 250) + 5,
      images: [
        `https://picsum.photos/seed/${i * 100}/600/800`,
        `https://picsum.photos/seed/${i * 100 + 1}/600/800`,
        `https://picsum.photos/seed/${i * 100 + 2}/600/800`,
      ],
      sizes: category === 'Accessories' ? ['One Size'] : ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['#000000', '#ffffff', '#B68D6A', '#1C6E8C'],
      description: `Elevate your wardrobe with the ${brand} signature piece. Crafted with premium materials for ultimate comfort and timeless style.`,
      specs: {
        'Material': '100% Premium Cotton/Leather',
        'Care': 'Dry clean only',
        'Fit': 'True to size',
        'Origin': 'Imported'
      },
      isNew: Math.random() > 0.8,
      isSale,
      inStock: Math.random() > 0.1
    });
  }
  return products;
};

export const products = generateProducts();

export const getReviews = (productId) => {
  const reviews = [];
  for (let i = 1; i <= 5; i++) {
    reviews.push({
      id: `r${i}`,
      name: `Customer ${i}`,
      rating: Math.floor(Math.random() * 2) + 4,
      date: new Date(Date.now() - Math.random() * 10000000000).toLocaleDateString(),
      text: "Absolutely love this! The quality is amazing and fits perfectly. Highly recommend to anyone looking for premium style."
    });
  }
  return reviews;
};
