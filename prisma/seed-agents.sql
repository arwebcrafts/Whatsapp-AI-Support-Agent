-- Pre-built Agent Templates with Knowledge Base
-- These can be used by users as starting templates

-- Note: Replace 'USER_ID_HERE' with actual user ID when seeding
-- This file serves as a template for creating pre-built agents

-- 1. E-Commerce Sales Agent
INSERT INTO knowledge_base (id, userId, title, content, sourceType, createdAt, updatedAt) VALUES
('kb-ecommerce-1', 'TEMPLATE_USER', 'E-Commerce Product Info',
'We sell high-quality products online with:
- Free shipping on orders over $50
- 30-day money-back guarantee
- 24/7 customer support
- Secure payment processing
- Products: Electronics, Fashion, Home & Garden
- Average delivery: 3-5 business days
- International shipping available
- Accepted payments: Credit cards, PayPal, Apple Pay',
'manual', NOW(), NOW());

-- 2. Real Estate Agent
INSERT INTO knowledge_base (id, userId, title, content, sourceType, createdAt, updatedAt) VALUES
('kb-realestate-1', 'TEMPLATE_USER', 'Real Estate Services',
'Professional real estate services:
- Residential property sales & rentals
- Commercial property listings
- Property valuation & market analysis
- Virtual & in-person property tours
- Mortgage assistance & financing guidance
- Neighborhoods: Downtown, Suburbs, Waterfront areas
- Price range: $200K - $2M
- Available: Apartments, Houses, Condos, Land
- No fees for buyers
- Licensed and insured agents',
'manual', NOW(), NOW());

-- 3. Restaurant & Food Delivery
INSERT INTO knowledge_base (id, userId, title, content, sourceType, createdAt, updatedAt) VALUES
('kb-restaurant-1', 'TEMPLATE_USER', 'Restaurant Menu & Info',
'Restaurant Information:
- Cuisine: Italian, Pizza, Pasta
- Hours: Mon-Sun 11 AM - 10 PM
- Delivery available (30-45 min)
- Dine-in & Takeout options
- Popular items: Margherita Pizza ($12), Carbonara Pasta ($14), Lasagna ($16)
- Appetizers: Garlic Bread ($5), Bruschetta ($7), Mozzarella Sticks ($8)
- Desserts: Tiramisu ($6), Gelato ($5)
- Free delivery on orders $25+
- Dietary options: Vegetarian, Vegan, Gluten-free available
- Reservations accepted for 4+ people',
'manual', NOW(), NOW());

-- 4. Fitness & Gym
INSERT INTO knowledge_base (id, userId, title, content, sourceType, createdAt, updatedAt) VALUES
('kb-fitness-1', 'TEMPLATE_USER', 'Gym Membership & Services',
'Fitness Center Offerings:
- Membership Plans: Basic ($29/mo), Premium ($49/mo), VIP ($79/mo)
- Facilities: Cardio equipment, Free weights, Group classes, Pool, Sauna
- Group Classes: Yoga, Zumba, Spinning, HIIT, Pilates
- Personal Training available ($50/session)
- Hours: Mon-Fri 5 AM - 11 PM, Weekends 7 AM - 9 PM
- First week FREE trial
- No long-term contracts
- Certified trainers
- Locker rooms & showers
- Free parking
- Nutrition counseling available',
'manual', NOW(), NOW());

-- 5. Education & Tutoring
INSERT INTO knowledge_base (id, userId, title, content, sourceType, createdAt, updatedAt) VALUES
('kb-education-1', 'TEMPLATE_USER', 'Tutoring Services',
'Professional Tutoring Services:
- Subjects: Math, Science, English, SAT/ACT Prep
- Grade levels: K-12 and College
- 1-on-1 tutoring: $40/hour
- Group sessions: $25/hour per student
- Online & in-person options
- Flexible scheduling (weekdays & weekends)
- Experienced certified teachers
- Customized learning plans
- Progress tracking & reports
- First session 50% off
- Package deals available (10 sessions: $350)
- Materials included',
'manual', NOW(), NOW());

-- FAQs for E-Commerce
INSERT INTO faqs (id, userId, question, answer, category, priority, createdAt, updatedAt) VALUES
('faq-ec-1', 'TEMPLATE_USER', 'What is your return policy?', 'We offer a 30-day money-back guarantee on all products. If you\'re not satisfied, you can return items for a full refund. Items must be unused and in original packaging.', 'shipping', 5, NOW(), NOW()),
('faq-ec-2', 'TEMPLATE_USER', 'How long does shipping take?', 'Standard shipping takes 3-5 business days. Express shipping (1-2 days) is available for an additional fee. Free shipping on orders over $50!', 'shipping', 5, NOW(), NOW()),
('faq-ec-3', 'TEMPLATE_USER', 'What payment methods do you accept?', 'We accept all major credit cards (Visa, MasterCard, Amex), PayPal, Apple Pay, and Google Pay. All transactions are secure and encrypted.', 'payment', 4, NOW(), NOW());

-- FAQs for Restaurant
INSERT INTO faqs (id, userId, question, answer, category, priority, createdAt, updatedAt) VALUES
('faq-rest-1', 'TEMPLATE_USER', 'Do you offer delivery?', 'Yes! We deliver within a 5-mile radius. Delivery is FREE on orders over $25. Typical delivery time is 30-45 minutes.', 'delivery', 5, NOW(), NOW()),
('faq-rest-2', 'TEMPLATE_USER', 'Do you have vegetarian options?', 'Absolutely! We have a wide selection of vegetarian dishes including veggie pizzas, pasta primavera, and vegetarian lasagna. Vegan and gluten-free options also available.', 'menu', 4, NOW(), NOW()),
('faq-rest-3', 'TEMPLATE_USER', 'Can I make a reservation?', 'Yes, we accept reservations for parties of 4 or more. Walk-ins are welcome for smaller groups. Call us or message here to book!', 'reservation', 3, NOW(), NOW());

-- This seed file provides ready-to-use knowledge bases and FAQs for common business types
-- Users can copy these into their own accounts or they can be pre-loaded for demo purposes
