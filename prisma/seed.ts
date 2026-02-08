import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data (for development)
  await prisma.review.deleteMany();
  await prisma.dishAtRestaurant.deleteMany();
  await prisma.dish.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.alertSubscription.deleteMany();

  console.log('✅ Cleaned existing data');

  // ── Global restaurant data ───────────────────────────────────────
  const allRestaurants = [
    // ── USA: West Coast ────────────────────────────────────────
    { name: 'Spice Garden Indian Bistro', address: '123 Market Street', city: 'San Francisco', state: 'CA', country: 'USA', timezone: 'America/Los_Angeles', latitude: 37.7749, longitude: -122.4194 },
    { name: 'Thai Basil Kitchen', address: '456 Valencia Street', city: 'San Francisco', state: 'CA', country: 'USA', timezone: 'America/Los_Angeles', latitude: 37.7633, longitude: -122.4213 },
    { name: 'Sakura Sushi', address: '789 Geary Boulevard', city: 'San Francisco', state: 'CA', country: 'USA', timezone: 'America/Los_Angeles', latitude: 37.7862, longitude: -122.4135 },
    { name: 'La Taqueria', address: '2889 Mission Street', city: 'San Francisco', state: 'CA', country: 'USA', timezone: 'America/Los_Angeles', latitude: 37.7509, longitude: -122.4181 },
    { name: 'In-N-Out Burger Fishermans Wharf', address: '333 Jefferson Street', city: 'San Francisco', state: 'CA', country: 'USA', timezone: 'America/Los_Angeles', latitude: 37.8080, longitude: -122.4177 },
    { name: 'Bestia', address: '2121 E 7th Place', city: 'Los Angeles', state: 'CA', country: 'USA', timezone: 'America/Los_Angeles', latitude: 34.0339, longitude: -118.2316 },
    { name: 'Guisados Tacos', address: '2100 E Cesar E Chavez Ave', city: 'Los Angeles', state: 'CA', country: 'USA', timezone: 'America/Los_Angeles', latitude: 34.0487, longitude: -118.2107 },
    { name: 'Howlin Rays Hot Chicken', address: '727 N Broadway', city: 'Los Angeles', state: 'CA', country: 'USA', timezone: 'America/Los_Angeles', latitude: 34.0618, longitude: -118.2401 },
    { name: 'Nobu Malibu', address: '22706 Pacific Coast Hwy', city: 'Malibu', state: 'CA', country: 'USA', timezone: 'America/Los_Angeles', latitude: 34.0364, longitude: -118.6801 },
    { name: 'Pike Place Chowder', address: '1530 Post Alley', city: 'Seattle', state: 'WA', country: 'USA', timezone: 'America/Los_Angeles', latitude: 47.6097, longitude: -122.3425 },
    { name: 'Din Tai Fung University Village', address: '2621 NE 46th Street', city: 'Seattle', state: 'WA', country: 'USA', timezone: 'America/Los_Angeles', latitude: 47.6619, longitude: -122.2981 },
    { name: 'Pok Pok', address: '3226 SE Division Street', city: 'Portland', state: 'OR', country: 'USA', timezone: 'America/Los_Angeles', latitude: 45.5046, longitude: -122.6318 },
    { name: 'Pine State Biscuits', address: '2204 NE Alberta Street', city: 'Portland', state: 'OR', country: 'USA', timezone: 'America/Los_Angeles', latitude: 45.5589, longitude: -122.6437 },
    { name: 'Tacos El Gordo', address: '3049 S Las Vegas Blvd', city: 'Las Vegas', state: 'NV', country: 'USA', timezone: 'America/Los_Angeles', latitude: 36.1271, longitude: -115.1688 },

    // ── USA: Mountain & Central ────────────────────────────────
    { name: 'Snooze an AM Eatery', address: '2262 Larimer Street', city: 'Denver', state: 'CO', country: 'USA', timezone: 'America/Denver', latitude: 39.7584, longitude: -104.9878 },
    { name: 'Biker Jims Gourmet Dogs', address: '2148 Larimer Street', city: 'Denver', state: 'CO', country: 'USA', timezone: 'America/Denver', latitude: 39.7546, longitude: -104.9888 },
    { name: 'Franklin Barbecue', address: '900 E 11th Street', city: 'Austin', state: 'TX', country: 'USA', timezone: 'America/Chicago', latitude: 30.2701, longitude: -97.7312 },
    { name: 'Torchys Tacos', address: '1311 S 1st Street', city: 'Austin', state: 'TX', country: 'USA', timezone: 'America/Chicago', latitude: 30.2527, longitude: -97.7529 },
    { name: 'Pecan Lodge', address: '2702 Main Street', city: 'Dallas', state: 'TX', country: 'USA', timezone: 'America/Chicago', latitude: 32.7833, longitude: -96.7847 },
    { name: 'Killen\'s BBQ', address: '3613 E Broadway Street', city: 'Pearland', state: 'TX', country: 'USA', timezone: 'America/Chicago', latitude: 29.5635, longitude: -95.2738 },
    { name: 'Portillos Hot Dogs', address: '100 W Ontario Street', city: 'Chicago', state: 'IL', country: 'USA', timezone: 'America/Chicago', latitude: 41.8935, longitude: -87.6317 },
    { name: 'Lou Malnatis Pizzeria', address: '439 N Wells Street', city: 'Chicago', state: 'IL', country: 'USA', timezone: 'America/Chicago', latitude: 41.8907, longitude: -87.6340 },
    { name: 'Alinea', address: '1723 N Halsted Street', city: 'Chicago', state: 'IL', country: 'USA', timezone: 'America/Chicago', latitude: 41.9134, longitude: -87.6485 },
    { name: 'Smoque BBQ', address: '3800 N Pulaski Road', city: 'Chicago', state: 'IL', country: 'USA', timezone: 'America/Chicago', latitude: 41.9497, longitude: -87.7276 },

    // ── USA: East Coast ──────────────────────────────────────
    { name: 'Katzs Delicatessen', address: '205 E Houston Street', city: 'New York', state: 'NY', country: 'USA', timezone: 'America/New_York', latitude: 40.7223, longitude: -73.9874 },
    { name: 'Peter Luger Steak House', address: '178 Broadway', city: 'Brooklyn', state: 'NY', country: 'USA', timezone: 'America/New_York', latitude: 40.7098, longitude: -73.9624 },
    { name: 'Joes Pizza', address: '7 Carmine Street', city: 'New York', state: 'NY', country: 'USA', timezone: 'America/New_York', latitude: 40.7306, longitude: -74.0022 },
    { name: 'Le Bernardin', address: '155 W 51st Street', city: 'New York', state: 'NY', country: 'USA', timezone: 'America/New_York', latitude: 40.7616, longitude: -73.9817 },
    { name: 'Xi\'an Famous Foods', address: '45 Bayard Street', city: 'New York', state: 'NY', country: 'USA', timezone: 'America/New_York', latitude: 40.7154, longitude: -73.9989 },
    { name: 'Neptune Oyster', address: '63 Salem Street', city: 'Boston', state: 'MA', country: 'USA', timezone: 'America/New_York', latitude: 42.3636, longitude: -71.0554 },
    { name: 'Mikes Pastry', address: '300 Hanover Street', city: 'Boston', state: 'MA', country: 'USA', timezone: 'America/New_York', latitude: 42.3639, longitude: -71.0532 },
    { name: 'Pats King of Steaks', address: '1237 E Passyunk Ave', city: 'Philadelphia', state: 'PA', country: 'USA', timezone: 'America/New_York', latitude: 39.9334, longitude: -75.1590 },
    { name: 'Reading Terminal Market', address: '1136 Arch Street', city: 'Philadelphia', state: 'PA', country: 'USA', timezone: 'America/New_York', latitude: 39.9534, longitude: -75.1590 },
    { name: 'Bens Chili Bowl', address: '1213 U Street NW', city: 'Washington', state: 'DC', country: 'USA', timezone: 'America/New_York', latitude: 38.9170, longitude: -77.0289 },

    // ── USA: South ───────────────────────────────────────────
    { name: 'Joes Stone Crab', address: '11 Washington Ave', city: 'Miami Beach', state: 'FL', country: 'USA', timezone: 'America/New_York', latitude: 25.7685, longitude: -80.1358 },
    { name: 'Versailles Restaurant', address: '3555 SW 8th Street', city: 'Miami', state: 'FL', country: 'USA', timezone: 'America/New_York', latitude: 25.7658, longitude: -80.2458 },
    { name: 'Commander\'s Palace', address: '1403 Washington Ave', city: 'New Orleans', state: 'LA', country: 'USA', timezone: 'America/Chicago', latitude: 29.9290, longitude: -90.0861 },
    { name: 'Cafe Du Monde', address: '800 Decatur Street', city: 'New Orleans', state: 'LA', country: 'USA', timezone: 'America/Chicago', latitude: 29.9573, longitude: -90.0618 },
    { name: 'Fox Bros Bar-B-Q', address: '1238 DeKalb Ave NE', city: 'Atlanta', state: 'GA', country: 'USA', timezone: 'America/New_York', latitude: 33.7548, longitude: -84.3488 },
    { name: 'Husk Restaurant', address: '76 Queen Street', city: 'Charleston', state: 'SC', country: 'USA', timezone: 'America/New_York', latitude: 32.7775, longitude: -79.9316 },
    { name: 'Prince\'s Hot Chicken Shack', address: '123 Ewing Drive', city: 'Nashville', state: 'TN', country: 'USA', timezone: 'America/Chicago', latitude: 36.1762, longitude: -86.7194 },

    // ── USA: Hawaii ──────────────────────────────────────────
    { name: 'Helena\'s Hawaiian Food', address: '1240 N School Street', city: 'Honolulu', state: 'HI', country: 'USA', timezone: 'Pacific/Honolulu', latitude: 21.3340, longitude: -157.8671 },

    // ── CANADA ───────────────────────────────────────────────
    { name: 'Schwartz\'s Deli', address: '3895 St Laurent Blvd', city: 'Montreal', state: 'QC', country: 'Canada', timezone: 'America/Montreal', latitude: 45.5169, longitude: -73.5779 },
    { name: 'Canoe Restaurant', address: '66 Wellington Street W', city: 'Toronto', state: 'ON', country: 'Canada', timezone: 'America/Toronto', latitude: 43.6485, longitude: -79.3812 },
    { name: 'Vijs Restaurant', address: '3106 Cambie Street', city: 'Vancouver', state: 'BC', country: 'Canada', timezone: 'America/Vancouver', latitude: 49.2612, longitude: -123.1149 },

    // ── MEXICO ───────────────────────────────────────────────
    { name: 'Pujol', address: 'Tennyson 133', city: 'Mexico City', state: null, country: 'Mexico', timezone: 'America/Mexico_City', latitude: 19.4321, longitude: -99.1937 },
    { name: 'El Califa de Leon', address: 'Calle de San Antonio Abad 27', city: 'Mexico City', state: null, country: 'Mexico', timezone: 'America/Mexico_City', latitude: 19.4195, longitude: -99.1383 },

    // ── EUROPE ───────────────────────────────────────────────
    { name: 'Dishoom Kings Cross', address: '5 Stable Street', city: 'London', state: null, country: 'UK', timezone: 'Europe/London', latitude: 51.5355, longitude: -0.1246 },
    { name: 'Sketch Gallery', address: '9 Conduit Street', city: 'London', state: null, country: 'UK', timezone: 'Europe/London', latitude: 51.5123, longitude: -0.1410 },
    { name: 'Borough Market Kitchen', address: '8 Southwark Street', city: 'London', state: null, country: 'UK', timezone: 'Europe/London', latitude: 51.5055, longitude: -0.0910 },
    { name: 'Le Comptoir du Pantheon', address: '5 Rue Soufflot', city: 'Paris', state: null, country: 'France', timezone: 'Europe/Paris', latitude: 48.8462, longitude: 2.3444 },
    { name: 'LAmbroisie', address: '9 Place des Vosges', city: 'Paris', state: null, country: 'France', timezone: 'Europe/Paris', latitude: 48.8553, longitude: 2.3656 },
    { name: 'Pizzeria Da Michele', address: 'Via Cesare Sersale 1', city: 'Naples', state: null, country: 'Italy', timezone: 'Europe/Rome', latitude: 40.8497, longitude: 14.2628 },
    { name: 'Osteria Francescana', address: 'Via Stella 22', city: 'Modena', state: null, country: 'Italy', timezone: 'Europe/Rome', latitude: 44.6464, longitude: 10.9254 },
    { name: 'Cerveceria Catalana', address: 'Carrer de Mallorca 236', city: 'Barcelona', state: null, country: 'Spain', timezone: 'Europe/Madrid', latitude: 41.3937, longitude: 2.1616 },
    { name: 'Sobrino de Botin', address: 'Calle Cuchilleros 17', city: 'Madrid', state: null, country: 'Spain', timezone: 'Europe/Madrid', latitude: 40.4135, longitude: -3.7085 },
    { name: 'Borchardt', address: 'Franzosische Strasse 47', city: 'Berlin', state: null, country: 'Germany', timezone: 'Europe/Berlin', latitude: 52.5144, longitude: 13.3917 },

    // ── ASIA ─────────────────────────────────────────────────
    { name: 'Sukiyabashi Jiro Roppongi', address: '6-12-2 Roppongi', city: 'Tokyo', state: null, country: 'Japan', timezone: 'Asia/Tokyo', latitude: 35.6627, longitude: 139.7313 },
    { name: 'Ichiran Shibuya', address: '1-22-7 Jinnan', city: 'Tokyo', state: null, country: 'Japan', timezone: 'Asia/Tokyo', latitude: 35.6619, longitude: 139.6980 },
    { name: 'Tsuta Ramen', address: '1 Chome-14-1 Sugamo', city: 'Tokyo', state: null, country: 'Japan', timezone: 'Asia/Tokyo', latitude: 35.7334, longitude: 139.7393 },
    { name: 'Tim Ho Wan Sham Shui Po', address: '9-11 Fuk Wing Street', city: 'Hong Kong', state: null, country: 'Hong Kong', timezone: 'Asia/Hong_Kong', latitude: 22.3312, longitude: 114.1614 },
    { name: 'Gaggan Anand', address: '68/1 Soi Langsuan', city: 'Bangkok', state: null, country: 'Thailand', timezone: 'Asia/Bangkok', latitude: 13.7378, longitude: 100.5415 },
    { name: 'Jay Fai Street Food', address: '327 Maha Chai Road', city: 'Bangkok', state: null, country: 'Thailand', timezone: 'Asia/Bangkok', latitude: 13.7528, longitude: 100.5039 },
    { name: 'Karim\'s Jama Masjid', address: '16 Gali Kababian', city: 'Delhi', state: null, country: 'India', timezone: 'Asia/Kolkata', latitude: 28.6505, longitude: 77.2334 },
    { name: 'Bukhara ITC Maurya', address: 'Sardar Patel Marg', city: 'New Delhi', state: null, country: 'India', timezone: 'Asia/Kolkata', latitude: 28.5965, longitude: 77.1730 },
    { name: 'Trishna', address: '7 Sai Baba Marg', city: 'Mumbai', state: null, country: 'India', timezone: 'Asia/Kolkata', latitude: 18.9307, longitude: 72.8329 },
    { name: 'Paradise Biryani', address: 'MG Road', city: 'Hyderabad', state: null, country: 'India', timezone: 'Asia/Kolkata', latitude: 17.3950, longitude: 78.4867 },
    { name: 'Jumbo Seafood East Coast', address: '1206 East Coast Parkway', city: 'Singapore', state: null, country: 'Singapore', timezone: 'Asia/Singapore', latitude: 1.3049, longitude: 103.9313 },
    { name: 'Lau Pa Sat Hawker Centre', address: '18 Raffles Quay', city: 'Singapore', state: null, country: 'Singapore', timezone: 'Asia/Singapore', latitude: 1.2805, longitude: 103.8504 },
    { name: 'Al Nafoorah', address: 'Jumeirah Emirates Towers', city: 'Dubai', state: null, country: 'UAE', timezone: 'Asia/Dubai', latitude: 25.2175, longitude: 55.2809 },

    // ── SOUTH AMERICA ────────────────────────────────────────
    { name: 'Don Julio Parrilla', address: 'Guatemala 4691', city: 'Buenos Aires', state: null, country: 'Argentina', timezone: 'America/Argentina/Buenos_Aires', latitude: -34.5852, longitude: -58.4258 },
    { name: 'Maní Restaurante', address: 'Rua Joaquim Antunes 210', city: 'São Paulo', state: null, country: 'Brazil', timezone: 'America/Sao_Paulo', latitude: -23.5672, longitude: -46.6848 },
    { name: 'Central Restaurante', address: 'Calle Santa Isabel 376', city: 'Lima', state: null, country: 'Peru', timezone: 'America/Lima', latitude: -12.1527, longitude: -77.0228 },

    // ── OCEANIA ──────────────────────────────────────────────
    { name: 'Quay Restaurant', address: 'Upper Level Overseas Passenger Terminal', city: 'Sydney', state: 'NSW', country: 'Australia', timezone: 'Australia/Sydney', latitude: -33.8568, longitude: 151.2101 },
    { name: 'Chin Chin Melbourne', address: '125 Flinders Lane', city: 'Melbourne', state: 'VIC', country: 'Australia', timezone: 'Australia/Melbourne', latitude: -37.8162, longitude: 144.9685 },

    // ── AFRICA ───────────────────────────────────────────────
    { name: 'The Test Kitchen', address: '375 Albert Road', city: 'Cape Town', state: null, country: 'South Africa', timezone: 'Africa/Johannesburg', latitude: -33.9321, longitude: 18.4648 },
    { name: 'Carnivore Restaurant', address: 'Langata Road', city: 'Nairobi', state: null, country: 'Kenya', timezone: 'Africa/Nairobi', latitude: -1.3377, longitude: 36.7550 },
  ];

  // Insert first restaurant separately so we can reference it for dishes/reviews
  const restaurant = await prisma.restaurant.create({
    data: allRestaurants[0],
  });
  console.log(`✅ Created primary restaurant: ${restaurant.name}`);

  // Insert remaining restaurants
  for (const r of allRestaurants.slice(1)) {
    await prisma.restaurant.create({ data: r });
  }
  console.log(`✅ Created ${allRestaurants.length} restaurants across USA + worldwide`);

  // Create Dish
  const dish = await prisma.dish.create({
    data: {
      name: 'Chicken Biryani',
      cuisine: 'Indian',
      description: 'Aromatic basmati rice layered with spiced chicken, saffron, and caramelized onions',
    },
  });

  console.log(`✅ Created dish: ${dish.name}`);

  // Create DishAtRestaurant
  const dishAtRestaurant = await prisma.dishAtRestaurant.create({
    data: {
      restaurantId: restaurant.id,
      dishId: dish.id,
      price: 16.99,
      isActive: true,
    },
  });

  console.log(`✅ Created DishAtRestaurant: ${dish.name} at ${restaurant.name}`);

  // Create Reviews with varying timestamps
  const now = new Date();
  
  // Reviews within last 5 days (will be shown in default view)
  const recentReviews = [
    {
      rating: 5,
      text: 'Absolutely incredible! The biryani was perfectly spiced and the chicken was so tender. Best I\'ve had in the Bay Area.',
      hoursAgo: 3,
    },
    {
      rating: 4,
      text: 'Really good biryani. The rice was fluffy and aromatic. Just wish the portion was slightly bigger for the price.',
      hoursAgo: 18,
    },
    {
      rating: 5,
      text: 'Outstanding! They clearly use fresh ingredients and the saffron adds such a nice touch. Will definitely order again.',
      hoursAgo: 26,
    },
    {
      rating: 3,
      text: 'Decent but not amazing. The spice level was good but the chicken was a bit dry today. Maybe just an off day?',
      hoursAgo: 48,
    },
    {
      rating: 4,
      text: 'Solid biryani. Good flavor profile and generous with the chicken pieces. Takes a while to prepare but worth the wait.',
      hoursAgo: 72,
    },
    {
      rating: 5,
      text: 'This is the real deal! Reminds me of authentic Hyderabadi biryani. The caramelized onions on top are perfection.',
      hoursAgo: 96,
    },
    {
      rating: 4,
      text: 'Very flavorful and well-cooked. The rice wasn\'t mushy at all. Only complaint is it could use a bit more heat.',
      hoursAgo: 110,
    },
  ];

  // Reviews older than 5 days (will be filtered out in default view - proves freshness logic)
  const oldReviews = [
    {
      rating: 2,
      text: 'Not great. The rice was overcooked and clumpy. Chicken lacked flavor.',
      daysAgo: 7,
    },
    {
      rating: 1,
      text: 'Terrible experience. Found a hair in my food. Never ordering again.',
      daysAgo: 10,
    },
    {
      rating: 2,
      text: 'Very disappointing. The biryani was lukewarm and tasted stale.',
      daysAgo: 15,
    },
    {
      rating: 3,
      text: 'It was okay. Nothing special but not bad either.',
      daysAgo: 20,
    },
  ];

  // Insert recent reviews
  for (const review of recentReviews) {
    const createdAt = new Date(now.getTime() - review.hoursAgo * 60 * 60 * 1000);
    await prisma.review.create({
      data: {
        dishAtRestaurantId: dishAtRestaurant.id,
        rating: review.rating,
        text: review.text,
        createdAt,
      },
    });
  }

  console.log(`✅ Created ${recentReviews.length} recent reviews (within last 5 days)`);

  // Insert old reviews
  for (const review of oldReviews) {
    const createdAt = new Date(now.getTime() - review.daysAgo * 24 * 60 * 60 * 1000);
    await prisma.review.create({
      data: {
        dishAtRestaurantId: dishAtRestaurant.id,
        rating: review.rating,
        text: review.text,
        createdAt,
      },
    });
  }

  console.log(`✅ Created ${oldReviews.length} old reviews (older than 5 days)`);

  // Create a stub alert subscription
  await prisma.alertSubscription.create({
    data: {
      dishAtRestaurantId: dishAtRestaurant.id,
      email: 'demo@freshbite.com',
      window: '24h',
      minRating: 3.5,
      isActive: true,
    },
  });

  console.log('✅ Created stub alert subscription');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\nTest the freshness logic:');
  console.log(`- DishAtRestaurant ID: ${dishAtRestaurant.id}`);
  console.log(`- Total reviews: ${recentReviews.length + oldReviews.length}`);
  console.log(`- Recent reviews (last 5d): ${recentReviews.length}`);
  console.log(`- Old reviews (>5d): ${oldReviews.length}`);
  console.log('\nExpected behavior: UI should show ONLY the 7 recent reviews by default');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
