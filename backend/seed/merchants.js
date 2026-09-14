/**
 * Seed de marchands de démonstration pour AtlasPi
 * À exécuter une seule fois (si la table est vide)
 */

const { v4: uuidv4 } = require("uuid");

const DEMO_MERCHANTS = [
  {
    name: "Café Atlas", business: "Café Atlas SARL", city: "Casablanca", country: "Morocco",
    lat: 33.5731, lng: -7.5898, category: "Restaurant", domain: "Food & Beverage",
    desc: "Café traditionnel marocain au cœur de Casablanca. Thé à la menthe et pâtisseries.",
    phone: "+212 522 123 456", email: "contact@cafeatlas.ma"
  },
  {
    name: "Marrakech Souk", business: "Souk Artisanal", city: "Marrakech", country: "Morocco",
    lat: 31.6295, lng: -7.9811, category: "Artisanat", domain: "Retail",
    desc: "Artisanat marocain authentique : tapis, poteries, bijoux.",
    phone: "+212 524 456 789", email: "info@souk-marrakech.ma"
  },
  {
    name: "Dakar Tech Hub", business: "Dakar Tech SARL", city: "Dakar", country: "Senegal",
    lat: 14.7167, lng: -17.4677, category: "Technologie", domain: "Services",
    desc: "Réparation et vente de matériel informatique à Dakar.",
    phone: "+221 33 123 4567", email: "hello@dakartech.sn"
  },
  {
    name: "Lagos Fresh Market", business: "Lagos Fresh Ltd", city: "Lagos", country: "Nigeria",
    lat: 6.5244, lng: 3.3792, category: "Alimentation", domain: "Retail",
    desc: "Marché de produits frais à Lagos. Fruits, légumes et épices locales.",
    phone: "+234 1 234 5678", email: "sales@lagosfresh.ng"
  },
  {
    name: "Nairobi Coffee Co", business: "Nairobi Coffee", city: "Nairobi", country: "Kenya",
    lat: -1.2921, lng: 36.8219, category: "Café", domain: "Food & Beverage",
    desc: "Café de spécialité kényan. Torréfaction artisanale.",
    phone: "+254 20 123 4567", email: "info@nairobicoffee.ke"
  },
  {
    name: "Cape Town Surf", business: "CT Surf School", city: "Cape Town", country: "South Africa",
    lat: -33.9249, lng: 18.4241, category: "Sport", domain: "Loisirs",
    desc: "École de surf à Cape Town. Cours pour débutants et avancés.",
    phone: "+27 21 123 4567", email: "surf@capetown.co.za"
  },
  {
    name: "Cairo Spices", business: "Cairo Spices Trading", city: "Cairo", country: "Egypt",
    lat: 30.0444, lng: 31.2357, category: "Épices", domain: "Retail",
    desc: "Épices et herbes du Moyen-Orient. Livraison au Caire.",
    phone: "+20 2 1234 5678", email: "orders@cairospices.eg"
  },
  {
    name: "Accra Fashion", business: "Accra Fashion House", city: "Accra", country: "Ghana",
    lat: 5.6037, lng: -0.1870, category: "Mode", domain: "Retail",
    desc: "Mode africaine contemporaine. Créations locales.",
    phone: "+233 30 123 4567", email: "shop@accrafashion.gh"
  },
  {
    name: "Douala Auto", business: "Douala Auto Services", city: "Douala", country: "Cameroon",
    lat: 4.0511, lng: 9.7679, category: "Automobile", domain: "Services",
    desc: "Garage automobile à Douala. Réparation et entretien.",
    phone: "+237 2 33 12 34 56", email: "contact@doualaauto.cm"
  },
  {
    name: "Tunis Books", business: "Librairie Tunis", city: "Tunis", country: "Tunisia",
    lat: 36.8065, lng: 10.1815, category: "Librairie", domain: "Retail",
    desc: "Librairie indépendante à Tunis. Livres en arabe, français et anglais.",
    phone: "+216 71 123 456", email: "livres@tunisbooks.tn"
  },
  {
    name: "Alger Restaurant", business: "Le Gourmet Algérois", city: "Alger", country: "Algeria",
    lat: 36.7538, lng: 3.0588, category: "Restaurant", domain: "Food & Beverage",
    desc: "Cuisine algéroise traditionnelle. Couscous et tajines.",
    phone: "+213 21 123 456", email: "resa@legourmet.dz"
  },
  {
    name: "Kigali Crafts", business: "Kigali Artisanat", city: "Kigali", country: "Rwanda",
    lat: -1.9441, lng: 30.0619, category: "Artisanat", domain: "Retail",
    desc: "Paniers tissés et sculptures rwandaises. Commerce équitable.",
    phone: "+250 788 123 456", email: "info@kigalicrafts.rw"
  },
  {
    name: "Abidjan Digital", business: "Abidjan Digital Agency", city: "Abidjan", country: "Ivory Coast",
    lat: 5.3600, lng: -4.0083, category: "Marketing", domain: "Services",
    desc: "Agence digitale à Abidjan. Web, réseaux sociaux, branding.",
    phone: "+225 27 20 12 34 56", email: "hello@abidjandigital.ci"
  },
  {
    name: "Zanzibar Spices", business: "Zanzibar Spice Farm", city: "Zanzibar", country: "Tanzania",
    lat: -6.1659, lng: 39.2026, category: "Épices", domain: "Agriculture",
    desc: "Ferme d'épices à Zanzibar. Visites et vente directe.",
    phone: "+255 24 123 4567", email: "tours@zanzibarspice.tz"
  },
  {
    name: "Addis Coffee", business: "Addis Coffee Export", city: "Addis Ababa", country: "Ethiopia",
    lat: 9.0320, lng: 38.7469, category: "Café", domain: "Food & Beverage",
    desc: "Café éthiopien de spécialité. Export et vente locale.",
    phone: "+251 11 123 4567", email: "export@addiscoffee.et"
  }
];

function seedMerchants(db) {
  try {
    // Vérifier si la table contient déjà des marchands
    const count = db.prepare("SELECT COUNT(*) as c FROM merchant_listings").get();
    if (count && count.c > 0) {
      console.log(`ℹ️  Marchands déjà présents (${count.c}) — pas de seed`);
      return;
    }

    const now = new Date().toISOString();
    const insert = db.prepare(`
      INSERT INTO merchant_listings (
        listing_uuid, owner_user_id, listing_public_name, profile_type,
        business_name, owner_display_name, public_description_short,
        domain, category, products_services_summary,
        country, city, latitude, longitude,
        phone_business, email_business, website_url,
        accepts_pi, pi_description,
        verification_status, verification_badge_public,
        consent_data_accuracy, consent_publication_rights, consent_third_party_rights,
        consent_terms, consent_privacy, consent_listing_policy,
        consent_public_display, consent_review_and_moderation,
        consent_legal_cooperation_notice, consent_timestamp,
        terms_version_accepted, privacy_version_accepted, listing_policy_version_accepted,
        listing_status, merchant_pi_payments_enabled, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let inserted = 0;
    for (const m of DEMO_MERCHANTS) {
      const uid = "demo_" + uuidv4().slice(0, 8);
      insert.run(
        uuidv4(),                           // listing_uuid
        uid,                                // owner_user_id
        m.name,                             // listing_public_name
        "business",                         // profile_type
        m.business,                         // business_name
        m.name,                             // owner_display_name
        m.desc,                             // public_description_short
        m.domain,                           // domain
        m.category,                         // category
        m.desc,                             // products_services_summary
        m.country,                          // country
        m.city,                             // city
        m.lat,                              // latitude
        m.lng,                              // longitude
        m.phone,                            // phone_business
        m.email,                            // email_business
        null,                               // website_url
        1,                                  // accepts_pi
        "Nous acceptons Pi Network !",      // pi_description
        "verified",                         // verification_status
        "verified",                         // verification_badge_public
        1, 1, 1, 1, 1, 1, 1, 1, 1,          // consent_* (9 champs)
        now,                                // consent_timestamp
        "1.0", "1.0", "1.0",                // versions
        "approved",                         // listing_status
        1,                                  // merchant_pi_payments_enabled
        now, now                            // created_at, updated_at
      );
      inserted++;
    }

    console.log(`✅ ${inserted} marchands de démonstration ajoutés`);
  } catch (err) {
    console.error("❌ Erreur seed marchands:", err.message);
  }
}

module.exports = { seedMerchants };

// ============================================
// MARCHANDS INTERNATIONAUX (Europe, Amériques, Asie, Océanie)
// ============================================
const INTERNATIONAL_MERCHANTS = [
  {
    name: "Paris Café Lumière", business: "Café Lumière SARL", city: "Paris", country: "France",
    lat: 48.8566, lng: 2.3522, category: "Restaurant", domain: "Food & Beverage",
    desc: "Café parisien traditionnel. Croissants et café de spécialité.",
    phone: "+33 1 23 45 67 89", email: "contact@cafelumiere.fr"
  },
  {
    name: "London Tech Shop", business: "London Tech Ltd", city: "London", country: "United Kingdom",
    lat: 51.5074, lng: -0.1278, category: "Technologie", domain: "Services",
    desc: "Réparation et vente de matériel électronique à Londres.",
    phone: "+44 20 1234 5678", email: "info@londontech.co.uk"
  },
  {
    name: "Berlin Buchhandlung", business: "Berlin Books GmbH", city: "Berlin", country: "Germany",
    lat: 52.5200, lng: 13.4050, category: "Librairie", domain: "Retail",
    desc: "Librairie indépendante à Berlin. Livres en allemand et anglais.",
    phone: "+49 30 1234 5678", email: "hallo@berlinbooks.de"
  },
  {
    name: "Madrid Tapas", business: "Tapas Madrid SL", city: "Madrid", country: "Spain",
    lat: 40.4168, lng: -3.7038, category: "Restaurant", domain: "Food & Beverage",
    desc: "Tapas espagnols authentiques au cœur de Madrid.",
    phone: "+34 91 123 4567", email: "reservas@tapasmadrid.es"
  },
  {
    name: "Roma Gelato", business: "Gelateria Roma", city: "Rome", country: "Italy",
    lat: 41.9028, lng: 12.4964, category: "Glacier", domain: "Food & Beverage",
    desc: "Gelato artisanal italien. Saveurs traditionnelles.",
    phone: "+39 06 1234 5678", email: "ciao@gelatoroma.it"
  },
  {
    name: "New York Pizza Co", business: "NY Pizza LLC", city: "New York", country: "USA",
    lat: 40.7128, lng: -74.0060, category: "Restaurant", domain: "Food & Beverage",
    desc: "Pizza new-yorkaise authentique. Livraison à Manhattan.",
    phone: "+1 212 123 4567", email: "orders@nypizza.com"
  },
  {
    name: "Toronto Maple Store", business: "Maple Goods Inc", city: "Toronto", country: "Canada",
    lat: 43.6532, lng: -79.3832, category: "Souvenirs", domain: "Retail",
    desc: "Produits canadiens authentiques. Sirop d'érable et souvenirs.",
    phone: "+1 416 123 4567", email: "hello@maplestore.ca"
  },
  {
    name: "Mexico City Tacos", business: "Tacos CDMX", city: "Mexico City", country: "Mexico",
    lat: 19.4326, lng: -99.1332, category: "Restaurant", domain: "Food & Beverage",
    desc: "Tacos mexicains traditionnels. Saveurs authentiques.",
    phone: "+52 55 1234 5678", email: "hola@tacoscdmx.mx"
  },
  {
    name: "São Paulo Coffee", business: "Café Brasil Ltda", city: "São Paulo", country: "Brazil",
    lat: -23.5505, lng: -46.6333, category: "Café", domain: "Food & Beverage",
    desc: "Café brésilien de spécialité. Torréfaction locale.",
    phone: "+55 11 1234 5678", email: "contato@cafebrasil.br"
  },
  {
    name: "Buenos Aires Tango", business: "Tango BA", city: "Buenos Aires", country: "Argentina",
    lat: -34.6037, lng: -58.3816, category: "Culture", domain: "Loisirs",
    desc: "École de tango argentin. Cours et spectacles.",
    phone: "+54 11 1234 5678", email: "info@tangoba.ar"
  },
  {
    name: "Tokyo Sushi", business: "Sushi Tokyo KK", city: "Tokyo", country: "Japan",
    lat: 35.6762, lng: 139.6503, category: "Restaurant", domain: "Food & Beverage",
    desc: "Sushi traditionnel japonais. Produits frais du marché.",
    phone: "+81 3 1234 5678", email: "info@sushitokyo.jp"
  },
  {
    name: "Singapore Tech Hub", business: "SG Tech Pte Ltd", city: "Singapore", country: "Singapore",
    lat: 1.3521, lng: 103.8198, category: "Technologie", domain: "Services",
    desc: "Startup hub et coworking à Singapour.",
    phone: "+65 6123 4567", email: "hello@sgtech.sg"
  },
  {
    name: "Mumbai Spices", business: "Mumbai Masala", city: "Mumbai", country: "India",
    lat: 19.0760, lng: 72.8777, category: "Épices", domain: "Retail",
    desc: "Épices indiennes authentiques. Mélanges traditionnels.",
    phone: "+91 22 1234 5678", email: "orders@mumbaimasala.in"
  },
  {
    name: "Sydney Surf Shop", business: "Sydney Surf Co", city: "Sydney", country: "Australia",
    lat: -33.8688, lng: 151.2093, category: "Sport", domain: "Loisirs",
    desc: "Équipement de surf et cours à Sydney.",
    phone: "+61 2 1234 5678", email: "info@sydneysurf.au"
  },
  {
    name: "Auckland Coffee", business: "NZ Coffee Ltd", city: "Auckland", country: "New Zealand",
    lat: -36.8485, lng: 174.7633, category: "Café", domain: "Food & Beverage",
    desc: "Café néo-zélandais de spécialité. Torréfaction artisanale.",
    phone: "+64 9 123 4567", email: "hello@nzcoffee.nz"
  }
];

// Remplacer la fonction seedMerchants pour inclure les deux listes
function seedAllMerchants(db) {
  const ALL_MERCHANTS = [...DEMO_MERCHANTS, ...INTERNATIONAL_MERCHANTS];
  
  try {
    const count = db.prepare("SELECT COUNT(*) as c FROM merchant_listings").get();
    if (count && count.c >= ALL_MERCHANTS.length) {
      console.log(`ℹ️  Marchands déjà présents (${count.c}) — pas de seed`);
      return;
    }

    const now = new Date().toISOString();
    const insert = db.prepare(`
      INSERT INTO merchant_listings (
        listing_uuid, owner_user_id, listing_public_name, profile_type,
        business_name, owner_display_name, public_description_short,
        domain, category, products_services_summary,
        country, city, latitude, longitude,
        phone_business, email_business, website_url,
        accepts_pi, pi_description,
        verification_status, verification_badge_public,
        consent_data_accuracy, consent_publication_rights, consent_third_party_rights,
        consent_terms, consent_privacy, consent_listing_policy,
        consent_public_display, consent_review_and_moderation,
        consent_legal_cooperation_notice, consent_timestamp,
        terms_version_accepted, privacy_version_accepted, listing_policy_version_accepted,
        listing_status, merchant_pi_payments_enabled, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let inserted = 0;
    for (const m of ALL_MERCHANTS) {
      // Vérifier si le marchand existe déjà (par nom)
      const existing = db.prepare("SELECT id FROM merchant_listings WHERE listing_public_name = ?").get(m.name);
      if (existing) continue;

      const uid = "demo_" + uuidv4().slice(0, 8);
      insert.run(
        uuidv4(), uid, m.name, "business", m.business, m.name, m.desc,
        m.domain, m.category, m.desc, m.country, m.city, m.lat, m.lng,
        m.phone, m.email, null, 1, "Nous acceptons Pi Network !",
        "verified", "verified",
        1, 1, 1, 1, 1, 1, 1, 1, 1,
        now, "1.0", "1.0", "1.0",
        "approved", 1, now, now
      );
      inserted++;
    }

    console.log(`✅ ${inserted} nouveaux marchands ajoutés (total: ${ALL_MERCHANTS.length})`);
  } catch (err) {
    console.error("❌ Erreur seed marchands:", err.message);
  }
}

module.exports = { seedMerchants: seedAllMerchants };

// ============================================
// MARCHANDS ADDITIONNELS (vague 2)
// ============================================
const EXTRA_MERCHANTS = [
  // EUROPE
  { name: "Amsterdam Bike Shop", business: "Amsterdam Bikes", city: "Amsterdam", country: "Netherlands", lat: 52.3676, lng: 4.9041, category: "Sport", domain: "Retail", desc: "Location et vente de vélos à Amsterdam.", phone: "+31 20 123 4567", email: "info@amsbikes.nl" },
  { name: "Barcelona Tapas Bar", business: "Tapas Barcelona SL", city: "Barcelona", country: "Spain", lat: 41.3874, lng: 2.1686, category: "Restaurant", domain: "Food & Beverage", desc: "Tapas et sangria à Barcelone.", phone: "+34 93 123 4567", email: "hola@tapasbcn.es" },
  { name: "Vienna Coffee House", business: "Wiener Kaffeehaus", city: "Vienna", country: "Austria", lat: 48.2082, lng: 16.3738, category: "Café", domain: "Food & Beverage", desc: "Café viennois traditionnel. Apfelstrudel et mélanges.", phone: "+43 1 123 4567", email: "info@wienerkaffee.at" },
  { name: "Lisbon Pastelaria", business: "Pastelaria Lisboa", city: "Lisbon", country: "Portugal", lat: 38.7223, lng: -9.1393, category: "Pâtisserie", domain: "Food & Beverage", desc: "Pastéis de nata authentiques à Lisbonne.", phone: "+351 21 123 4567", email: "info@pastelaria.pt" },
  { name: "Stockholm Design", business: "Stockholm Design AB", city: "Stockholm", country: "Sweden", lat: 59.3293, lng: 18.0686, category: "Design", domain: "Retail", desc: "Design scandinave. Mobilier et décoration.", phone: "+46 8 123 4567", email: "info@sthlmdesign.se" },
  { name: "Dublin Pub", business: "Dublin Pub Ltd", city: "Dublin", country: "Ireland", lat: 53.3498, lng: -6.2603, category: "Restaurant", domain: "Food & Beverage", desc: "Pub irlandais authentique à Dublin.", phone: "+353 1 123 4567", email: "info@dublinpub.ie" },
  { name: "Prague Crystal", business: "Prague Crystal s.r.o.", city: "Prague", country: "Czech Republic", lat: 50.0755, lng: 14.4378, category: "Artisanat", domain: "Retail", desc: "Cristal de Bohême. Verrerie artisanale.", phone: "+420 2 1234 5678", email: "info@praguecrystal.cz" },
  { name: "Athens Olive Oil", business: "Athens Olive Co", city: "Athens", country: "Greece", lat: 37.9838, lng: 23.7275, category: "Alimentation", domain: "Agriculture", desc: "Huile d'olive grecque extra vierge.", phone: "+30 21 1234 5678", email: "info@athensolive.gr" },
  
  // AMÉRIQUES
  { name: "Chicago Deep Dish", business: "Chicago Pizza Co", city: "Chicago", country: "USA", lat: 41.8781, lng: -87.6298, category: "Restaurant", domain: "Food & Beverage", desc: "Pizza deep dish de Chicago.", phone: "+1 312 123 4567", email: "orders@chicagopizza.com" },
  { name: "Los Angeles Fitness", business: "LA Fitness Studio", city: "Los Angeles", country: "USA", lat: 34.0522, lng: -118.2437, category: "Sport", domain: "Services", desc: "Salle de sport à Los Angeles.", phone: "+1 213 123 4567", email: "info@lafitness.com" },
  { name: "Miami Beach Shop", business: "Miami Beach LLC", city: "Miami", country: "USA", lat: 25.7617, lng: -80.1918, category: "Mode", domain: "Retail", desc: "Mode balnéaire à Miami.", phone: "+1 305 123 4567", email: "shop@miamibeach.com" },
  { name: "Vancouver Seafood", business: "Vancouver Seafood Ltd", city: "Vancouver", country: "Canada", lat: 49.2827, lng: -123.1207, category: "Restaurant", domain: "Food & Beverage", desc: "Fruits de mer frais à Vancouver.", phone: "+1 604 123 4567", email: "info@vanseafood.ca" },
  { name: "Bogotá Coffee", business: "Café Bogotá Ltda", city: "Bogotá", country: "Colombia", lat: 4.7110, lng: -74.0721, category: "Café", domain: "Food & Beverage", desc: "Café colombien de spécialité.", phone: "+57 1 123 4567", email: "info@cafebogota.co" },
  { name: "Lima Ceviche", business: "Cevicheria Lima", city: "Lima", country: "Peru", lat: -12.0464, lng: -77.0428, category: "Restaurant", domain: "Food & Beverage", desc: "Ceviche péruvien authentique.", phone: "+51 1 123 4567", email: "info@limaceviche.pe" },
  { name: "Santiago Wine", business: "Viña Santiago", city: "Santiago", country: "Chile", lat: -33.4489, lng: -70.6693, category: "Vin", domain: "Agriculture", desc: "Vins chiliens de la vallée centrale.", phone: "+56 2 1234 5678", email: "info@vinasantiago.cl" },
  
  // ASIE
  { name: "Seoul Kimchi", business: "Seoul Kimchi Co", city: "Seoul", country: "South Korea", lat: 37.5665, lng: 126.9780, category: "Alimentation", domain: "Food & Beverage", desc: "Kimchi traditionnel coréen.", phone: "+82 2 1234 5678", email: "info@seoulkimchi.kr" },
  { name: "Bangkok Street Food", business: "Bangkok Street Food", city: "Bangkok", country: "Thailand", lat: 13.7563, lng: 100.5018, category: "Restaurant", domain: "Food & Beverage", desc: "Cuisine de rue thaïlandaise.", phone: "+66 2 123 4567", email: "info@bkkstreet.th" },
  { name: "Hong Kong Dim Sum", business: "HK Dim Sum Ltd", city: "Hong Kong", country: "Hong Kong", lat: 22.3193, lng: 114.1694, category: "Restaurant", domain: "Food & Beverage", desc: "Dim sum traditionnel de Hong Kong.", phone: "+852 1234 5678", email: "info@hkdimsum.hk" },
  { name: "Taipei Tea House", business: "Taipei Tea Co", city: "Taipei", country: "Taiwan", lat: 25.0330, lng: 121.5654, category: "Café", domain: "Food & Beverage", desc: "Thé taïwanais de haute qualité.", phone: "+886 2 1234 5678", email: "info@taipeitea.tw" },
  { name: "Dubai Gold Souk", business: "Dubai Gold Trading", city: "Dubai", country: "UAE", lat: 25.2048, lng: 55.2708, category: "Bijoux", domain: "Retail", desc: "Bijoux en or au souk de Dubaï.", phone: "+971 4 123 4567", email: "info@dubaigold.ae" },
  { name: "Istanbul Bazaar", business: "Grand Bazaar Istanbul", city: "Istanbul", country: "Turkey", lat: 41.0082, lng: 28.9784, category: "Artisanat", domain: "Retail", desc: "Tapis et artisanat turc au Grand Bazar.", phone: "+90 212 123 4567", email: "info@istanbulbazaar.tr" },
  { name: "Tel Aviv Tech", business: "TLV Tech Ltd", city: "Tel Aviv", country: "Israel", lat: 32.0853, lng: 34.7818, category: "Technologie", domain: "Services", desc: "Startup tech à Tel Aviv.", phone: "+972 3 123 4567", email: "info@tlvtech.il" },
  { name: "Beijing Tea", business: "Beijing Tea House", city: "Beijing", country: "China", lat: 39.9042, lng: 116.4074, category: "Café", domain: "Food & Beverage", desc: "Thé chinois traditionnel.", phone: "+86 10 1234 5678", email: "info@beijingtea.cn" },
  
  // AFRIQUE (suite)
  { name: "Kampala Crafts", business: "Kampala Crafts Ltd", city: "Kampala", country: "Uganda", lat: 0.3476, lng: 32.5825, category: "Artisanat", domain: "Retail", desc: "Artisanat ougandais authentique.", phone: "+256 41 123 4567", email: "info@kampalacrafts.ug" },
  { name: "Lusaka Market", business: "Lusaka Market Ltd", city: "Lusaka", country: "Zambia", lat: -15.3875, lng: 28.3228, category: "Alimentation", domain: "Retail", desc: "Marché local de Lusaka.", phone: "+260 21 123 4567", email: "info@lusakamarket.zm" },
  { name: "Harare Crafts", business: "Harare Crafts Co", city: "Harare", country: "Zimbabwe", lat: -17.8252, lng: 31.0335, category: "Artisanat", domain: "Retail", desc: "Sculptures en pierre de Zimbabwe.", phone: "+263 4 123 4567", email: "info@hararecrafts.zw" },
  { name: "Maputo Seafood", business: "Maputo Seafood Lda", city: "Maputo", country: "Mozambique", lat: -25.9692, lng: 32.5732, category: "Restaurant", domain: "Food & Beverage", desc: "Fruits de mer de l'océan Indien.", phone: "+258 21 123 4567", email: "info@maputoseafood.mz" },
  { name: "Antananarivo Vanilla", business: "Vanilla Madagascar", city: "Antananarivo", country: "Madagascar", lat: -18.8792, lng: 47.5079, category: "Épices", domain: "Agriculture", desc: "Vanille de Madagascar premium.", phone: "+261 20 123 4567", email: "info@vanillamada.mg" },
  { name: "Bamako Textiles", business: "Bamako Textiles SARL", city: "Bamako", country: "Mali", lat: 12.6392, lng: -8.0029, category: "Mode", domain: "Retail", desc: "Textiles traditionnels maliens.", phone: "+223 20 123 4567", email: "info@bamakotextiles.ml" },
  { name: "Ouagadougou Bronze", business: "Bronze Burkina", city: "Ouagadougou", country: "Burkina Faso", lat: 12.3714, lng: -1.5197, category: "Artisanat", domain: "Retail", desc: "Bronzes du Burkina Faso.", phone: "+226 25 123 4567", email: "info@bronzeburkina.bf" },
  { name: "Cotonou Market", business: "Marché Cotonou", city: "Cotonou", country: "Benin", lat: 6.3703, lng: 2.3912, category: "Alimentation", domain: "Retail", desc: "Marché coloré de Cotonou.", phone: "+229 21 123 4567", email: "info@marchecotonou.bj" },
  
  // OCÉANIE
  { name: "Melbourne Coffee", business: "Melbourne Coffee Co", city: "Melbourne", country: "Australia", lat: -37.8136, lng: 144.9631, category: "Café", domain: "Food & Beverage", desc: "Café de spécialité à Melbourne.", phone: "+61 3 1234 5678", email: "info@melbcoffee.au" },
  { name: "Brisbane Outdoor", business: "Brisbane Outdoor", city: "Brisbane", country: "Australia", lat: -27.4698, lng: 153.0251, category: "Sport", domain: "Retail", desc: "Équipement outdoor à Brisbane.", phone: "+61 7 1234 5678", email: "info@brisbaneoutdoor.au" },
  { name: "Wellington Books", business: "Wellington Books Ltd", city: "Wellington", country: "New Zealand", lat: -41.2865, lng: 174.7762, category: "Librairie", domain: "Retail", desc: "Librairie indépendante à Wellington.", phone: "+64 4 123 4567", email: "info@wellingtonbooks.nz" },
  { name: "Suva Market", business: "Suva Market Ltd", city: "Suva", country: "Fiji", lat: -18.1416, lng: 178.4419, category: "Alimentation", domain: "Retail", desc: "Marché de produits frais aux Fidji.", phone: "+679 123 4567", email: "info@suvamarket.fj" },
  
  // ASIE CENTRALE
  { name: "Almaty Bazaar", business: "Almaty Bazaar LLP", city: "Almaty", country: "Kazakhstan", lat: 43.2220, lng: 76.8512, category: "Alimentation", domain: "Retail", desc: "Bazar traditionnel kazakh.", phone: "+7 727 123 4567", email: "info@almatybazaar.kz" },
  { name: "Tashkent Silk", business: "Tashkent Silk Co", city: "Tashkent", country: "Uzbekistan", lat: 41.2995, lng: 69.2401, category: "Mode", domain: "Retail", desc: "Soie ouzbèke artisanale.", phone: "+998 71 123 4567", email: "info@tashkentsilk.uz" },
  { name: "Ulaanbaatar Cashmere", business: "Mongolian Cashmere", city: "Ulaanbaatar", country: "Mongolia", lat: 47.8864, lng: 106.9057, category: "Mode", domain: "Retail", desc: "Cachemire mongol de qualité.", phone: "+976 11 123 456", email: "info@mongoliacashmere.mn" }
];

// Modifier seedAllMerchants pour inclure EXTRA_MERCHANTS
function seedExtraMerchants(db) {
  try {
    const now = new Date().toISOString();
    const insert = db.prepare(`
      INSERT INTO merchant_listings (
        listing_uuid, owner_user_id, listing_public_name, profile_type,
        business_name, owner_display_name, public_description_short,
        domain, category, products_services_summary,
        country, city, latitude, longitude,
        phone_business, email_business, website_url,
        accepts_pi, pi_description,
        verification_status, verification_badge_public,
        consent_data_accuracy, consent_publication_rights, consent_third_party_rights,
        consent_terms, consent_privacy, consent_listing_policy,
        consent_public_display, consent_review_and_moderation,
        consent_legal_cooperation_notice, consent_timestamp,
        terms_version_accepted, privacy_version_accepted, listing_policy_version_accepted,
        listing_status, merchant_pi_payments_enabled, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let inserted = 0;
    for (const m of EXTRA_MERCHANTS) {
      const existing = db.prepare("SELECT id FROM merchant_listings WHERE listing_public_name = ?").get(m.name);
      if (existing) continue;

      const uid = "demo_" + uuidv4().slice(0, 8);
      insert.run(
        uuidv4(), uid, m.name, "business", m.business, m.name, m.desc,
        m.domain, m.category, m.desc, m.country, m.city, m.lat, m.lng,
        m.phone, m.email, null, 1, "Nous acceptons Pi Network !",
        "verified", "verified",
        1, 1, 1, 1, 1, 1, 1, 1, 1,
        now, "1.0", "1.0", "1.0",
        "approved", 1, now, now
      );
      inserted++;
    }

    console.log(`✅ ${inserted} marchands supplémentaires ajoutés`);
  } catch (err) {
    console.error("❌ Erreur seed extra marchands:", err.message);
  }
}

// Exporter les deux fonctions
module.exports = { seedMerchants: seedAllMerchants, seedExtraMerchants };
