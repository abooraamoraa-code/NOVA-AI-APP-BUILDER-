/* =========================================================
   NOVA ADMIN — ADMIN.JS
   نظام لوحة الإدارة
========================================================= */

(function () {
  "use strict";

  /* =======================================================
     STATE
  ======================================================= */

  const state = {
    currentSection: "overview",
    currentUser: null,
    currentProfile: null,
    projects: [],
    users: [],
    products: [],
    aiRequests: [],
    orders: [],
    complaints: [],
    logs: [],
    announcements: [],
    initialized: false
  };


  /* =======================================================
     HELPERS
  ======================================================= */

  const $ = (selector) => document.querySelector(selector);

  const $$ = (selector) => {
    return Array.from(document.querySelectorAll(selector));
  };


  function escapeHTML(value) {
    if (value === null || value === undefined) {
      return "";
    }

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }


  function formatDate(date) {
    if (!date) {
      return "غير معروف";
    }

    try {
      return new Date(date).toLocaleString("ar", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (error) {
      return "غير معروف";
    }
  }


  function getInitials(text) {
    if (!text) {
      return "N";
    }

    const clean = String(text).trim();

    if (!clean) {
      return "N";
    }

    return clean.charAt(0).toUpperCase();
  }


  function safeNumber(value) {
    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : 0;
  }


  /* =======================================================
     TOAST
  ======================================================= */

  let toastTimer = null;


  function showToast(message, type = "success") {
    const toast = $("#toast");
    const toastMessage = $("#toastMessage");
    const toastIcon = $("#toastIcon");

    if (!toast) {
      return;
    }

    if (toastMessage) {
      toastMessage.textContent = message;
    }

    if (toastIcon) {
      toastIcon.textContent =
        type === "error"
          ? "!"
          : type === "warning"
          ? "!"
          : "✓";
    }

    toast.classList.remove(
      "success",
      "error",
      "warning"
    );

    toast.classList.add(type);
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 3500);
  }


  /* =======================================================
     MODAL
  ======================================================= */

  function openModal(content) {
    const overlay = $("#modalOverlay");
    const modalContent = $("#modalContent");

    if (!overlay || !modalContent) {
      return;
    }

    modalContent.innerHTML = content;

    overlay.classList.remove("hidden");

    document.body.style.overflow = "hidden";
  }


  function closeModal() {
    const overlay = $("#modalOverlay");

    if (!overlay) {
      return;
    }

    overlay.classList.add("hidden");

    document.body.style.overflow = "";
  }


  /* =======================================================
     SIDEBAR
  ======================================================= */

  function openSidebar() {
    const sidebar = $("#sidebar");
    const overlay = $("#sidebarOverlay");

    sidebar?.classList.add("open");
    overlay?.classList.add("show");
  }


  function closeSidebar() {
    const sidebar = $("#sidebar");
    const overlay = $("#sidebarOverlay");

    sidebar?.classList.remove("open");
    overlay?.classList.remove("show");
  }


  /* =======================================================
     SECTION INFORMATION
  ======================================================= */

  const sectionInfo = {
    overview: {
      title: "لوحة الإدارة",
      description: "إدارة منصة NOVA بالكامل"
    },

    users: {
      title: "المستخدمون",
      description: "إدارة حسابات مستخدمي NOVA"
    },

    projects: {
      title: "المشاريع",
      description: "إدارة المشاريع التي ينشئها المستخدمون"
    },

    products: {
      title: "المنتجات والنسخ",
      description: "إدارة النسخ المجانية والمدفوعة"
    },

    ai: {
      title: "طلبات الذكاء الاصطناعي",
      description: "مراقبة عمليات توليد التطبيقات"
    },

    orders: {
      title: "الطلبات والمدفوعات",
      description: "إدارة عمليات شراء المنتجات"
    },

    support: {
      title: "الدعم",
      description: "إدارة وسائل وروابط الدعم"
    },

    complaints: {
      title: "الشكاوى",
      description: "متابعة شكاوى المستخدمين"
    },

    content: {
      title: "محتوى الصفحات",
      description: "إدارة محتوى صفحات NOVA"
    },

    announcements: {
      title: "الإعلانات والعروض",
      description: "إدارة الإعلانات والعروض"
    },

    settings: {
      title: "إعدادات المنصة",
      description: "التحكم بالإعدادات العامة"
    },

    logs: {
      title: "سجل العمليات",
      description: "سجل العمليات المهمة في المنصة"
    }
  };


  /* =======================================================
     NAVIGATION
  ======================================================= */

  function switchSection(sectionName) {
    if (!sectionInfo[sectionName]) {
      return;
    }

    state.currentSection = sectionName;

    $$(".admin-section").forEach((section) => {
      section.classList.remove("active-section");
    });

    const target = $(`#section-${sectionName}`);

    if (target) {
      target.classList.add("active-section");
    }

    $$(".nav-item").forEach((item) => {
      item.classList.remove("active");

      if (item.dataset.section === sectionName) {
        item.classList.add("active");
      }
    });

    const info = sectionInfo[sectionName];

    const title = $("#pageTitle");
    const description = $("#pageDescription");

    if (title) {
      title.textContent = info.title;
    }

    if (description) {
      description.textContent = info.description;
    }

    closeSidebar();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

    loadSectionData(sectionName);
  }


  /* =======================================================
     SUPABASE CHECK
  ======================================================= */

  function getSupabase() {
    if (window.NOVA_SUPABASE) {
      return window.NOVA_SUPABASE;
    }

    if (window.supabaseClient) {
      return window.supabaseClient;
    }

    return null;
  }


  /* =======================================================
     AUTH
  ======================================================= */

  async function getCurrentUser() {
    try {
      if (
        window.NOVA_AUTH &&
        typeof window.NOVA_AUTH.getUser === "function"
      ) {
        return await window.NOVA_AUTH.getUser();
      }
    } catch (error) {
      console.error(
        "NOVA admin auth error:",
        error
      );
    }

    try {
      const client = getSupabase();

      if (!client) {
        return null;
      }

      const result =
        await client.auth.getUser();

      return result?.data?.user || null;

    } catch (error) {
      console.error(error);

      return null;
    }
  }


  async function getProfile(userId) {
    try {
      if (
        window.NOVA_DB &&
        typeof window.NOVA_DB.getProfile === "function"
      ) {
        return await window.NOVA_DB.getProfile(userId);
      }
    } catch (error) {
      console.error(
        "Profile loading error:",
        error
      );
    }

    try {
      const client = getSupabase();

      if (!client || !userId) {
        return null;
      }

      const result =
        await client
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

      if (result.error) {
        console.error(result.error);
        return null;
      }

      return result.data;

    } catch (error) {
      console.error(error);

      return null;
    }
  }


  /* =======================================================
     ADMIN SECURITY
  ======================================================= */

  function isAdmin(profile) {
    if (!profile) {
      return false;
    }

    const role = String(
      profile.role || ""
    ).toLowerCase();

    return role === "admin" ||
           role === "administrator" ||
           role === "super_admin";
  }


  async function protectAdmin() {
    state.currentUser =
      await getCurrentUser();

    if (!state.currentUser) {
      redirectToLogin(
        "يجب تسجيل الدخول أولًا."
      );

      return false;
    }

    state.currentProfile =
      await getProfile(
        state.currentUser.id
      );

    if (!isAdmin(state.currentProfile)) {
      showAccessDenied();

      return false;
    }

    return true;
  }


  function redirectToLogin(message) {
    if (message) {
      console.warn(message);
    }

    const loginUrl =
      "login.html?redirect=admin.html";

    window.location.href = loginUrl;
  }


  function showAccessDenied() {
    const loading =
      $("#loadingScreen");

    if (loading) {
      loading.innerHTML = `
        <div class="loading-box">

          <div style="
            font-size:55px;
            margin-bottom:15px;
          ">
            🔒
          </div>

          <h2>
            لا يوجد لديك صلاحية
          </h2>

          <p style="
            margin:15px 0;
          ">
            هذه الصفحة مخصصة لمدير المنصة فقط.
          </p>

          <button
            type="button"
            class="primary-button"
            onclick="window.location.href='index.html'">

            العودة إلى الرئيسية

          </button>

        </div>
      `;
    }
  }


  /* =======================================================
     ADMIN PROFILE UI
  ======================================================= */

  function renderAdminProfile() {
    const user = state.currentUser;
    const profile = state.currentProfile;

    const email =
      user?.email ||
      profile?.email ||
      "admin";

    const name =
      profile?.full_name ||
      profile?.name ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      "مدير NOVA";

    const nameElement =
      $("#adminName");

    const emailElement =
      $("#adminEmail");

    const avatar =
      $("#adminAvatar");

    if (nameElement) {
      nameElement.textContent = name;
    }

    if (emailElement) {
      emailElement.textContent = email;
    }

    if (avatar) {
      avatar.textContent =
        getInitials(name);
    }
  }


  /* =======================================================
     DASHBOARD VISIBILITY
  ======================================================= */

  function showDashboard() {
    const loading =
      $("#loadingScreen");

    const dashboard =
      $("#dashboard");

    loading?.classList.add("hidden");

    dashboard?.classList.remove("hidden");
  }


  /* =======================================================
     DATABASE HELPERS
  ======================================================= */

  async function fetchTable(
    tableName,
    columns = "*",
    limit = 100
  ) {
    const client = getSupabase();

    if (!client) {
      return [];
    }

    try {
      const result =
        await client
          .from(tableName)
          .select(columns)
          .limit(limit);

      if (result.error) {
        console.error(
          `Error loading ${tableName}:`,
          result.error
        );

        return [];
      }

      return result.data || [];

    } catch (error) {
      console.error(error);

      return [];
    }
  }


  /* =======================================================
     LOAD DASHBOARD DATA
  ======================================================= */

  async function loadDashboardData() {
    await Promise.all([
      loadProjects(),
      loadAIRequests(),
      loadOrders(),
      loadLogs()
    ]);

    updateStatistics();

    renderRecentProjects();

    renderRecentLogs();
  }


  /* =======================================================
     PROJECTS
  ======================================================= */

  async function loadProjects() {
    try {
      if (
        window.NOVA_DB &&
        typeof window.NOVA_DB.getProjects === "function"
      ) {
        const result =
          await window.NOVA_DB.getProjects();

        state.projects =
          Array.isArray(result)
            ? result
            : result?.data || [];

        return;
      }
    } catch (error) {
      console.error(
        "Projects error:",
        error
      );
    }

    state.projects =
      await fetchTable(
        "projects",
        "*",
        200
      );
  }


  function renderRecentProjects() {
    const container =
      $("#recentProjects");

    if (!container) {
      return;
    }

    if (!state.projects.length) {
      container.innerHTML = `
        <div class="empty-state">
          لا توجد مشاريع لعرضها حاليًا.
        </div>
      `;

      return;
    }

    const items =
      state.projects
        .slice(0, 5)
        .map((project) => {

          const name =
            project.name ||
            project.title ||
            "مشروع بدون اسم";

          return `
            <div class="activity-item">

              <div class="activity-icon">
                📁
              </div>

              <div class="activity-info">

                <strong>
                  ${escapeHTML(name)}
                </strong>

                <span>
                  ${formatDate(
                    project.created_at ||
                    project.updated_at
                  )}
                </span>

              </div>

            </div>
          `;

        })
        .join("");

    container.innerHTML = items;
  }


  function renderProjects() {
    const grid =
      $("#projectsGrid");

    if (!grid) {
      return;
    }

    if (!state.projects.length) {
      grid.innerHTML = `
        <div class="empty-state large">
          لا توجد مشاريع حاليًا.
        </div>
      `;

      return;
    }

    grid.innerHTML =
      state.projects.map((project) => {

        const name =
          project.name ||
          project.title ||
          "مشروع بدون اسم";

        const description =
          project.description ||
          "لا يوجد وصف للمشروع.";

        const status =
          project.status ||
          "draft";

        let badgeClass =
          "badge-warning";

        let statusText =
          "مسودة";

        if (status === "active") {
          badgeClass = "badge-success";
          statusText = "نشط";
        }

        if (status === "archived") {
          badgeClass = "badge-danger";
          statusText = "مؤرشف";
        }

        return `
          <article class="project-card">

            <div class="card-top">

              <div class="card-icon">
                📁
              </div>

              <span class="badge ${badgeClass}">
                ${statusText}
              </span>

            </div>

            <h3 class="card-title">
              ${escapeHTML(name)}
            </h3>

            <p class="card-description">
              ${escapeHTML(description)}
            </p>

            <div class="card-meta">

              <span>
                ${escapeHTML(
                  project.framework ||
                  "غير محدد"
                )}
              </span>

              <span>
                ${formatDate(
                  project.updated_at ||
                  project.created_at
                )}
              </span>

            </div>

            <div class="card-actions">

              <button
                type="button"
                class="secondary-button"
                data-project-action="view"
                data-project-id="${escapeHTML(
                  project.id
                )}">

                عرض

              </button>

              <button
                type="button"
                class="secondary-button"
                data-project-action="delete"
                data-project-id="${escapeHTML(
                  project.id
                )}">

                حذف

              </button>

            </div>

          </article>
        `;

      }).join("");
  }


  /* =======================================================
     AI REQUESTS
  ======================================================= */

  async function loadAIRequests() {
    state.aiRequests =
      await fetchTable(
        "ai_requests",
        "*",
        200
      );
  }


  function renderAIRequests() {
    const table =
      $("#aiTable");

    if (!table) {
      return;
    }

    if (!state.aiRequests.length) {
      table.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="empty-state">
              لا توجد طلبات حاليًا.
            </div>
          </td>
        </tr>
      `;

      updateAIStats();

      return;
    }

    table.innerHTML =
      state.aiRequests.map((request) => {

        const status =
          String(
            request.status || "pending"
          ).toLowerCase();

        let badge =
          "badge-warning";

        let statusText =
          "قيد الانتظار";

        if (
          status === "completed" ||
          status === "success"
        ) {
          badge = "badge-success";
          statusText = "مكتمل";
        }

        if (
          status === "failed" ||
          status === "error"
        ) {
          badge = "badge-danger";
          statusText = "فشل";
        }

        if (
          status === "processing"
        ) {
          badge = "badge-info";
          statusText = "قيد التنفيذ";
        }

        return `
          <tr>

            <td>
              ${escapeHTML(
                request.prompt ||
                "طلب AI"
              ).slice(0, 80)}
            </td>

            <td>
              ${escapeHTML(
                request.user_id ||
                "غير معروف"
              )}
            </td>

            <td>
              ${escapeHTML(
                request.provider ||
                "غير محدد"
              )}
            </td>

            <td>
              <span class="badge ${badge}">
                ${statusText}
              </span>
            </td>

            <td>
              ${formatDate(
                request.created_at ||
                request.updated_at
              )}
            </td>

          </tr>
        `;

      }).join("");

    updateAIStats();
  }


  function updateAIStats() {
    const total =
      state.aiRequests.length;

    const pending =
      state.aiRequests.filter((item) => {

        const status =
          String(
            item.status || "pending"
          ).toLowerCase();

        return (
          status === "pending" ||
          status === "processing"
        );

      }).length;

    const completed =
      state.aiRequests.filter((item) => {

        const status =
          String(
            item.status || ""
          ).toLowerCase();

        return (
          status === "completed" ||
          status === "success"
        );

      }).length;

    const failed =
      state.aiRequests.filter((item) => {

        const status =
          String(
            item.status || ""
          ).toLowerCase();

        return (
          status === "failed" ||
          status === "error"
        );

      }).length;

    $("#aiTotal") &&
      ($("#aiTotal").textContent = total);

    $("#aiPending") &&
      ($("#aiPending").textContent = pending);

    $("#aiCompleted") &&
      ($("#aiCompleted").textContent = completed);

    $("#aiFailed") &&
      ($("#aiFailed").textContent = failed);
  }


  /* =======================================================
     ORDERS
  ======================================================= */

  async function loadOrders() {
    state.orders =
      await fetchTable(
        "orders",
        "*",
        200
      );
  }


  function renderOrders() {
    const table =
      $("#ordersTable");

    if (!table) {
      return;
    }

    if (!state.orders.length) {
      table.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="empty-state">
              لا توجد طلبات حتى الآن.
            </div>
          </td>
        </tr>
      `;

      return;
    }

    table.innerHTML =
      state.orders.map((order) => {

        const status =
          String(
            order.status || "pending"
          ).toLowerCase();

        let badge =
          "badge-warning";

        let text =
          "قيد الانتظار";

        if (
          status === "paid" ||
          status === "completed"
        ) {
          badge = "badge-success";
          text = "مكتمل";
        }

        if (
          status === "cancelled" ||
          status === "failed"
        ) {
          badge = "badge-danger";
          text = "ملغي";
        }

        return `
          <tr>

            <td>
              ${escapeHTML(
                order.id || "-"
              )}
            </td>

            <td>
              ${escapeHTML(
                order.user_id || "-"
              )}
            </td>

            <td>
              ${escapeHTML(
                order.product_id ||
                order.project_id ||
                "-"
              )}
            </td>

            <td>
              ${safeNumber(
                order.amount
              )}
              ${escapeHTML(
                order.currency || ""
              )}
            </td>

            <td>
              <span class="badge ${badge}">
                ${text}
              </span>
            </td>

            <td>
              ${formatDate(
                order.created_at
              )}
            </td>

          </tr>
        `;

      }).join("");
  }


  /* =======================================================
     LOGS
  ======================================================= */

  async function loadLogs() {
    state.logs =
      await fetchTable(
        "system_logs",
        "*",
        200
      );
  }


  function renderRecentLogs() {
    const container =
      $("#recentLogs");

    if (!container) {
      return;
    }

    if (!state.logs.length) {
      container.innerHTML = `
        <div class="empty-state">
          لا توجد أنشطة لعرضها حاليًا.
        </div>
      `;

      return;
    }

    container.innerHTML =
      state.logs
        .slice(0, 5)
        .map((log) => {

          return `
            <div class="activity-item">

              <div class="activity-icon">
                📜
              </div>

              <div class="activity-info">

                <strong>
                  ${escapeHTML(
                    log.action ||
                    log.event ||
                    "عملية"
                  )}
                </strong>

                <span>
                  ${formatDate(
                    log.created_at ||
                    log.updated_at
                  )}
                </span>

              </div>

            </div>
          `;

        })
        .join("");
  }


  function renderLogs() {
    const table =
      $("#logsTable");

    if (!table) {
      return;
    }

    if (!state.logs.length) {
      table.innerHTML = `
        <tr>
          <td colspan="4">
            <div class="empty-state">
              لا توجد عمليات مسجلة حاليًا.
            </div>
          </td>
        </tr>
      `;

      return;
    }

    table.innerHTML =
      state.logs.map((log) => {

        return `
          <tr>

            <td>
              ${escapeHTML(
                log.action ||
                log.event ||
                "عملية"
              )}
            </td>

            <td>
              ${escapeHTML(
                log.user_id ||
                "-"
              )}
            </td>

            <td>
              ${escapeHTML(
                log.details ||
                log.message ||
                "-"
              )}
            </td>

            <td>
              ${formatDate(
                log.created_at ||
                log.updated_at
              )}
            </td>

          </tr>
        `;

      }).join("");
  }


  /* =======================================================
     USERS
  ======================================================= */

  async function loadUsers() {
    state.users =
      await fetchTable(
        "profiles",
        "*",
        300
      );
  }


  function renderUsers() {
    const table =
      $("#usersTable");

    if (!table) {
      return;
    }

    const search =
      String(
        $("#userSearch")?.value || ""
      )
        .trim()
        .toLowerCase();

    const role =
      $("#userRoleFilter")?.value ||
      "all";

    let users =
      state.users.filter((user) => {

        const text = [
          user.full_name,
          user.name,
          user.email,
          user.id
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          !search ||
          text.includes(search);

        const userRole =
          String(
            user.role || "user"
          ).toLowerCase();

        const matchesRole =
          role === "all" ||
          userRole === role;

        return (
          matchesSearch &&
          matchesRole
        );
      });


    if (!users.length) {
      table.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="empty-state">
              لا يوجد مستخدمون مطابقون.
            </div>
          </td>
        </tr>
      `;

      return;
    }


    table.innerHTML =
      users.map((user) => {

        const name =
          user.full_name ||
          user.name ||
          "مستخدم";

        const userRole =
          String(
            user.role || "user"
          ).toLowerCase();

        const badge =
          userRole === "admin"
            ? "badge-primary"
            : "badge-info";

        return `
          <tr>

            <td>
              <strong>
                ${escapeHTML(name)}
              </strong>
            </td>

            <td>
              ${escapeHTML(
                user.email || "-"
              )}
            </td>

            <td>
              <span class="badge ${badge}">
                ${escapeHTML(userRole)}
              </span>
            </td>

            <td>
              ${formatDate(
                user.created_at
              )}
            </td>

            <td>

              <button
                type="button"
                class="secondary-button"
                data-user-id="${escapeHTML(
                  user.id
                )}">

                عرض

              </button>

            </td>

          </tr>
        `;

      }).join("");
  }


  /* =======================================================
     PRODUCTS
  ======================================================= */

  async function loadProducts() {
    /*
      المنتجات ستستخدم جدولًا مخصصًا في المرحلة القادمة.

      لا ننشئ جدولًا عشوائيًا الآن حتى لا نكسر
      قاعدة البيانات الحالية.

      عند إضافة جدول المنتجات سنربطه هنا.
    */

    state.products = [];
  }


  function renderProducts() {
    const grid =
      $("#productsGrid");

    if (!grid) {
      return;
    }

    if (!state.products.length) {
      grid.innerHTML = `
        <div class="empty-state large">

          لا توجد منتجات حتى الآن.

          <br>

          استخدم زر
          «إضافة منتج»
          لإنشاء منتج جديد.

        </div>
      `;

      return;
    }

    grid.innerHTML =
      state.products.map((product) => {

        return `
          <article class="product-card">

            <div class="card-top">

              <div class="card-icon">
                💎
              </div>

              <span class="badge badge-primary">
                ${escapeHTML(
                  product.type ||
                  "منتج"
                )}
              </span>

            </div>

            <h3 class="card-title">
              ${escapeHTML(
                product.name ||
                "منتج"
              )}
            </h3>

            <p class="card-description">
              ${escapeHTML(
                product.description ||
                ""
              )}
            </p>

            <div class="card-meta">

              <span>
                ${safeNumber(
                  product.price
                )}
                ${escapeHTML(
                  product.currency ||
                  ""
                )}
              </span>

              <span>
                ${product.paid
                  ? "مدفوع"
                  : "مجاني"}
              </span>

            </div>

          </article>
        `;

      }).join("");
  }


  /* =======================================================
     COMPLAINTS
  ======================================================= */

  async function loadComplaints() {
    state.complaints =
      await fetchTable(
        "complaints",
        "*",
        200
      );
  }


  function renderComplaints() {
    const container =
      $("#complaintsList");

    if (!container) {
      return;
    }

    const filter =
      $("#complaintFilter")?.value ||
      "all";

    let complaints =
      state.complaints.filter((item) => {

        if (filter === "all") {
          return true;
        }

        return String(
          item.status || "new"
        ).toLowerCase() === filter;

      });


    if (!complaints.length) {
      container.innerHTML = `
        <div class="empty-state large">
          لا توجد شكاوى مطابقة.
        </div>
      `;

      return;
    }


    container.innerHTML =
      complaints.map((complaint) => {

        return `
          <article class="complaint-card">

            <div class="complaint-header">

              <strong>
                ${escapeHTML(
                  complaint.subject ||
                  "شكوى"
                )}
              </strong>

              <span class="badge badge-warning">
                ${escapeHTML(
                  complaint.status ||
                  "new"
                )}
              </span>

            </div>

            <p>
              ${escapeHTML(
                complaint.message ||
                complaint.description ||
                "لا توجد تفاصيل."
              )}
            </p>

            <div class="card-meta">

              <span>
                المستخدم:
                ${escapeHTML(
                  complaint.user_id ||
                  "-"
                )}
              </span>

              <span>
                ${formatDate(
                  complaint.created_at
                )}
              </span>

            </div>

          </article>
        `;

      }).join("");
  }


  /* =======================================================
     ANNOUNCEMENTS
  ======================================================= */

  async function loadAnnouncements() {
    state.announcements = [];
  }


  function renderAnnouncements() {
    const grid =
      $("#announcementsGrid");

    if (!grid) {
      return;
    }

    if (!state.announcements.length) {
      grid.innerHTML = `
        <div class="empty-state large">
          لا توجد إعلانات حاليًا.
        </div>
      `;

      return;
    }

    grid.innerHTML =
      state.announcements.map((item) => {

        return `
          <article class="announcement-card">

            <div class="card-top">

              <div class="card-icon">
                📢
              </div>

              <span class="badge badge-info">
                ${escapeHTML(
                  item.status ||
                  "منشور"
                )}
              </span>

            </div>

            <h3 class="card-title">
              ${escapeHTML(
                item.title ||
                "إعلان"
              )}
            </h3>

            <p class="card-description">
              ${escapeHTML(
                item.description ||
                item.body ||
                ""
              )}
            </p>

          </article>
        `;

      }).join("");
  }


  /* =======================================================
     SUPPORT
  ======================================================= */

  async function loadSupportSettings() {
    const client =
      getSupabase();

    if (!client) {
      return;
    }

    try {
      const result =
        await client
          .from("support_settings")
          .select("*")
          .limit(1)
          .maybeSingle();

      if (result.error) {
        console.warn(
          "Support settings:",
          result.error
        );

        return;
      }

      const data =
        result.data;

      if (!data) {
        return;
      }

      if ($("#supportTitle")) {
        $("#supportTitle").value =
          data.title || "";
      }

      if ($("#supportText")) {
        $("#supportText").value =
          data.description ||
          data.text ||
          "";
      }

      if ($("#supportUrl")) {
        $("#supportUrl").value =
          data.support_url ||
          data.url ||
          "";
      }

      if ($("#supportQr")) {
        $("#supportQr").value =
          data.qr_url ||
          data.qr_image ||
          "";
      }

      updateSupportPreview();

    } catch (error) {
      console.error(error);
    }
  }


  function updateSupportPreview() {
    const title =
      $("#supportTitle")?.value ||
      "دعم NOVA";

    const text =
      $("#supportText")?.value ||
      "شكرًا لدعمك للمشروع.";

    const url =
      $("#supportUrl")?.value ||
      "#";

    if ($("#supportPreviewTitle")) {
      $("#supportPreviewTitle")
        .textContent = title;
    }

    if ($("#supportPreviewText")) {
      $("#supportPreviewText")
        .textContent = text;
    }

    if ($("#supportPreviewLink")) {
      $("#supportPreviewLink")
        .href = url;
    }
  }


  async function saveSupportSettings() {
    const client =
      getSupabase();

    if (!client) {
      showToast(
        "لم يتم الاتصال بقاعدة البيانات.",
        "error"
      );

      return;
    }

    const data = {
      title:
        $("#supportTitle")?.value ||
        "دعم NOVA",

      description:
        $("#supportText")?.value ||
        "",

      support_url:
        $("#supportUrl")?.value ||
        "",

      qr_url:
        $("#supportQr")?.value ||
        ""
    };

    try {

      const existing =
        await client
          .from("support_settings")
          .select("id")
          .limit(1)
          .maybeSingle();

      let result;

      if (existing.data?.id) {

        result =
          await client
            .from("support_settings")
            .update(data)
            .eq(
              "id",
              existing.data.id
            );

      } else {

        result =
          await client
            .from("support_settings")
            .insert(data);
      }

      if (result.error) {
        throw result.error;
      }

      updateSupportPreview();

      showToast(
        "تم حفظ إعدادات الدعم."
      );

    } catch (error) {

      console.error(error);

      showToast(
        "تعذر حفظ إعدادات الدعم.",
        "error"
      );
    }
  }


  /* =======================================================
     STATISTICS
  ======================================================= */

  function updateStatistics() {
    const users =
      state.users.length;

    const projects =
      state.projects.length;

    const ai =
      state.aiRequests.length;

    const orders =
      state.orders.length;

    if ($("#statUsers")) {
      $("#statUsers").textContent =
        users;
    }

    if ($("#statProjects")) {
      $("#statProjects").textContent =
        projects;
    }

    if ($("#statAI")) {
      $("#statAI").textContent =
        ai;
    }

    if ($("#statOrders")) {
      $("#statOrders").textContent =
        orders;
    }
  }


  /* =======================================================
     LOAD SECTION DATA
  ======================================================= */

  async function loadSectionData(section) {

    try {

      if (section === "overview") {

        await loadDashboardData();

      }

      if (section === "users") {

        await loadUsers();

        renderUsers();

        updateStatistics();

      }

      if (section === "projects") {

        await loadProjects();

        renderProjects();

        updateStatistics();

      }

      if (section === "products") {

        await loadProducts();

        renderProducts();

      }

      if (section === "ai") {

        await loadAIRequests();

        renderAIRequests();

        updateStatistics();

      }

      if (section === "orders") {

        await loadOrders();

        renderOrders();

        updateStatistics();

      }

      if (section === "support") {

        await loadSupportSettings();

      }

      if (section === "complaints") {

        await loadComplaints();

        renderComplaints();

      }

      if (section === "announcements") {

        await loadAnnouncements();

        renderAnnouncements();

      }

      if (section === "logs") {

        await loadLogs();

        renderLogs();

      }

    } catch (error) {

      console.error(
        "Section loading error:",
        error
      );

      showToast(
        "حدث خطأ أثناء تحميل البيانات.",
        "error"
      );

    }

  }


  /* =======================================================
     QUICK ADD
  ======================================================= */

  function openQuickAdd(type) {

    if (type === "product") {

      openProductModal();

      return;
    }

    if (type === "project") {

      openProjectModal();

      return;
    }

    if (type === "support") {

      switchSection("support");

      return;
    }

    if (type === "announcement") {

      openAnnouncementModal();

      return;
    }

  }


  /* =======================================================
     PRODUCT MODAL
  ======================================================= */

  function openProductModal() {

    openModal(`

      <div class="modal-header">

        <span class="section-kicker">
          PRODUCT
        </span>

        <h2>
          إضافة منتج
        </h2>

        <p style="
          color:#8fa1b8;
          margin-top:8px;
        ">
          أضف نسخة مجانية أو مدفوعة.
        </p>

      </div>

      <form id="productModalForm">

        <div class="form-group">

          <label>
            اسم المنتج
          </label>

          <input
            type="text"
            id="newProductName"
            required
            placeholder="مثال: NOVA Pro">

        </div>

        <div class="form-group">

          <label>
            الوصف
          </label>

          <textarea
            id="newProductDescription"
            rows="4"
            placeholder="وصف المنتج...">
          </textarea>

        </div>

        <div class="form-group">

          <label>
            نوع النسخة
          </label>

          <select id="newProductType">

            <option value="free">
              مجانية
            </option>

            <option value="paid">
              مدفوعة
            </option>

          </select>

        </div>

        <div class="form-group">

          <label>
            السعر
          </label>

          <input
            type="number"
            id="newProductPrice"
            min="0"
            step="0.01"
            value="0">

        </div>

        <div class="form-group">

          <label>
            رابط المنتج / التحميل
          </label>

          <input
            type="url"
            id="newProductUrl"
            placeholder="https://...">

        </div>

        <div class="form-actions">

          <button
            type="button"
            class="secondary-button"
            id="cancelProductModal">

            إلغاء

          </button>

          <button
            type="submit"
            class="primary-button">

            حفظ المنتج

          </button>

        </div>

      </form>

    `);

    $("#cancelProductModal")
      ?.addEventListener(
        "click",
        closeModal
      );

    $("#productModalForm")
      ?.addEventListener(
        "submit",
        handleProductSubmit
      );
  }


  async function handleProductSubmit(event) {

    event.preventDefault();

    const product = {

      id:
        crypto?.randomUUID
          ? crypto.randomUUID()
          : String(Date.now()),

      name:
        $("#newProductName")?.value ||
        "منتج جديد",

      description:
        $("#newProductDescription")?.value ||
        "",

      type:
        $("#newProductType")?.value ||
        "free",

      price:
        safeNumber(
          $("#newProductPrice")?.value
        ),

      url:
        $("#newProductUrl")?.value ||
        "",

      paid:
        $("#newProductType")?.value === "paid",

      created_at:
        new Date().toISOString()

    };

    /*
      هذه النسخة تحفظ المنتج في الذاكرة فقط
      حتى ننشئ جدول المنتجات الرسمي لاحقًا.
    */

    state.products.unshift(product);

    renderProducts();

    closeModal();

    showToast(
      "تمت إضافة المنتج مؤقتًا."
    );

    switchSection("products");
  }


  /* =======================================================
     PROJECT MODAL
  ======================================================= */

  function openProjectModal() {

    openModal(`

      <div>

        <span class="section-kicker">
          PROJECT
        </span>

        <h2>
          إضافة مشروع
        </h2>

        <p style="
          color:#8fa1b8;
          margin:8px 0 20px;
        ">
          أضف مشروعًا جديدًا إلى المنصة.
        </p>

      </div>

      <form id="projectModalForm">

        <div class="form-group">

          <label>
            اسم المشروع
          </label>

          <input
            type="text"
            id="newProjectName"
            required
            placeholder="اسم المشروع">

        </div>

        <div class="form-group">

          <label>
            الوصف
          </label>

          <textarea
            id="newProjectDescription"
            rows="5"
            placeholder="وصف المشروع">
          </textarea>

        </div>

        <div class="form-group">

          <label>
            Framework
          </label>

          <input
            type="text"
            id="newProjectFramework"
            placeholder="HTML / React / Next.js...">

        </div>

        <div class="form-actions">

          <button
            type="button"
            class="secondary-button"
            id="cancelProjectModal">

            إلغاء

          </button>

          <button
            type="submit"
            class="primary-button">

            إنشاء المشروع

          </button>

        </div>

      </form>

    `);

    $("#cancelProjectModal")
      ?.addEventListener(
        "click",
        closeModal
      );

    $("#projectModalForm")
      ?.addEventListener(
        "submit",
        handleProjectSubmit
      );
  }


  async function handleProjectSubmit(event) {

    event.preventDefault();

    const name =
      $("#newProjectName")?.value?.trim();

    if (!name) {
      showToast(
        "اكتب اسم المشروع.",
        "error"
      );

      return;
    }

    try {

      if (
        window.NOVA_DB &&
        typeof window.NOVA_DB.createProject === "function"
      ) {

        const result =
          await window.NOVA_DB.createProject({

            name,

            description:
              $("#newProjectDescription")?.value ||
              "",

            framework:
              $("#newProjectFramework")?.value ||
              "HTML",

            status:
              "draft"

          });

        if (result) {

          showToast(
            "تم إنشاء المشروع."
          );

          closeModal();

          await loadProjects();

          renderProjects();

          updateStatistics();

          return;
        }
      }

      showToast(
        "لم يتم العثور على نظام قاعدة البيانات.",
        "error"
      );

    } catch (error) {

      console.error(error);

      showToast(
        "تعذر إنشاء المشروع.",
        "error"
      );
    }
  }


  /* =======================================================
     ANNOUNCEMENT MODAL
  ======================================================= */

  function openAnnouncementModal() {

    openModal(`

      <div>

        <span class="section-kicker">
          ANNOUNCEMENT
        </span>

        <h2>
          إعلان جديد
        </h2>

      </div>

      <form id="announcementForm">

        <div class="form-group">

          <label>
            عنوان الإعلان
          </label>

          <input
            type="text"
            id="announcementTitle"
            required
            placeholder="عنوان الإعلان">

        </div>

        <div class="form-group">

          <label>
            النص
          </label>

          <textarea
            id="announcementBody"
            rows="6"
            placeholder="اكتب الإعلان...">
          </textarea>

        </div>

        <div class="form-group">

          <label>
            الرابط
          </label>

          <input
            type="url"
            id="announcementUrl"
            placeholder="https://...">

        </div>

        <div class="form-actions">

          <button
            type="button"
            class="secondary-button"
            id="cancelAnnouncement">

            إلغاء

          </button>

          <button
            type="submit"
            class="primary-button">

            إضافة الإعلان

          </button>

        </div>

      </form>

    `);

    $("#cancelAnnouncement")
      ?.addEventListener(
        "click",
        closeModal
      );

    $("#announcementForm")
      ?.addEventListener(
        "submit",
        handleAnnouncementSubmit
      );
  }


  async function handleAnnouncementSubmit(event) {

    event.preventDefault();

    const item = {

      id:
        crypto?.randomUUID
          ? crypto.randomUUID()
          : String(Date.now()),

      title:
        $("#announcementTitle")?.value ||
        "إعلان",

      body:
        $("#announcementBody")?.value ||
        "",

      url:
        $("#announcementUrl")?.value ||
        "",

      status:
        "منشور",

      created_at:
        new Date().toISOString()

    };

    state.announcements.unshift(item);

    renderAnnouncements();

    closeModal();

    showToast(
      "تمت إضافة الإعلان مؤقتًا."
    );

    switchSection("announcements");
  }


  /* =======================================================
     DELETE PROJECT
  ======================================================= */

  async function deleteProject(projectId) {

    const confirmed =
      window.confirm(
        "هل أنت متأكد من حذف هذا المشروع؟"
      );

    if (!confirmed) {
      return;
    }

    try {

      if (
        window.NOVA_DB &&
        typeof window.NOVA_DB.deleteProject === "function"
      ) {

        await window.NOVA_DB.deleteProject(
          projectId
        );

      } else {

        const client =
          getSupabase();

        if (!client) {
          throw new Error(
            "Supabase unavailable"
          );
        }

        const result =
          await client
            .from("projects")
            .delete()
            .eq("id", projectId);

        if (result.error) {
          throw result.error;
        }

      }

      state.projects =
        state.projects.filter(
          (project) =>
            project.id !== projectId
        );

      renderProjects();

      renderRecentProjects();

      updateStatistics();

      showToast(
        "تم حذف المشروع."
      );

    } catch (error) {

      console.error(error);

      showToast(
        "تعذر حذف المشروع.",
        "error"
      );
    }
  }


  /* =======================================================
     USER VIEW
  ======================================================= */

  function showUser(userId) {

    const user =
      state.users.find(
        (item) =>
          String(item.id) ===
          String(userId)
      );

    if (!user) {
      showToast(
        "لم يتم العثور على المستخدم.",
        "error"
      );

      return;
    }

    openModal(`

      <span class="section-kicker">
        USER
      </span>

      <h2>
        معلومات المستخدم
      </h2>

      <div style="
        margin-top:20px;
      ">

        <div class="activity-item">

          <div class="activity-icon">
            👤
          </div>

          <div class="activity-info">

            <strong>
              ${escapeHTML(
                user.full_name ||
                user.name ||
                "مستخدم"
              )}
            </strong>

            <span>
              ${escapeHTML(
                user.email ||
                "لا يوجد بريد"
              )}
            </span>

          </div>

        </div>

        <div style="
          margin-top:15px;
          color:#8fa1b8;
          line-height:2;
        ">

          <div>
            <strong style="color:white">
              ID:
            </strong>

            ${escapeHTML(
              user.id || "-"
            )}

          </div>

          <div>
            <strong style="color:white">
              الدور:
            </strong>

            ${escapeHTML(
              user.role || "user"
            )}

          </div>

          <div>
            <strong style="color:white">
              تاريخ التسجيل:
            </strong>

            ${formatDate(
              user.created_at
            )}

          </div>

        </div>

      </div>

    `);
  }


  /* =======================================================
     EVENT LISTENERS
  ======================================================= */

  function setupNavigation() {

    $$(".nav-item").forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          switchSection(
            button.dataset.section
          );

        }
      );

    });


    $$("[data-section-link]").forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            switchSection(
              button.dataset.sectionLink
            );

          }
        );

      }
    );

  }


  function setupSidebar() {

    $("#menuButton")
      ?.addEventListener(
        "click",
        openSidebar
      );

    $("#closeSidebar")
      ?.addEventListener(
        "click",
        closeSidebar
      );

    $("#sidebarOverlay")
      ?.addEventListener(
        "click",
        closeSidebar
      );

  }


  function setupModal() {

    $("#modalClose")
      ?.addEventListener(
        "click",
        closeModal
      );

    $("#modalOverlay")
      ?.addEventListener(
        "click",
        (event) => {

          if (
            event.target ===
            $("#modalOverlay")
          ) {

            closeModal();

          }

        }
      );

  }


  function setupQuickActions() {

    $$("[data-action]").forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            openQuickAdd(
              button.dataset.action
                .replace("add-", "")
            );

          }
        );

      }
    );


    $("#quickAddButton")
      ?.addEventListener(
        "click",
        () => {

          openProductModal();

        }
      );


    $("#addProductButton")
      ?.addEventListener(
        "click",
        openProductModal
      );


    $("#addSupportButton")
      ?.addEventListener(
        "click",
        () => {

          switchSection("support");

        }
      );


    $("#addAnnouncementButton")
      ?.addEventListener(
        "click",
        openAnnouncementModal
      );


    $("#addContentButton")
      ?.addEventListener(
        "click",
        () => {

          showToast(
            "محرر المحتوى جاهز للربط بقاعدة البيانات."
          );

        }
      );

  }


  function setupForms() {

    $("#supportForm")
      ?.addEventListener(
        "submit",
        async (event) => {

          event.preventDefault();

          await saveSupportSettings();

        }
      );


    [
      "#supportTitle",
      "#supportText",
      "#supportUrl",
      "#supportQr"
    ].forEach((selector) => {

      $(selector)
        ?.addEventListener(
          "input",
          updateSupportPreview
        );

    });


    $("#contentForm")
      ?.addEventListener(
        "submit",
        (event) => {

          event.preventDefault();

          showToast(
            "تم تجهيز محرر المحتوى. سنربطه بجدول المحتوى."
          );

        }
      );


    $("#platformSettingsForm")
      ?.addEventListener(
        "submit",
        (event) => {

          event.preventDefault();

          showToast(
            "تم حفظ إعدادات المنصة مؤقتًا."
          );

        }
      );

  }


  function setupSearch() {

    $("#userSearch")
      ?.addEventListener(
        "input",
        renderUsers
      );

    $("#userRoleFilter")
      ?.addEventListener(
        "change",
        renderUsers
      );


    $("#projectSearch")
      ?.addEventListener(
        "input",
        () => {

          const search =
            String(
              $("#projectSearch")?.value ||
              ""
            )
              .trim()
              .toLowerCase();

          const filtered =
            state.projects.filter(
              (project) => {

                const text = [
                  project.name,
                  project.title,
                  project.description,
                  project.framework
                ]
                  .filter(Boolean)
                  .join(" ")
                  .toLowerCase();

                return (
                  !search ||
                  text.includes(search)
                );

              }
            );

          const original =
            state.projects;

          state.projects = filtered;

          renderProjects();

          state.projects = original;

        }
      );


    $("#projectStatusFilter")
      ?.addEventListener(
        "change",
        () => {

          const status =
            $("#projectStatusFilter")
              ?.value || "all";

          const filtered =
            state.projects.filter(
              (project) => {

                if (
                  status === "all"
                ) {
                  return true;
                }

                return String(
                  project.status ||
                  "draft"
                ) === status;

              }
            );

          const original =
            state.projects;

          state.projects =
            filtered;

          renderProjects();

          state.projects =
            original;

        }
      );


    $("#complaintFilter")
      ?.addEventListener(
        "change",
        renderComplaints
      );

  }


  function setupTableActions() {

    document.addEventListener(
      "click",
      (event) => {

        const projectButton =
          event.target.closest(
            "[data-project-action]"
          );

        if (projectButton) {

          const action =
            projectButton.dataset
              .projectAction;

          const id =
            projectButton.dataset
              .projectId;

          if (action === "delete") {

            deleteProject(id);

          }

          if (action === "view") {

            const project =
              state.projects.find(
                (item) =>
                  String(item.id) ===
                  String(id)
              );

            if (project) {

              openModal(`

                <span class="section-kicker">
                  PROJECT
                </span>

                <h2>
                  ${escapeHTML(
                    project.name ||
                    project.title ||
                    "مشروع"
                  )}
                </h2>

                <p style="
                  color:#8fa1b8;
                  line-height:1.8;
                  margin-top:15px;
                ">
                  ${escapeHTML(
                    project.description ||
                    "لا يوجد وصف."
                  )}
                </p>

                <div style="
                  margin-top:20px;
                ">

                  <span class="badge badge-info">
                    ${escapeHTML(
                      project.status ||
                      "draft"
                    )}
                  </span>

                </div>

              `);

            }

          }

        }


        const userButton =
          event.target.closest(
            "[data-user-id]"
          );

        if (userButton) {

          showUser(
            userButton.dataset.userId
          );

        }

      }
    );

  }


  function setupButtons() {

    $("#refreshButton")
      ?.addEventListener(
        "click",
        async () => {

          showToast(
            "جاري تحديث البيانات..."
          );

          await loadDashboardData();

          if (
            state.currentSection ===
            "projects"
          ) {
            renderProjects();
          }

          if (
            state.currentSection ===
            "users"
          ) {
            await loadUsers();
            renderUsers();
          }

          if (
            state.currentSection ===
            "ai"
          ) {
            await loadAIRequests();
            renderAIRequests();
          }

          if (
            state.currentSection ===
            "orders"
          ) {
            await loadOrders();
            renderOrders();
          }

          if (
            state.currentSection ===
            "logs"
          ) {
            await loadLogs();
            renderLogs();
          }

          showToast(
            "تم تحديث البيانات."
          );

        }
      );


    $("#refreshUsersButton")
      ?.addEventListener(
        "click",
        async () => {

          await loadUsers();

          renderUsers();

          updateStatistics();

          showToast(
            "تم تحديث المستخدمين."
          );

        }
      );


    $("#refreshAIButton")
      ?.addEventListener(
        "click",
        async () => {

          await loadAIRequests();

          renderAIRequests();

          showToast(
            "تم تحديث طلبات AI."
          );

        }
      );


    $("#refreshOrdersButton")
      ?.addEventListener(
        "click",
        async () => {

          await loadOrders();

          renderOrders();

          showToast(
            "تم تحديث الطلبات."
          );

        }
      );


    $("#refreshLogsButton")
      ?.addEventListener(
        "click",
        async () => {

          await loadLogs();

          renderLogs();

          renderRecentLogs();

          showToast(
            "تم تحديث السجل."
          );

        }
      );


    $("#openSiteButton")
      ?.addEventListener(
        "click",
        () => {

          window.open(
            "index.html",
            "_blank"
          );

        }
      );


    $("#logoutButton")
      ?.addEventListener(
        "click",
        async () => {

          try {

            if (
              window.NOVA_AUTH &&
              typeof window.NOVA_AUTH.logout ===
                "function"
            ) {

              await window.NOVA_AUTH.logout();

            } else {

              const client =
                getSupabase();

              if (client) {
                await client.auth.signOut();
              }

            }

          } catch (error) {

            console.error(error);

          }

          window.location.href =
            "login.html";

        }
      );

  }


  /* =======================================================
     INITIALIZATION
  ======================================================= */

  async function initialize() {

    if (state.initialized) {
      return;
    }

    state.initialized = true;

    try {

      const allowed =
        await protectAdmin();

      if (!allowed) {
        return;
      }

      renderAdminProfile();

      setupNavigation();

      setupSidebar();

      setupModal();

      setupQuickActions();

      setupForms();

      setupSearch();

      setupTableActions();

      setupButtons();

      showDashboard();

      await loadUsers();

      await loadDashboardData();

      renderUsers();

      renderProjects();

      renderAIRequests();

      renderOrders();

      renderLogs();

      await loadComplaints();

      renderComplaints();

      await loadSupportSettings();

      updateStatistics();

      switchSection("overview");

      console.log(
        "NOVA Admin initialized successfully."
      );

    } catch (error) {

      console.error(
        "NOVA Admin initialization error:",
        error
      );

      showToast(
        "حدث خطأ أثناء تشغيل لوحة الإدارة.",
        "error"
      );

    }

  }


  /* =======================================================
     START
  ======================================================= */

  function start() {

    if (
      window.NOVA_SUPABASE ||
      window.NOVA_AUTH
    ) {

      initialize();

      return;
    }


    window.addEventListener(
      "nova:supabase-ready",
      initialize,
      { once: true }
    );


    window.addEventListener(
      "nova:auth-ready",
      initialize,
      { once: true }
    );


    setTimeout(() => {

      if (!state.initialized) {
        initialize();
      }

    }, 2500);

  }


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      start
    );

  } else {

    start();

  }


  /* =======================================================
     PUBLIC API
  ======================================================= */

  window.NOVA_ADMIN = {

    state,

    switchSection,

    showToast,

    openModal,

    closeModal,

    reload: async function () {

      await loadDashboardData();

      renderProjects();

      renderAIRequests();

      renderOrders();

      renderLogs();

      updateStatistics();

    }

  };

})();
