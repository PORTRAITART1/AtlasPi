(function () {
  console.log("🔔 AtlasPi notifications.js chargé");

  function getUid() {
    const params = new URLSearchParams(window.location.search);

    return (
      params.get("uid") ||
      localStorage.getItem("pi_user_id") ||
      localStorage.getItem("pi_uid") ||
      localStorage.getItem("uid") ||
      localStorage.getItem("user_uid") ||
      ""
    );
  }

  function displayNotificationUid(uid) {
    if (!uid) return;
  
    // Sauvegarde pour debug
    window.atlasPiNotificationUid = uid;
    localStorage.setItem("atlaspi_last_notification_uid", uid);
  
    const panel =
      document.getElementById("notification-panel") ||
      document.querySelector(".notification-panel") ||
      document.querySelector("#notifications-panel");
  
    if (!panel) return;
  
    let uidBox = document.getElementById("notification-uid-debug");
  
    if (!uidBox) {
      uidBox = document.createElement("div");
      uidBox.id = "notification-uid-debug";
      uidBox.style.padding = "8px";
      uidBox.style.marginBottom = "8px";
      uidBox.style.fontSize = "12px";
      uidBox.style.background = "#f3f4f6";
      uidBox.style.border = "1px solid #ddd";
      uidBox.style.borderRadius = "8px";
      uidBox.style.color = "#333";
      uidBox.style.wordBreak = "break-all";
  
      panel.prepend(uidBox);
    }
  
    uidBox.innerHTML = `UID notifications : <code>${uid}</code>`;
  }

  async function ensurePiUid() {
    const existingUid = getUid();
    if (existingUid) return existingUid;

    try {
      if (!window.Pi || !window.Pi.authenticate) {
        console.warn("⚠️ Pi SDK indisponible pour récupérer UID");
        return "";
      }

      const scopes = ["username"];
      const auth = await window.Pi.authenticate(scopes, function(payment) {
        console.log("Paiement incomplet Pi:", payment);
      });

      const uid =
        auth?.user?.uid ||
        auth?.user?.id ||
        auth?.user?.username ||
        "";

      if (uid) {
        localStorage.setItem("pi_user_id", uid);
        localStorage.setItem("pi_uid", uid);
        console.log("✅ UID Pi récupéré:", uid);
      }

      return uid;
    } catch (err) {
      console.error("❌ Impossible de récupérer UID Pi:", err);
      return "";
    }
  }

  function createBell() {
    if (document.getElementById("atlaspi-notification-bell")) {
      return;
    }

    const bell = document.createElement("div");
    bell.id = "atlaspi-notification-bell";

    bell.innerHTML = `
      <div id="atlaspi-bell-icon">🔔</div>
      <div id="atlaspi-bell-count">0</div>
    `;

    bell.style.position = "fixed";
    bell.style.top = "18px";
    bell.style.right = "78px";
    bell.style.width = "54px";
    bell.style.height = "54px";
    bell.style.borderRadius = "50%";
    bell.style.background = "#ffffff";
    bell.style.boxShadow = "0 4px 14px rgba(0,0,0,0.25)";
    bell.style.zIndex = "9999";
    bell.style.display = "flex";
    bell.style.alignItems = "center";
    bell.style.justifyContent = "center";
    bell.style.cursor = "pointer";
    bell.style.fontSize = "28px";

    const style = document.createElement("style");
    style.innerHTML = `
      #atlaspi-bell-count {
        position: absolute;
        top: -6px;
        right: -6px;
        min-width: 22px;
        height: 22px;
        padding: 0 5px;
        border-radius: 999px;
        background: #e60023;
        color: white;
        font-size: 13px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: Arial, sans-serif;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(bell);

    const panel = document.createElement("div");
    panel.id = "atlaspi-notification-panel";
    panel.innerHTML = "<strong>Notifications</strong><br><div id='atlaspi-notification-list'>Chargement...</div>";
    panel.style.position = "fixed";
    panel.style.top = "82px";
    panel.style.right = "18px";
    panel.style.width = "300px";
    panel.style.maxHeight = "420px";
    panel.style.overflowY = "auto";
    panel.style.background = "#ffffff";
    panel.style.color = "#111111";
    panel.style.borderRadius = "12px";
    panel.style.boxShadow = "0 6px 20px rgba(0,0,0,0.25)";
    panel.style.zIndex = "999998";
    panel.style.padding = "14px";
    panel.style.fontFamily = "Arial, sans-serif";
    panel.style.fontSize = "14px";
    panel.style.display = "none";
    document.body.appendChild(panel);

    bell.onclick = async function () {
      const panel = document.getElementById("atlaspi-notification-panel");
      if (!panel) return;

      panel.style.display = panel.style.display === "block" ? "none" : "block";

      if (panel.style.display === "block") {
        await loadNotifications();
        await markAllNotificationsRead();
        await updateCount();
      }
    };

    console.log("✅ Cloche notifications ajoutée");
  }

  async function updateCount() {
    const uid = await ensurePiUid();
    displayNotificationUid(uid);
    const countEl = document.getElementById("atlaspi-bell-count");

    if (!countEl) return;

    if (!uid) {
      console.warn("⚠️ UID notifications absent");
      countEl.style.display = "none";
      return;
    }

    try {
      const url = `https://atlaspi-backend.onrender.com/api/notifications/unread-count?uid=${encodeURIComponent(uid)}`;
      console.log("🔎 Fetch notifications:", url);

      const res = await fetch(url, {
        method: "GET",
        cache: "no-store"
      });

      const data = await res.json();
      console.log("📩 Notifications response:", data);

      const count = Number(data.count || 0);
      countEl.textContent = count;

      if (count <= 0) {
        countEl.style.display = "none";
      } else {
        countEl.style.display = "flex";
      }
    } catch (err) {
      console.error("❌ Erreur notifications:", err);
      countEl.textContent = "!";
      countEl.style.display = "flex";
    }
  }


  async function loadNotifications() {
    const uid = await ensurePiUid();
    displayNotificationUid(uid);
    const listEl = document.getElementById("atlaspi-notification-list");

    if (!listEl) return;

    if (!uid) {
      console.warn("⚠️ UID notifications absent pour la liste");
      listEl.innerHTML = "<div style='margin-top:10px;color:#e60023;'>Connecte-toi avec Pi Browser pour voir tes notifications.</div>";
      return;
    }

    listEl.innerHTML = "Chargement...";

    try {
      const url = `https://atlaspi-backend.onrender.com/api/notifications/${encodeURIComponent(uid)}`;
      console.log("Fetch notification list:", url);

      const res = await fetch(url, {
        method: "GET",
        cache: "no-store"
      });

      const data = await res.json();
      console.log("Notification list response:", data);

      const notifications = Array.isArray(data) ? data : (data.notifications || data.data || []);

      if (!notifications.length) {
        listEl.innerHTML = "<div style='margin-top:10px;color:#666;'>Aucune notification</div>";
        return;
      }

      listEl.innerHTML = notifications.map(function (n) {
        const title = n.title || "Notification";
        const message = n.message || "";
        const created = n.created_at || n.createdAt || "";

        return `
          <div style="border-top:1px solid #eee;padding:10px 0;">
            <div style="font-weight:bold;">${title}</div>
            <div style="margin-top:4px;">${message}</div>
            <div style="margin-top:6px;font-size:12px;color:#777;">${created}</div>
          </div>
        `;
      }).join("");
    } catch (err) {
      console.error("Erreur liste notifications:", err);
      listEl.innerHTML = "<div style='margin-top:10px;color:#e60023;'>Erreur de chargement</div>";
    }
  }

  async function markAllNotificationsRead() {
    const uid = await ensurePiUid();
    displayNotificationUid(uid);

    if (!uid) {
      console.warn("⚠️ UID notifications absent pour mark read");
      return;
    }
  
    try {
      const url = `https://atlaspi-backend.onrender.com/api/notifications/${encodeURIComponent(uid)}/read-all`;
      console.log("✅ Mark all notifications as read:", url);
  
      await fetch(url, {
        method: "PUT",
        cache: "no-store"
      });
    } catch (err) {
      console.error("❌ Erreur mark notifications read:", err);
    }
  }
  function init() {
    createBell();
    updateCount();

    setInterval(updateCount, 30000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
