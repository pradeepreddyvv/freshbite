import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/* ── Types ── */
interface SeedRestaurant {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  timezone: string;
  latitude: number;
  longitude: number;
  dishes: SeedDish[];
}

interface SeedDish {
  name: string;
  cuisine: string;
  description: string;
  price: number;
  reviews: { rating: number; text: string; hoursAgo: number }[];
}

/* ══════════════════════════════════════
   ── RESTAURANT DATA ─────────────────
   Tempe AZ · Seattle WA · California
   ══════════════════════════════════════ */

const restaurants: SeedRestaurant[] = [
  // ── TEMPE, AZ ─────────────────────
  {
    name: 'Curry Corner', address: '825 S Rural Rd', city: 'Tempe', state: 'AZ', country: 'USA', timezone: 'America/Phoenix', latitude: 33.4148, longitude: -111.9268,
    dishes: [
      { name: 'Butter Chicken', cuisine: 'Indian', description: 'Creamy tomato-based curry with tender chicken, served with basmati rice', price: 14.99, reviews: [
        { rating: 5, text: 'The butter chicken here is incredibly rich and flavorful. Perfect balance of tomato and cream with just the right spice. Chicken pieces are generous and tender.', hoursAgo: 4 },
        { rating: 4, text: 'Really solid butter chicken. Creamy sauce with great depth of flavor. The naan on the side was fresh and pillowy.', hoursAgo: 22 },
        { rating: 5, text: 'Best Indian food near ASU campus hands down. The butter chicken reminds me of home cooking. Perfectly spiced.', hoursAgo: 48 },
        { rating: 4, text: 'Consistently good butter chicken every time I visit. Great lunch deal too. The gravy is thick and aromatic.', hoursAgo: 72 },
      ] },
      { name: 'Chicken Tikka Masala', cuisine: 'Indian', description: 'Char-grilled chicken in a spiced creamy masala sauce', price: 15.99, reviews: [
        { rating: 5, text: 'The tikka masala is phenomenal. You can taste the charcoal from the tandoor on the chicken. The masala sauce is rich and layered.', hoursAgo: 8 },
        { rating: 4, text: 'Delicious tikka masala with perfectly cooked chicken. The sauce has a nice smoky undertone. Great with their garlic naan.', hoursAgo: 36 },
        { rating: 5, text: 'This is my go-to order every time. Juicy, well-marinated chicken with slight heat in the sauce.', hoursAgo: 96 },
      ] },
      { name: 'Garlic Naan', cuisine: 'Indian', description: 'Soft tandoor-baked flatbread topped with garlic butter and cilantro', price: 3.99, reviews: [
        { rating: 5, text: 'Perfect garlic naan — soft, buttery, and loaded with fresh garlic. Comes out hot from the tandoor every time.', hoursAgo: 6 },
        { rating: 5, text: 'The best naan in Tempe. Fluffy inside with a slight char on the outside. The garlic butter is generous.', hoursAgo: 30 },
        { rating: 4, text: 'Really good naan bread. Fresh and warm with plenty of garlic. Great for scooping up curry.', hoursAgo: 60 },
      ] },
    ],
  },
  {
    name: 'Four Peaks Brewing Company', address: '1340 E 8th St', city: 'Tempe', state: 'AZ', country: 'USA', timezone: 'America/Phoenix', latitude: 33.4194, longitude: -111.9178,
    dishes: [
      { name: 'Kilt Lifter Burger', cuisine: 'American', description: 'Half-pound Angus beef burger with Scottish ale cheese sauce, bacon, and crispy onion rings', price: 16.99, reviews: [
        { rating: 5, text: 'The Kilt Lifter burger is legendary. Juicy patty with that signature ale cheese sauce. The onion rings on top add amazing crunch.', hoursAgo: 5 },
        { rating: 4, text: 'Great burger with a unique beer cheese sauce. Thick and flavorful patty. A Tempe classic.', hoursAgo: 28 },
        { rating: 5, text: 'Been coming here for years and this burger never disappoints. Pair it with a Kilt Lifter beer.', hoursAgo: 72 },
      ] },
      { name: 'Fish Tacos', cuisine: 'American', description: 'Beer-battered fish tacos with chipotle lime crema and mango salsa', price: 14.99, reviews: [
        { rating: 4, text: 'Light and crispy fish tacos with a great chipotle kick. The mango salsa is fresh and sweet. Perfect brewery food.', hoursAgo: 12 },
        { rating: 5, text: 'Outstanding fish tacos. Perfectly fried fish, crunchy slaw, and that crema ties it all together.', hoursAgo: 50 },
        { rating: 4, text: 'Really enjoyable fish tacos. The beer batter is light and crispy, not heavy at all.', hoursAgo: 80 },
      ] },
      { name: 'Brewers Fries', cuisine: 'American', description: 'Hand-cut fries with ale cheese sauce, bacon bits, and green onions', price: 10.99, reviews: [
        { rating: 5, text: 'These loaded fries are addictive. Crispy hand-cut fries smothered in beer cheese sauce with real bacon. Perfect shareable appetizer.', hoursAgo: 10 },
        { rating: 4, text: 'Great fries with generous toppings. The ale cheese sauce is unique and delicious.', hoursAgo: 40 },
        { rating: 5, text: 'Best fries in the valley. The cheese sauce is made with their own beer. Always hot and perfectly seasoned.', hoursAgo: 90 },
      ] },
    ],
  },
  {
    name: 'Oreganos Pizza Bistro', address: '130 E University Dr', city: 'Tempe', state: 'AZ', country: 'USA', timezone: 'America/Phoenix', latitude: 33.4214, longitude: -111.9382,
    dishes: [
      { name: 'The Pizza Cookie', cuisine: 'Dessert', description: 'Giant chocolate chip cookie baked in a pizza pan, served warm with vanilla ice cream', price: 9.99, reviews: [
        { rating: 5, text: 'The pizza cookie is an absolute must-order. Warm gooey chocolate chip cookie the size of a pizza topped with ice cream. Pure heaven.', hoursAgo: 3 },
        { rating: 5, text: 'If you go to Oreganos and dont get the pizza cookie, you did it wrong. Warm, melty perfection.', hoursAgo: 24 },
        { rating: 5, text: 'Iconic Tempe dessert. Crispy edges and soft gooey center. We get one every single visit.', hoursAgo: 55 },
      ] },
      { name: 'Margherita Pizza', cuisine: 'Italian', description: 'Thin-crust pizza with San Marzano tomatoes, fresh mozzarella, and basil', price: 13.99, reviews: [
        { rating: 4, text: 'Great classic Margherita. Thin crispy crust, quality mozzarella, and fresh basil. Simple but done right.', hoursAgo: 14 },
        { rating: 5, text: 'Love their Margherita pizza. Nice char on the crust and the sauce tastes like real tomatoes.', hoursAgo: 48 },
        { rating: 4, text: 'Solid Margherita with quality ingredients. Thin crust that isnt soggy in the middle.', hoursAgo: 85 },
      ] },
      { name: 'Pasta al Forno', cuisine: 'Italian', description: 'Baked pasta with Italian sausage, peppers, ricotta, and marinara', price: 15.99, reviews: [
        { rating: 4, text: 'Hearty baked pasta with generous sausage pieces. The ricotta makes it creamy and the marinara has great depth.', hoursAgo: 18 },
        { rating: 5, text: 'Comfort food at its finest. The baked cheese on top is perfectly golden and the sausage is flavorful.', hoursAgo: 70 },
      ] },
    ],
  },
  {
    name: 'Ghost Ranch', address: '1006 E Warner Rd', city: 'Tempe', state: 'AZ', country: 'USA', timezone: 'America/Phoenix', latitude: 33.3348, longitude: -111.9279,
    dishes: [
      { name: 'Green Chile Burger', cuisine: 'Southwestern', description: 'Angus burger with roasted Hatch green chiles, pepper jack cheese, and chipotle aioli', price: 17.99, reviews: [
        { rating: 5, text: 'This green chile burger is incredible. The roasted Hatch chiles give amazing flavor and just the right heat. Pepper jack melts perfectly.', hoursAgo: 7 },
        { rating: 4, text: 'Really flavorful burger with authentic Southwestern taste. The chipotle aioli complements the chiles perfectly.', hoursAgo: 32 },
        { rating: 5, text: 'Best burger in Tempe. The Hatch green chiles are roasted fresh and you can taste the difference.', hoursAgo: 78 },
      ] },
      { name: 'Breakfast Burrito', cuisine: 'Southwestern', description: 'Scrambled eggs, chorizo, potatoes, cheese, and green chile sauce', price: 13.99, reviews: [
        { rating: 5, text: 'Massive breakfast burrito packed with flavor. The chorizo is spicy and the green chile sauce is authentic New Mexico style.', hoursAgo: 15 },
        { rating: 4, text: 'Solid breakfast burrito with good filling. The green chile sauce gives it a nice kick.', hoursAgo: 40 },
        { rating: 5, text: 'Absolutely stuffed burrito. Perfectly seasoned chorizo and eggs with melty cheese.', hoursAgo: 95 },
      ] },
      { name: 'Southwest Mac and Cheese', cuisine: 'Southwestern', description: 'Creamy mac and cheese with green chiles, roasted corn, and crispy tortilla strips', price: 12.99, reviews: [
        { rating: 4, text: 'Creative twist on mac and cheese. The green chiles and corn add great Southwestern flavor.', hoursAgo: 20 },
        { rating: 5, text: 'Love this Southwest mac. The crispy tortilla strips on top add perfect texture contrast.', hoursAgo: 55 },
      ] },
    ],
  },
  {
    name: 'Pedal Haus Brewery', address: '730 S Mill Ave', city: 'Tempe', state: 'AZ', country: 'USA', timezone: 'America/Phoenix', latitude: 33.4252, longitude: -111.9408,
    dishes: [
      { name: 'Bavarian Pretzel Bites', cuisine: 'American', description: 'Warm pretzel bites with beer cheese dip and whole grain mustard', price: 11.99, reviews: [
        { rating: 5, text: 'Perfect pretzel bites — golden, warm, and slightly salty. The beer cheese dip is incredible.', hoursAgo: 9 },
        { rating: 4, text: 'Great shareable appetizer. Soft inside with a nice crust. Both dipping sauces are excellent.', hoursAgo: 35 },
        { rating: 5, text: 'Best pretzel bites on Mill Ave. Always fresh and the cheese dip is addictive.', hoursAgo: 65 },
      ] },
      { name: 'Nashville Hot Chicken Sandwich', cuisine: 'American', description: 'Crispy fried chicken with Nashville hot seasoning, pickles, and coleslaw on brioche', price: 15.99, reviews: [
        { rating: 5, text: 'This hot chicken sandwich brings serious heat and flavor. Perfect crunch and the pickles cut through the spice.', hoursAgo: 11 },
        { rating: 4, text: 'Really good Nashville hot chicken. Crispy coating with legit spice level. Coleslaw provides nice contrast.', hoursAgo: 48 },
      ] },
      { name: 'Smoked Brisket Mac', cuisine: 'American', description: 'Creamy mac and cheese topped with 12-hour smoked brisket and BBQ drizzle', price: 16.99, reviews: [
        { rating: 5, text: 'The smoked brisket mac is incredible. Tender, smoky brisket over creamy mac and cheese. Absolute comfort food.', hoursAgo: 16 },
        { rating: 5, text: 'Best mac and cheese dish Ive had. Brisket is melt-in-your-mouth and the cheese sauce is rich.', hoursAgo: 55 },
      ] },
    ],
  },

  // ── SEATTLE, WA ───────────────────
  {
    name: 'Pike Place Chowder', address: '1530 Post Alley', city: 'Seattle', state: 'WA', country: 'USA', timezone: 'America/Los_Angeles', latitude: 47.6097, longitude: -122.3425,
    dishes: [
      { name: 'New England Clam Chowder', cuisine: 'Seafood', description: 'Award-winning creamy clam chowder with fresh Pacific clams and potatoes', price: 12.99, reviews: [
        { rating: 5, text: 'The best clam chowder Ive ever had. Thick, creamy, loaded with tender clams. Worth every minute of the wait at Pike Place.', hoursAgo: 2 },
        { rating: 5, text: 'Award-winning for a reason. Incredibly rich and the clams are so fresh. Perfect on a rainy Seattle day.', hoursAgo: 18 },
        { rating: 4, text: 'Really excellent chowder. Creamy base with great flavor and generous clam pieces. The bread bowl is a must.', hoursAgo: 45 },
        { rating: 5, text: 'Every Seattle visit starts with this chowder. Consistently perfect. The cream is thick and seasoning spot on.', hoursAgo: 80 },
      ] },
      { name: 'Smoked Salmon Chowder', cuisine: 'Seafood', description: 'Creamy chowder with house-smoked wild salmon, corn, and fresh dill', price: 13.99, reviews: [
        { rating: 5, text: 'Unique and delicious. The smoked salmon adds incredible depth. The dill gives it a nice freshness.', hoursAgo: 8 },
        { rating: 4, text: 'Interesting twist on chowder. The smoked salmon flavor is prominent and the corn adds sweetness.', hoursAgo: 36 },
        { rating: 5, text: 'This is what Pacific Northwest seafood is all about. Rich smoky salmon flavor in every spoonful.', hoursAgo: 70 },
      ] },
      { name: 'Seafood Bisque', cuisine: 'Seafood', description: 'Velvety bisque with Dungeness crab, shrimp, and a touch of sherry', price: 14.99, reviews: [
        { rating: 5, text: 'Luxurious seafood bisque. The Dungeness crab is sweet and the sherry adds elegant depth. Smooth texture.', hoursAgo: 12 },
        { rating: 4, text: 'Beautiful bisque with generous seafood. Rich and smooth with a subtle sweetness from the crab.', hoursAgo: 50 },
      ] },
    ],
  },
  {
    name: 'Din Tai Fung University Village', address: '2621 NE 46th St', city: 'Seattle', state: 'WA', country: 'USA', timezone: 'America/Los_Angeles', latitude: 47.6619, longitude: -122.2981,
    dishes: [
      { name: 'Xiao Long Bao', cuisine: 'Taiwanese', description: 'Handmade soup dumplings with pork filling and rich broth', price: 13.99, reviews: [
        { rating: 5, text: 'The soup dumplings are perfection. Paper-thin skin that holds a burst of savory pork broth. Handcrafted with precision.', hoursAgo: 3 },
        { rating: 5, text: 'Best XLB outside of Taiwan. The skin-to-filling ratio is perfect and the broth inside is rich. Always worth the wait.', hoursAgo: 24 },
        { rating: 4, text: 'Excellent soup dumplings. Delicate wrappers with generous soup inside. The ginger vinegar sauce is essential.', hoursAgo: 55 },
        { rating: 5, text: 'Consistently incredible. Every dumpling is perfectly formed with hot broth that bursts in your mouth. A Seattle essential.', hoursAgo: 90 },
      ] },
      { name: 'Shrimp and Pork Wontons', cuisine: 'Taiwanese', description: 'Delicate wontons in spicy chili oil with shrimp and pork filling', price: 11.99, reviews: [
        { rating: 5, text: 'These wontons are amazing. Silky smooth wrappers with plump shrimp and pork filling. The chili oil has great depth.', hoursAgo: 6 },
        { rating: 4, text: 'Really good wontons with a nice kick from the chili oil. Light yet satisfying.', hoursAgo: 30 },
        { rating: 5, text: 'Addictive spicy wontons. The chili oil sauce is complex, numbing, and delicious. Perfect appetizer.', hoursAgo: 65 },
      ] },
      { name: 'Pork Chop Fried Rice', cuisine: 'Taiwanese', description: 'Wok-fried rice with seasoned pork chop, egg, and vegetables', price: 14.99, reviews: [
        { rating: 4, text: 'Solid fried rice with a well-seasoned pork chop. Each grain is separate and perfectly seasoned. Good comfort food.', hoursAgo: 10 },
        { rating: 4, text: 'Nice fried rice with crispy pork chop. Not greasy at all. The vegetables add nice crunch.', hoursAgo: 40 },
        { rating: 5, text: 'Simple but executed perfectly. The wok heat gives great flavor and the pork chop is juicy.', hoursAgo: 78 },
      ] },
    ],
  },
  {
    name: 'Paseo Caribbean Restaurant', address: '4225 Fremont Ave N', city: 'Seattle', state: 'WA', country: 'USA', timezone: 'America/Los_Angeles', latitude: 47.6588, longitude: -122.3502,
    dishes: [
      { name: 'Caribbean Roast Sandwich', cuisine: 'Caribbean', description: 'Slow-roasted pork with caramelized onions, cilantro, and jalapeños on pressed baguette', price: 12.99, reviews: [
        { rating: 5, text: 'Hands down the best sandwich in Seattle. Slow-roasted pork is incredibly tender and the caramelized onions add perfect sweetness.', hoursAgo: 4 },
        { rating: 5, text: 'Legendary for a reason. Bold and complex flavors. The pressed baguette is crispy outside and soft inside. Pure magic.', hoursAgo: 25 },
        { rating: 5, text: 'Ive eaten this hundreds of times and it never gets old. The pork falls apart and the onions are jammy.', hoursAgo: 60 },
        { rating: 4, text: 'Incredible sandwich with amazing flavor. The marinade on the pork is something special. Messy but worth it.', hoursAgo: 95 },
      ] },
      { name: 'Midnight Cuban Sandwich', cuisine: 'Caribbean', description: 'Roasted pork, ham, Swiss cheese, pickles, and mustard on pressed Cuban bread', price: 13.99, reviews: [
        { rating: 5, text: 'Perfect Cuban sandwich. Roasted pork and ham with tangy pickles and melted Swiss is unbeatable. Pressed to perfection.', hoursAgo: 8 },
        { rating: 4, text: 'Really good Cuban with quality ingredients. Great crunch from the press and generous filling.', hoursAgo: 45 },
      ] },
      { name: 'Grilled Prawns', cuisine: 'Caribbean', description: 'Jumbo prawns in Caribbean spices, grilled and served with rice and beans', price: 18.99, reviews: [
        { rating: 4, text: 'Perfectly grilled prawns with bold Caribbean seasoning. Plump and juicy with nice char.', hoursAgo: 14 },
        { rating: 5, text: 'Amazing prawns. The Caribbean marinade is vibrant and the grilling gives beautiful smoky flavor.', hoursAgo: 50 },
      ] },
    ],
  },
  {
    name: 'Canlis', address: '2576 Aurora Ave N', city: 'Seattle', state: 'WA', country: 'USA', timezone: 'America/Los_Angeles', latitude: 47.6432, longitude: -122.3467,
    dishes: [
      { name: 'Canlis Salad', cuisine: 'Fine Dining', description: 'Romaine tossed tableside with bacon, mint, oregano, romano cheese, and Canlis dressing', price: 22.00, reviews: [
        { rating: 5, text: 'A Seattle institution. Tossed tableside with incredible attention to detail. The dressing is tangy and the bacon adds perfect smokiness.', hoursAgo: 6 },
        { rating: 5, text: 'Iconic salad thats been on the menu for decades. Fresh, flavorful, and the tableside preparation is wonderful.', hoursAgo: 48 },
      ] },
      { name: 'Wagyu Beef', cuisine: 'Fine Dining', description: 'A5 Japanese Wagyu beef with seasonal accompaniments', price: 85.00, reviews: [
        { rating: 5, text: 'The Wagyu is extraordinary. Melt-in-your-mouth tender with incredible marbling. Cooked to absolute perfection.', hoursAgo: 12 },
        { rating: 5, text: 'A transcendent dining experience. Best beef Ive ever eaten. The fat renders beautifully.', hoursAgo: 72 },
      ] },
      { name: 'Dungeness Crab', cuisine: 'Fine Dining', description: 'Fresh Pacific Dungeness crab with drawn butter and seasonal garnish', price: 48.00, reviews: [
        { rating: 5, text: 'Fresh Dungeness crab prepared simply and perfectly. Sweet, delicate meat with just drawn butter.', hoursAgo: 15 },
        { rating: 4, text: 'Beautiful presentation of fresh local crab. Sweet and tender. A true Seattle fine dining experience.', hoursAgo: 60 },
      ] },
    ],
  },
  {
    name: 'Biscuit Bitch', address: '1909 1st Ave', city: 'Seattle', state: 'WA', country: 'USA', timezone: 'America/Los_Angeles', latitude: 47.6114, longitude: -122.3437,
    dishes: [
      { name: 'The Hot Mess Biscuit', cuisine: 'Breakfast', description: 'Buttermilk biscuit with fried egg, sausage, cheddar, and sausage gravy', price: 11.99, reviews: [
        { rating: 5, text: 'Lives up to its name in the best way. Fluffy buttermilk biscuit smothered in creamy sausage gravy with a perfectly fried egg.', hoursAgo: 5 },
        { rating: 5, text: 'Best breakfast sandwich in Seattle. Incredibly flaky biscuit and the gravy is rich and peppery. Get there early.', hoursAgo: 28 },
        { rating: 4, text: 'Really indulgent breakfast biscuit. The combination of sausage, egg, cheese, and gravy is heavenly.', hoursAgo: 65 },
      ] },
      { name: 'Biscuits and Gravy', cuisine: 'Breakfast', description: 'Two fresh buttermilk biscuits smothered in house-made sausage gravy', price: 9.99, reviews: [
        { rating: 5, text: 'Incredibly fluffy biscuits and perfectly seasoned sausage gravy. Classic Southern comfort food done right.', hoursAgo: 8 },
        { rating: 4, text: 'Great biscuits and gravy. Fresh-baked biscuits with thick gravy and bits of sausage.', hoursAgo: 40 },
      ] },
      { name: 'Gritty Bitch', cuisine: 'Breakfast', description: 'Cheesy grits topped with pulled pork, fried egg, and hot sauce', price: 13.99, reviews: [
        { rating: 5, text: 'A flavor bomb. Creamy cheesy grits with tender pulled pork and a runny egg that mixes into everything. Incredible.', hoursAgo: 10 },
        { rating: 4, text: 'Great combination. Smooth cheesy grits, tender pork. The hot sauce ties it all together.', hoursAgo: 50 },
      ] },
    ],
  },
  {
    name: 'Serious Pie', address: '316 Virginia St', city: 'Seattle', state: 'WA', country: 'USA', timezone: 'America/Los_Angeles', latitude: 47.6132, longitude: -122.3411,
    dishes: [
      { name: 'Chanterelle Mushroom Pizza', cuisine: 'Italian', description: 'Wood-fired pizza with Pacific Northwest chanterelles, truffle oil, fontina, and thyme', price: 19.99, reviews: [
        { rating: 5, text: 'Best pizza in Seattle. The chanterelle mushrooms are earthy and buttery, truffle oil ties it all together. The crust is perfectly charred.', hoursAgo: 6 },
        { rating: 5, text: 'Tom Douglas knows pizza. Wood-fired with foraged PNW mushrooms. Each slice is artisan quality.', hoursAgo: 42 },
        { rating: 4, text: 'Really great mushroom pizza. The fontina melts beautifully and the truffle aroma is incredible.', hoursAgo: 80 },
      ] },
      { name: 'Roasted Sweet Pepper Pizza', cuisine: 'Italian', description: 'Roasted peppers with fresh mozzarella, basil, and chili flakes on wood-fired crust', price: 17.99, reviews: [
        { rating: 4, text: 'Delicious vegetarian pizza. Sweet roasted peppers with spicy chili flakes and stretchy mozzarella. Great balance.', hoursAgo: 10 },
        { rating: 5, text: 'Simple and perfect. The peppers caramelize beautifully in the wood oven. Bubbly, blistered crust.', hoursAgo: 55 },
      ] },
      { name: 'Clam Pizza', cuisine: 'Italian', description: 'Fresh Manila clams, pancetta, chili, and parsley on white pizza base', price: 21.99, reviews: [
        { rating: 5, text: 'The clam pizza is unreal. Briny, fresh clams with salty pancetta and just enough chili heat. A Seattle classic.', hoursAgo: 15 },
        { rating: 5, text: 'Better than anything I had in New Haven. The clams are plump and sweet, crust is light and smoky.', hoursAgo: 68 },
      ] },
    ],
  },
  {
    name: 'Tats Delicatessen', address: '159 Yesler Way', city: 'Seattle', state: 'WA', country: 'USA', timezone: 'America/Los_Angeles', latitude: 47.6018, longitude: -122.3339,
    dishes: [
      { name: 'Tatstrami', cuisine: 'Deli', description: 'Thick-sliced house-cured pastrami with Swiss cheese, coleslaw, and Russian dressing on rye', price: 16.99, reviews: [
        { rating: 5, text: 'The Tatstrami is incredible. Thick-cut pastrami that melts in your mouth with tangy Russian dressing and crunchy slaw. Best deli in Seattle.', hoursAgo: 4 },
        { rating: 5, text: 'If you love pastrami this is your spot. House-cured, properly peppery, piled high on fresh rye bread.', hoursAgo: 30 },
        { rating: 4, text: 'Really solid pastrami sandwich. The meat is tender and well-seasoned. Portions are very generous.', hoursAgo: 70 },
      ] },
      { name: 'Italian Grinder', cuisine: 'Deli', description: 'Salami, capicola, mortadella, provolone, hot peppers, and oil-vinegar on a hoagie roll', price: 14.99, reviews: [
        { rating: 5, text: 'Massive Italian sub with quality cured meats. The hot peppers and oil-vinegar dressing make it sing.', hoursAgo: 8 },
        { rating: 4, text: 'Solid Italian grinder. Good balance of meats and the hoagie roll is fresh. Generous portions.', hoursAgo: 45 },
      ] },
      { name: 'Matzo Ball Soup', cuisine: 'Deli', description: 'Classic chicken broth with fluffy matzo balls, carrots, and fresh dill', price: 8.99, reviews: [
        { rating: 5, text: 'Comfort in a bowl. Fluffy matzo balls in rich chicken broth with loads of fresh dill. Perfect rainy day food.', hoursAgo: 12 },
        { rating: 5, text: 'Grandma-level matzo ball soup. Light, fluffy dumplings in golden broth. Warms the soul.', hoursAgo: 60 },
      ] },
    ],
  },

  // ── BELLEVUE, WA ──────────────────
  {
    name: 'Din Tai Fung Bellevue', address: '700 Bellevue Way NE', city: 'Bellevue', state: 'WA', country: 'USA', timezone: 'America/Los_Angeles', latitude: 47.6153, longitude: -122.2006,
    dishes: [
      { name: 'Truffle Xiao Long Bao', cuisine: 'Taiwanese', description: 'Handmade soup dumplings infused with black truffle and rich pork broth', price: 17.99, reviews: [
        { rating: 5, text: 'The truffle XLB is next level. Earthy truffle aroma bursts with the soup. More refined than the classic version. A Bellevue must-try.', hoursAgo: 3 },
        { rating: 5, text: 'Worth the upgrade over regular XLB. The truffle flavor is unmistakable and the broth is rich and savory.', hoursAgo: 20 },
        { rating: 4, text: 'Excellent truffle dumplings. Delicate skin, fragrant filling. A bit pricey but a special treat.', hoursAgo: 50 },
      ] },
      { name: 'Shrimp Fried Rice', cuisine: 'Taiwanese', description: 'Wok-tossed jasmine rice with plump shrimp, egg, and scallions', price: 14.99, reviews: [
        { rating: 5, text: 'Every grain of rice is perfectly separated with beautiful wok char. Shrimp are plump and sweet. Deceptively simple but flawless.', hoursAgo: 7 },
        { rating: 4, text: 'Really clean and well-executed fried rice. Not greasy at all. The shrimp are generous and cooked perfectly.', hoursAgo: 35 },
        { rating: 5, text: 'The best fried rice on the Eastside. You can taste the wok hei in every bite. Scallions add a nice freshness.', hoursAgo: 75 },
      ] },
      { name: 'Cucumber Salad', cuisine: 'Taiwanese', description: 'Chilled smashed cucumbers in garlic chili vinaigrette', price: 7.99, reviews: [
        { rating: 5, text: 'So refreshing and addictive. Perfectly crunchy cucumbers with a garlicky, tangy, slightly spicy dressing. Great starter.', hoursAgo: 10 },
        { rating: 4, text: 'Simple but so well done. Cold, crunchy, garlicky. Perfect palate cleanser between heavier dishes.', hoursAgo: 40 },
      ] },
    ],
  },
  {
    name: 'Wild Ginger Bellevue', address: '10020 NE 8th St', city: 'Bellevue', state: 'WA', country: 'USA', timezone: 'America/Los_Angeles', latitude: 47.6182, longitude: -122.2051,
    dishes: [
      { name: 'Fragrant Duck', cuisine: 'Pan-Asian', description: 'Five-spice roasted duck with plum sauce, hoisin, and Mandarin pancakes', price: 28.99, reviews: [
        { rating: 5, text: 'The fragrant duck is spectacular. Crispy skin, tender meat, and the five-spice seasoning is aromatic and balanced. Wrap it in pancakes — divine.', hoursAgo: 5 },
        { rating: 5, text: 'An absolute showstopper. Beautifully roasted with crispy skin and juicy meat. The plum sauce is the perfect complement.', hoursAgo: 30 },
        { rating: 4, text: 'Really impressive duck dish. Rich, aromatic, and satisfying. The pancakes are thin and delicate.', hoursAgo: 65 },
      ] },
      { name: 'Seven Flavor Beef', cuisine: 'Pan-Asian', description: 'Wok-seared beef tenderloin with seven chili peppers in a sweet soy glaze', price: 24.99, reviews: [
        { rating: 5, text: 'Tender beef with a complex sweet-and-spicy glaze. Each chili adds a different layer of heat. Beautifully presented.', hoursAgo: 8 },
        { rating: 4, text: 'Flavorful and well-balanced. The beef is cooked to perfection with a nice caramelized exterior.', hoursAgo: 42 },
        { rating: 5, text: 'One of the best beef dishes on the Eastside. Bold flavors without being overwhelming.', hoursAgo: 80 },
      ] },
      { name: 'Satay Skewers', cuisine: 'Pan-Asian', description: 'Grilled chicken satay with peanut sauce, pickled cucumbers, and jasmine rice', price: 15.99, reviews: [
        { rating: 4, text: 'Juicy grilled chicken with a rich, nutty peanut sauce. The pickled cucumbers add a nice tangy contrast.', hoursAgo: 12 },
        { rating: 5, text: 'The peanut sauce is house-made and you can tell. Perfectly charred chicken with great smoky flavor.', hoursAgo: 55 },
      ] },
    ],
  },
  {
    name: 'John Howie Steak', address: '11111 NE 8th St', city: 'Bellevue', state: 'WA', country: 'USA', timezone: 'America/Los_Angeles', latitude: 47.6173, longitude: -122.1959,
    dishes: [
      { name: '28-Day Dry-Aged Ribeye', cuisine: 'Steakhouse', description: '16oz bone-in ribeye, dry-aged in-house, served with compound butter', price: 68.00, reviews: [
        { rating: 5, text: 'Absolutely the best steak on the Eastside. The 28-day dry aging creates incredible nutty, beefy depth. Perfectly charred crust with rosy center.', hoursAgo: 6 },
        { rating: 5, text: 'Worth every penny. The marbling is insane and the dry-age flavor is unmistakable. Compound butter melts over it like heaven.', hoursAgo: 38 },
        { rating: 5, text: 'This ribeye rivals the best steakhouses in NYC. Incredible aging process, impeccable sear, melt-in-your-mouth tender.', hoursAgo: 78 },
      ] },
      { name: 'Wagyu Beef Tartare', cuisine: 'Steakhouse', description: 'Hand-cut wagyu tartare with quail egg, capers, shallots, and truffle aioli', price: 28.00, reviews: [
        { rating: 5, text: 'Exquisite tartare. The wagyu is buttery and the truffle aioli adds luxury. Perfectly seasoned with just enough acidity from capers.', hoursAgo: 10 },
        { rating: 4, text: 'Elegant starter. Rich wagyu with a beautiful presentation. The quail egg adds wonderful richness.', hoursAgo: 50 },
      ] },
      { name: 'Truffle Mac and Cheese', cuisine: 'Steakhouse', description: 'Creamy four-cheese mac with black truffle and panko crust', price: 18.00, reviews: [
        { rating: 5, text: 'The most decadent mac and cheese Ive ever had. Four cheeses with real truffle and a crunchy golden panko top. Incredible side dish.', hoursAgo: 14 },
        { rating: 5, text: 'Pure indulgence. Rich, creamy, truffle-infused, with a satisfying crunch. Perfect accompaniment to any steak.', hoursAgo: 60 },
      ] },
    ],
  },
  {
    name: 'Monsoon Bellevue', address: '10245 Main St', city: 'Bellevue', state: 'WA', country: 'USA', timezone: 'America/Los_Angeles', latitude: 47.6147, longitude: -122.2035,
    dishes: [
      { name: 'Wok-Tossed Mussels', cuisine: 'Vietnamese', description: 'PNW mussels with lemongrass, Thai basil, and coconut curry broth', price: 19.99, reviews: [
        { rating: 5, text: 'The lemongrass coconut broth is phenomenal. Fresh PNW mussels swimming in aromatic curry. Use the bread to soak up every last drop.', hoursAgo: 5 },
        { rating: 5, text: 'Best mussels in Bellevue. Fragrant lemongrass and creamy coconut marry perfectly. Thai basil adds wonderful freshness.', hoursAgo: 32 },
        { rating: 4, text: 'Really aromatic and flavorful mussels. The coconut curry broth is the star. Great for sharing.', hoursAgo: 70 },
      ] },
      { name: 'Shaking Beef', cuisine: 'Vietnamese', description: 'Cubed filet mignon wok-seared with garlic, butter, and watercress salad', price: 32.99, reviews: [
        { rating: 5, text: 'Tender cubes of filet mignon with incredible wok char and garlic butter. The watercress salad with lime dressing cuts through the richness.', hoursAgo: 8 },
        { rating: 5, text: 'Classic Vietnamese dish done exceptionally well. Perfectly seared beef with caramelized edges. A must-order.', hoursAgo: 45 },
      ] },
      { name: 'Imperial Rolls', cuisine: 'Vietnamese', description: 'Crispy hand-rolled spring rolls with pork, shrimp, and glass noodles', price: 14.99, reviews: [
        { rating: 5, text: 'Shatteringly crispy shells with juicy, well-seasoned filling. The nuoc cham dipping sauce is perfectly balanced.', hoursAgo: 12 },
        { rating: 4, text: 'Excellent spring rolls. Crunchy exterior gives way to savory filling. Best paired with fresh herbs.', hoursAgo: 55 },
      ] },
    ],
  },
  {
    name: 'Fern Thai on Main', address: '10246 Main St', city: 'Bellevue', state: 'WA', country: 'USA', timezone: 'America/Los_Angeles', latitude: 47.6148, longitude: -122.2033,
    dishes: [
      { name: 'Khao Soi', cuisine: 'Thai', description: 'Northern Thai coconut curry noodle soup with crispy egg noodles and chicken', price: 16.99, reviews: [
        { rating: 5, text: 'Authentic Khao Soi that transports you to Chiang Mai. Rich coconut curry broth with both soft and crispy noodles. The chicken is fall-off-the-bone.', hoursAgo: 4 },
        { rating: 5, text: 'Best Thai food in Bellevue. The Khao Soi has layers of flavor — spicy, creamy, tangy with pickled mustard greens on the side.', hoursAgo: 26 },
        { rating: 4, text: 'Really authentic Northern Thai flavors. The crispy noodle topping adds wonderful texture contrast.', hoursAgo: 58 },
      ] },
      { name: 'Pad See Ew', cuisine: 'Thai', description: 'Wide rice noodles wok-charred with Chinese broccoli, egg, and sweet soy', price: 14.99, reviews: [
        { rating: 5, text: 'The wok char on these noodles is incredible. Smoky, slightly sweet, with perfectly tender broccoli. Comfort food at its best.', hoursAgo: 8 },
        { rating: 4, text: 'Solid pad see ew with great wok hei. Noodles are silky and the sweet soy glaze is well-balanced.', hoursAgo: 38 },
        { rating: 5, text: 'Simple dish executed brilliantly. You can taste the high heat of the wok in every bite.', hoursAgo: 72 },
      ] },
      { name: 'Mango Sticky Rice', cuisine: 'Thai', description: 'Sweet coconut sticky rice with fresh Alphonso mango and toasted sesame', price: 10.99, reviews: [
        { rating: 5, text: 'Perfectly ripe mango with warm sticky rice drenched in sweet coconut cream. The toasted sesame adds a nutty finish. Heaven.', hoursAgo: 10 },
        { rating: 5, text: 'Best mango sticky rice outside of Bangkok. The rice is perfectly chewy and the mango is always perfectly sweet.', hoursAgo: 48 },
      ] },
    ],
  },

  // ── TEMPE, AZ (additional) ────────
  {
    name: 'Postinos WineCafe Tempe', address: '615 S College Ave', city: 'Tempe', state: 'AZ', country: 'USA', timezone: 'America/Phoenix', latitude: 33.4148, longitude: -111.9393,
    dishes: [
      { name: 'Bruschetta Board', cuisine: 'Italian', description: 'Four seasonal bruschetta on artisan toast with premium toppings', price: 16.99, reviews: [
        { rating: 5, text: 'The bruschetta board is perfect for sharing. Each piece has a unique flavor profile. The ricotta with honey and fig is divine.', hoursAgo: 3 },
        { rating: 5, text: 'Best $5 Monday bruschetta deal in Tempe. Quality ingredients, fresh bread, and creative seasonal toppings.', hoursAgo: 22 },
        { rating: 4, text: 'Beautiful board with great variety. The burrata bruschetta with balsamic is my favorite. Great wine pairing options.', hoursAgo: 55 },
      ] },
      { name: 'Panini Pressed Sandwich', cuisine: 'Italian', description: 'Turkey, brie, arugula, and fig spread on pressed ciabatta', price: 14.99, reviews: [
        { rating: 4, text: 'Lovely panini with a great sweet-savory balance from the fig spread. The brie is creamy and melty.', hoursAgo: 8 },
        { rating: 5, text: 'Simple ingredients done right. Crispy pressed ciabatta with quality turkey and perfectly ripe brie. Great lunch.', hoursAgo: 40 },
      ] },
      { name: 'Charcuterie Board', cuisine: 'Italian', description: 'Curated selection of cured meats, artisan cheeses, olives, and honey', price: 22.99, reviews: [
        { rating: 5, text: 'Gorgeous presentation and excellent quality. The prosciutto is paper-thin and the cheese selection is curated perfectly.', hoursAgo: 14 },
        { rating: 5, text: 'Best charcuterie board in Tempe. Generous portions of quality meats and cheeses. Pairs beautifully with their wine list.', hoursAgo: 60 },
      ] },
    ],
  },
  {
    name: 'Tempe Pho', address: '1232 E Apache Blvd', city: 'Tempe', state: 'AZ', country: 'USA', timezone: 'America/Phoenix', latitude: 33.4145, longitude: -111.9228,
    dishes: [
      { name: 'Pho Dac Biet', cuisine: 'Vietnamese', description: 'House special pho with rare beef, brisket, tendon, and tripe in 12-hour bone broth', price: 14.99, reviews: [
        { rating: 5, text: 'The bone broth is deep and aromatic — you can tell they simmer it for hours. Clear yet packed with beefy flavor. All the meats are tender.', hoursAgo: 3 },
        { rating: 5, text: 'Best pho near ASU campus. The broth is crystal clear and intensely flavorful. Rare beef cooks perfectly in the hot soup.', hoursAgo: 20 },
        { rating: 4, text: 'Really satisfying bowl of pho. Rich broth with good variety of meats. Generous fresh herb plate on the side.', hoursAgo: 48 },
        { rating: 5, text: 'Authentic and comforting. The broth has incredible depth from star anise and cinnamon. My cold-weather go-to.', hoursAgo: 85 },
      ] },
      { name: 'Banh Mi', cuisine: 'Vietnamese', description: 'Crispy baguette with lemongrass grilled pork, pickled daikon, and jalapeño', price: 10.99, reviews: [
        { rating: 5, text: 'Perfect banh mi. Crispy French bread, juicy lemongrass pork, tangy pickled veggies, and fresh cilantro. Under $11 too!', hoursAgo: 6 },
        { rating: 4, text: 'Great sandwich with nice textural contrast. The lemongrass pork is well-marinated and the bread has great crunch.', hoursAgo: 35 },
        { rating: 5, text: 'Best Vietnamese sandwich in Tempe. The balance of flavors and textures in every bite is spot on.', hoursAgo: 70 },
      ] },
      { name: 'Bun Bo Hue', cuisine: 'Vietnamese', description: 'Spicy beef noodle soup from Central Vietnam with lemongrass and shrimp paste', price: 15.99, reviews: [
        { rating: 5, text: 'If you think pho is the only Vietnamese soup, try this. Spicy, complex broth with lemongrass heat. The thick noodles soak it up.', hoursAgo: 10 },
        { rating: 4, text: 'Authentic bun bo hue with real depth of flavor. The shrimp paste gives it that funky, savory punch.', hoursAgo: 50 },
      ] },
    ],
  },
  {
    name: 'Cornish Pasty Co', address: '960 W University Dr', city: 'Tempe', state: 'AZ', country: 'USA', timezone: 'America/Phoenix', latitude: 33.4218, longitude: -111.9502,
    dishes: [
      { name: 'The Oggie', cuisine: 'British', description: 'Traditional Cornish pasty with beef, potato, onion, and swede in buttery crust', price: 11.99, reviews: [
        { rating: 5, text: 'Authentic Cornish pasty like you get in Cornwall. Flaky golden crust encasing perfectly seasoned beef and potato. Hand-crimped perfection.', hoursAgo: 5 },
        { rating: 5, text: 'The real deal. Thick buttery pastry with hearty filling. Perfect pub food paired with their craft beers.', hoursAgo: 28 },
        { rating: 4, text: 'Great savory pie. The crust is incredibly flaky and the filling is well-seasoned and comforting.', hoursAgo: 62 },
      ] },
      { name: 'Bangers and Mash', cuisine: 'British', description: 'House-made pork sausages with creamy mashed potatoes and onion gravy', price: 14.99, reviews: [
        { rating: 5, text: 'Proper British bangers and mash. The sausages are house-made with herbs and the gravy is rich and savory. Comfort food at its best.', hoursAgo: 8 },
        { rating: 4, text: 'Hearty and satisfying. Good quality sausages with smooth, buttery mash. The onion gravy ties it together.', hoursAgo: 42 },
        { rating: 5, text: 'Best British pub food in Arizona. The sausages snap when you bite into them. Creamy mash and thick gravy.', hoursAgo: 78 },
      ] },
      { name: 'Sticky Toffee Pudding', cuisine: 'British', description: 'Warm date sponge cake drenched in toffee sauce with vanilla ice cream', price: 9.99, reviews: [
        { rating: 5, text: 'Absolute showstopper dessert. Moist date cake soaked in warm toffee sauce with cold vanilla ice cream. A British classic done perfectly.', hoursAgo: 12 },
        { rating: 5, text: 'Save room for this. The toffee sauce is buttery and rich. The cake is perfectly moist. Best dessert in Tempe.', hoursAgo: 55 },
      ] },
    ],
  },

  // ── CALIFORNIA ────────────────────
  {
    name: 'In-N-Out Burger', address: '9245 W Venice Blvd', city: 'Los Angeles', state: 'CA', country: 'USA', timezone: 'America/Los_Angeles', latitude: 34.0292, longitude: -118.3969,
    dishes: [
      { name: 'Double-Double', cuisine: 'Fast Food', description: 'Two beef patties, two slices of American cheese, lettuce, tomato, spread, on a fresh bun', price: 5.25, reviews: [
        { rating: 5, text: 'The gold standard of fast food burgers. Fresh ingredients, perfectly grilled patties, and that special spread. Nothing beats it for the price.', hoursAgo: 2 },
        { rating: 5, text: 'Consistent quality every single time. The bun is always fresh, meat never frozen, cheese melts perfectly. California icon.', hoursAgo: 20 },
        { rating: 4, text: 'Classic quality. Simple, fresh, and delicious. Got mine animal style with extra pickles. Best fast food burger hands down.', hoursAgo: 50 },
        { rating: 5, text: 'Had the Double-Double for the first time and I understand the cult following. Juicy patties and fresh toppings for under $6.', hoursAgo: 80 },
      ] },
      { name: 'Animal Style Fries', cuisine: 'Fast Food', description: 'French fries topped with melted cheese, grilled onions, and spread', price: 4.60, reviews: [
        { rating: 5, text: 'Animal Style fries are addictive. Crispy fries loaded with melted cheese, caramelized grilled onions, and signature spread. Eat them fast.', hoursAgo: 5 },
        { rating: 4, text: 'Really good loaded fries. The grilled onions add amazing sweetness. Best eaten immediately.', hoursAgo: 30 },
        { rating: 5, text: 'The secret menu item everyone should know. Cheesy, savory, with those perfect grilled onions.', hoursAgo: 70 },
      ] },
      { name: 'Neapolitan Shake', cuisine: 'Fast Food', description: 'Thick milkshake blending chocolate, vanilla, and strawberry flavors', price: 3.45, reviews: [
        { rating: 5, text: 'Hidden gem on the secret menu. Three classic flavors swirled together in a thick, creamy shake. Best milkshake anywhere.', hoursAgo: 8 },
        { rating: 4, text: 'Great shake combining all three flavors. Thick and creamy without being too sweet. Perfect with a burger.', hoursAgo: 45 },
      ] },
    ],
  },
  {
    name: 'Tartine Bakery', address: '600 Guerrero St', city: 'San Francisco', state: 'CA', country: 'USA', timezone: 'America/Los_Angeles', latitude: 37.7616, longitude: -122.4242,
    dishes: [
      { name: 'Morning Bun', cuisine: 'Bakery', description: 'Flaky croissant dough swirled with cinnamon and orange zest, rolled in sugar', price: 5.50, reviews: [
        { rating: 5, text: 'Legendary morning bun. Flaky layers of croissant dough with warm cinnamon and bright orange zest. Shatteringly crispy outside, soft inside.', hoursAgo: 3 },
        { rating: 5, text: 'Worth waking up early and standing in line for. The texture is unreal — so many flaky layers. Iconic.', hoursAgo: 25 },
        { rating: 5, text: 'Best pastry in SF, maybe all of California. Each bite reveals more buttery layers. Sugar coating adds perfect crunch.', hoursAgo: 60 },
      ] },
      { name: 'Country Bread', cuisine: 'Bakery', description: 'Rustic sourdough loaf with deep crust and tangy open crumb', price: 10.00, reviews: [
        { rating: 5, text: 'The benchmark for sourdough. Deep, caramelized crust with beautifully open, tangy crumb. A bread-lovers dream.', hoursAgo: 6 },
        { rating: 5, text: 'The bread that made Tartine famous. Complex flavor, amazing crust, gorgeous crumb structure. Worth every penny.', hoursAgo: 36 },
      ] },
      { name: 'Croque Monsieur', cuisine: 'French', description: 'Grilled ham and Gruyère sandwich with béchamel on Tartine bread', price: 14.00, reviews: [
        { rating: 5, text: 'Croque monsieur on Tartines bread is next level. Crispy, cheesy, quality ham and rich béchamel. The bread makes all the difference.', hoursAgo: 10 },
        { rating: 4, text: 'Really good hot sandwich. The Gruyère melts beautifully and the béchamel is creamy. Famous bread elevates it.', hoursAgo: 48 },
      ] },
    ],
  },
  {
    name: 'Zankou Chicken', address: '5065 Sunset Blvd', city: 'Los Angeles', state: 'CA', country: 'USA', timezone: 'America/Los_Angeles', latitude: 34.0906, longitude: -118.3076,
    dishes: [
      { name: 'Original Chicken', cuisine: 'Mediterranean', description: 'Whole rotisserie chicken with signature garlic sauce, hummus, and pita', price: 10.99, reviews: [
        { rating: 5, text: 'An LA legend. Perfectly seasoned, juicy rotisserie chicken and that garlic sauce is absolutely addictive. Unbeatable value.', hoursAgo: 4 },
        { rating: 5, text: 'The garlic sauce alone is worth the trip. Chicken is always juicy with crispy skin. With hummus and pita, its perfect.', hoursAgo: 22 },
        { rating: 5, text: 'Best rotisserie chicken in LA. That secret garlic paste is heavenly. Coming here for 20 years and quality never drops.', hoursAgo: 55 },
        { rating: 4, text: 'Great chicken at a great price. Always tender and well-seasoned. That toum garlic sauce is addictive.', hoursAgo: 90 },
      ] },
      { name: 'Chicken Shawarma Plate', cuisine: 'Mediterranean', description: 'Marinated shawarma with garlic sauce, hummus, pickled turnips, and pita', price: 12.99, reviews: [
        { rating: 4, text: 'Excellent shawarma plate. Well-marinated and cooked perfectly on the spit. Generous portions.', hoursAgo: 8 },
        { rating: 5, text: 'Best shawarma in LA. Tender, flavorful chicken with that incredible garlic sauce.', hoursAgo: 38 },
      ] },
      { name: 'Hummus Plate', cuisine: 'Mediterranean', description: 'Creamy house-made hummus with olive oil, warm pita, and pickled vegetables', price: 7.99, reviews: [
        { rating: 5, text: 'The smoothest, creamiest hummus Ive ever had. Perfectly seasoned with quality olive oil. Fresh warm pita.', hoursAgo: 12 },
        { rating: 5, text: 'Silky smooth with a rich tahini flavor. Simple, authentic, and delicious. Always get this as a starter.', hoursAgo: 50 },
      ] },
    ],
  },
  {
    name: 'Phils BBQ', address: '3750 Sports Arena Blvd', city: 'San Diego', state: 'CA', country: 'USA', timezone: 'America/Los_Angeles', latitude: 32.7570, longitude: -117.2137,
    dishes: [
      { name: 'El Toro', cuisine: 'BBQ', description: 'Mesquite-grilled tri-tip sandwich with Phils signature BBQ sauce on a fresh roll', price: 13.99, reviews: [
        { rating: 5, text: 'Best BBQ sandwich in San Diego. Perfectly grilled tri-tip thats smoky and tender. The roll soaks up all the juices.', hoursAgo: 5 },
        { rating: 5, text: 'Massive and packed with flavor. Mesquite-grilled tri-tip has amazing smokiness. The sauce is sweet and tangy perfection.', hoursAgo: 28 },
        { rating: 4, text: 'Really good BBQ sandwich. Well-cooked tri-tip with great sauce depth. Get the large.', hoursAgo: 65 },
      ] },
      { name: 'Baby Back Ribs', cuisine: 'BBQ', description: 'Slow-smoked baby back ribs with sweet and tangy BBQ glaze', price: 26.99, reviews: [
        { rating: 5, text: 'Fall-off-the-bone tender ribs with incredible glaze. Beautiful smoke ring and juicy meat. Best ribs in SoCal.', hoursAgo: 10 },
        { rating: 5, text: 'Perfection. Meaty, smoky, and the sauce caramelizes beautifully. These are top tier.', hoursAgo: 45 },
      ] },
      { name: 'Broham', cuisine: 'BBQ', description: 'Mesquite-grilled chicken breast sandwich with BBQ sauce, coleslaw, and pickles', price: 11.99, reviews: [
        { rating: 4, text: 'Great chicken BBQ sandwich. Juicy and well-seasoned from the mesquite grill. Coleslaw adds nice crunch.', hoursAgo: 15 },
        { rating: 5, text: 'Best chicken sandwich in San Diego. The mesquite flavor is incredible. Really satisfying.', hoursAgo: 55 },
      ] },
    ],
  },
  {
    name: 'Chez Panisse', address: '1517 Shattuck Ave', city: 'Berkeley', state: 'CA', country: 'USA', timezone: 'America/Los_Angeles', latitude: 37.8798, longitude: -122.2692,
    dishes: [
      { name: 'Wood-Fired Pizza', cuisine: 'California', description: 'Seasonal pizza with local organic ingredients, baked in a wood-fired oven', price: 22.00, reviews: [
        { rating: 5, text: 'The original California-style pizza. Perfectly charred crust with the freshest seasonal toppings. Each visit features something new.', hoursAgo: 8 },
        { rating: 5, text: 'Alice Waters started farm-to-table and this pizza shows why. Every ingredient shines. Simple, seasonal, delicious.', hoursAgo: 48 },
      ] },
      { name: 'Seasonal Garden Salad', cuisine: 'California', description: 'Mixed organic greens from local farms with house vinaigrette', price: 16.00, reviews: [
        { rating: 5, text: 'This salad changed how I think about salads. The greens are so fresh and flavorful you barely need dressing.', hoursAgo: 12 },
        { rating: 4, text: 'Simple yet extraordinary. The quality of organic greens is evident in every bite.', hoursAgo: 60 },
      ] },
      { name: 'Meyer Lemon Sherbet', cuisine: 'Dessert', description: 'Refreshing sherbet made with organic Meyer lemons', price: 12.00, reviews: [
        { rating: 5, text: 'Perfect ending to a Chez Panisse meal. Bright, tangy Meyer lemon thats refreshing and not too sweet. Wonderful.', hoursAgo: 18 },
        { rating: 4, text: 'Lovely light dessert. Natural and bright Meyer lemon flavor. Nice palate cleanser after a rich meal.', hoursAgo: 70 },
      ] },
    ],
  },
];

async function main() {
  console.log('🌱 Starting fresh seed...');

  // ── Clean all existing data ──
  console.log('🗑️  Cleaning existing data...');
  await prisma.review.deleteMany();
  await prisma.alertSubscription.deleteMany();
  await prisma.dailyRollup.deleteMany();
  await prisma.dishAtRestaurant.deleteMany();
  await prisma.dish.deleteMany();
  await prisma.restaurant.deleteMany();
  console.log('✅ Database cleaned');

  const now = new Date();
  let totalRestaurants = 0;
  let totalDishes = 0;
  let totalReviews = 0;

  for (const rest of restaurants) {
    const restaurant = await prisma.restaurant.create({
      data: {
        name: rest.name, address: rest.address, city: rest.city,
        state: rest.state, country: rest.country, timezone: rest.timezone,
        latitude: rest.latitude, longitude: rest.longitude,
      },
    });
    totalRestaurants++;

    for (const d of rest.dishes) {
      let dish = await prisma.dish.findFirst({ where: { name: d.name } });
      if (!dish) {
        dish = await prisma.dish.create({
          data: { name: d.name, cuisine: d.cuisine, description: d.description },
        });
      }

      const dar = await prisma.dishAtRestaurant.create({
        data: { restaurantId: restaurant.id, dishId: dish.id, price: d.price, isActive: true },
      });
      totalDishes++;

      for (const r of d.reviews) {
        await prisma.review.create({
          data: {
            dishAtRestaurantId: dar.id,
            rating: r.rating,
            text: r.text,
            createdAt: new Date(now.getTime() - r.hoursAgo * 60 * 60 * 1000),
          },
        });
        totalReviews++;
      }
    }

    console.log(`  ✅ ${rest.name} (${rest.city}, ${rest.state}) — ${rest.dishes.length} dishes`);
  }

  // Stub alert subscription
  const firstDar = await prisma.dishAtRestaurant.findFirst();
  if (firstDar) {
    await prisma.alertSubscription.create({
      data: {
        dishAtRestaurantId: firstDar.id,
        email: 'demo@freshbite.com',
        window: '24h',
        minRating: 3.5,
        isActive: true,
      },
    });
  }

  console.log('\n🎉 Seed completed!');
  console.log(`   📍 ${totalRestaurants} restaurants`);
  console.log(`   🍴 ${totalDishes} dishes`);
  console.log(`   📝 ${totalReviews} reviews`);
  console.log('\n   Regions: Tempe AZ · Seattle WA · Bellevue WA · California (LA, SF, San Diego, Berkeley)');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
