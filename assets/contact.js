(function () {
  "use strict";

  // Gmailアドレスが決まり次第、この1か所だけ変更してください。
  window.FactioContact = { email: "factio.inc.official@gmail.com" };

  function getEmail() {
    var cfg = window.FactioContact;
    return cfg && typeof cfg.email === "string" ? cfg.email.trim() : "";
  }

  function applyContactState() {
    var email = getEmail();
    var hasEmail = Boolean(email);

    var emailNodes = document.querySelectorAll("[data-contact-email]");
    for (var i = 0; i < emailNodes.length; i++) {
      emailNodes[i].textContent = hasEmail ? email : "（準備中）";
    }

    var noteEl = document.querySelector("#contact-note");
    if (noteEl) {
      noteEl.textContent = hasEmail
        ? "メール作成画面を開きます。画像データは別途添付してください。"
        : "Gmailアドレスは準備中です。内容をコピーして保存できます。";
    }

    var buttonEl = document.querySelector("button#email-summary");
    if (buttonEl) {
      buttonEl.disabled = !hasEmail;
      if (!buttonEl.dataset.contactBound) {
        buttonEl.dataset.contactBound = "true";
        buttonEl.addEventListener("click", function () {
          var currentEmail = getEmail();
          if (!currentEmail) {
            return;
          }
          var summaryEl = document.querySelector("#summary-text");
          var body = summaryEl && typeof summaryEl.value === "string" ? summaryEl.value : "";
          var subject = "Factio 制作のご相談";
          location.href =
            "mailto:" +
            currentEmail +
            "?subject=" +
            encodeURIComponent(subject) +
            "&body=" +
            encodeURIComponent(body);
        });
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyContactState);
  } else {
    applyContactState();
  }
})();
