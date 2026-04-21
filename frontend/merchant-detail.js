document.addEventListener("DOMContentLoaded", async () => {
  const detailStatus = document.getElementById("detailStatus");
  const merchantDetailCard = document.getElementById("merchantDetailCard");

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    detailStatus.textContent = "❌ No merchant id found in URL.";
    return;
  }

  detailStatus.textContent = "⏳ Loading merchant detail...";

  try {
    const response = await fetch(`http://localhost:3000/api/merchant-listings/detail/${id}`);
    const data = await response.json();

    if (!data.ok) {
      detailStatus.textContent = `❌ Error: ${data.error || "Unknown error"}`;
      return;
    }

    detailStatus.textContent = "✅ Merchant detail loaded.";
    merchantDetailCard.innerHTML = `
  <h2>General Information</h2>
  <p><strong>Public Name:</strong> ${data.listing.listing_public_name || "-"}</p>
  <p><strong>Business Name:</strong> ${data.listing.business_name || "-"}</p>
  <p><strong>Owner Name:</strong> ${data.listing.visibility_owner_name === "public" ? (data.listing.owner_display_name || "-") : "Hidden"}</p>
  <p><strong>Short Description:</strong> ${data.listing.public_description_short || "-"}</p>
  <p><strong>Products / Services:</strong> ${data.listing.products_services_summary || "-"}</p>
  <p><strong>Domain:</strong> ${data.listing.domain || "-"}</p>
  <p><strong>Category:</strong> ${data.listing.category || "-"}</p>
  <p><strong>City:</strong> ${data.listing.city || "-"}</p>
  <p><strong>District:</strong> ${data.listing.visibility_district === "public" ? (data.listing.district || "-") : "Hidden"}</p>
  <p><strong>Address:</strong> ${data.listing.visibility_address === "public" ? (data.listing.address_line_1 || "-") : "Hidden"}</p>
  <p><strong>Location Link:</strong> ${data.listing.visibility_location_link === "public" ? (data.listing.location_link || "-") : "Hidden"}</p>
  <p><strong>Country:</strong> ${data.listing.country || "-"}</p>
  <h2>Contact Information</h2>
  <p><strong>Phone:</strong> ${data.listing.visibility_phone === "public" ? (data.listing.phone_business || "-") : "Hidden"}</p>
  <p><strong>WhatsApp:</strong> ${data.listing.visibility_whatsapp === "public" ? (data.listing.whatsapp_business || "-") : "Hidden"}</p>
  <p><strong>Email:</strong> ${data.listing.visibility_email === "public" ? (data.listing.email_business || "-") : "Hidden"}</p>
  <p><strong>Website:</strong> ${data.listing.visibility_website === "public" ? (data.listing.website_url || "-") : "Hidden"}</p>
  <h2>Pi Information</h2>
  <p><strong>Accepts Pi:</strong> ${data.listing.accepts_pi ? "Yes" : "No"}</p>
  <p><strong>Pi Payments Enabled:</strong> ${data.listing.merchant_pi_payments_enabled ? "Yes" : "No"}</p>
  <p><strong>Merchant Pi Wallet:</strong> ${data.listing.visibility_wallet === "public" ? (data.listing.merchant_pi_wallet || "-") : "Hidden"}</p>
`;

merchantDetailCard.style.animation = "none";
merchantDetailCard.offsetHeight;
merchantDetailCard.style.animation = "fadeInUp 1s ease forwards";
  } catch (error) {
  detailStatus.textContent = `❌ Failed to load merchant detail: ${error.message}`;
}
});