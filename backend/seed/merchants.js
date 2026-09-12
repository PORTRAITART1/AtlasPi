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
