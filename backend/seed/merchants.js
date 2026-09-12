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
