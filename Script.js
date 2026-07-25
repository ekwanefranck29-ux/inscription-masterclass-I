const paymentData = {
  "Orange Money": {
    name: "Orange Money",
    number: "6 57 16 36 12"
  },
  "MTN Mobile Money": {
    name: "MTN Mobile Money",
    number: "6 80 06 34 91"
  }
};

const form = document.getElementById("registrationForm");
const paymentCards = document.querySelectorAll(".payment-card");
const selectedPaymentName = document.getElementById("selectedPaymentName");
const selectedPaymentNumber = document.getElementById("selectedPaymentNumber");
const paymentNumberInput = document.getElementById("paymentNumber");
const copyButton = document.getElementById("copyButton");
const formStatus = document.getElementById("formStatus");

function setPaymentProvider(provider) {
  const data = paymentData[provider];
  if (!data || !selectedPaymentName || !selectedPaymentNumber || !paymentNumberInput) return;

  selectedPaymentName.textContent = data.name;
  selectedPaymentNumber.textContent = data.number;
  paymentNumberInput.value = data.number;

  paymentCards.forEach((card) => {
    const input = card.querySelector("input");
    if (!input) return;
    const isActive = input.value === provider;
    card.classList.toggle("active", isActive);
    input.checked = isActive;
  });
}

paymentCards.forEach((card) => {
  card.addEventListener("click", () => {
    const input = card.querySelector("input");
    if (input) setPaymentProvider(input.value);
  });
});

// Sélection visuelle du pass (Débutant / Expert) — indépendante du mode de paiement
const passCards = document.querySelectorAll(".pass-card");
passCards.forEach((card) => {
  card.addEventListener("click", () => {
    const input = card.querySelector("input");
    if (!input) return;
    passCards.forEach((c) => c.classList.remove("active"));
    card.classList.add("active");
    input.checked = true;
  });
});

if (copyButton) {
  copyButton.addEventListener("click", async () => {
    const number = selectedPaymentNumber.textContent.trim();

    try {
      await navigator.clipboard.writeText(number);
    } catch (error) {
      const temporaryInput = document.createElement("input");
      temporaryInput.value = number;
      document.body.appendChild(temporaryInput);
      temporaryInput.select();
      document.execCommand("copy");
      document.body.removeChild(temporaryInput);
    }

    copyButton.textContent = "Copié ✓";
    copyButton.classList.add("copied");

    setTimeout(() => {
      copyButton.textContent = "Copier";
      copyButton.classList.remove("copied");
    }, 1800);
  });
}

function validateField(field) {
  const group = field.closest(".field-group");
  if (!group) return true;

  const isRequiredEmpty = field.hasAttribute("required") && !field.value.trim();
  const isInvalidEmail = field.type === "email" && field.value.trim() && !field.checkValidity();
  const isInvalid = isRequiredEmpty || isInvalidEmail;

  group.classList.toggle("invalid", isInvalid);
  return !isInvalid;
}

function validateForm() {
  if (!form) return true;

  const fields = form.querySelectorAll("input[required], select[required], input[type='email']");
  let isValid = true;

  fields.forEach((field) => {
    if (!validateField(field)) isValid = false;
  });

  return isValid;
}

if (form) {
  form.querySelectorAll("input, select").forEach((field) => {
    field.addEventListener("input", () => validateField(field));
    field.addEventListener("blur", () => validateField(field));
  });
}

async function saveToGoogleSheets(registrationData) {
  if (!GOOGLE_APPS_SCRIPT_URL || GOOGLE_APPS_SCRIPT_URL.trim() === "") {
    throw new Error("L’URL Google Apps Script n’est pas configurée dans Config.js.");
  }

  /*
   * IMPORTANT :
   * Google Apps Script bloque souvent la lecture de la réponse depuis GitHub Pages à cause du CORS.
   * mode:"no-cors" permet au formulaire d’envoyer les données même si le navigateur ne peut pas lire la réponse.
   */
  await fetch(GOOGLE_APPS_SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(registrationData)
  });

  return {
    success: true,
    message: "Données envoyées vers Google Sheets."
  };
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    formStatus.className = "form-status";
    formStatus.textContent = "";

    if (!validateForm()) {
      formStatus.classList.add("error");
      formStatus.textContent = "Merci de remplir correctement tous les champs obligatoires, surtout l’ID de transaction.";
      return;
    }

    const submitButton = form.querySelector(".submit-btn");
    submitButton.disabled = true;
    submitButton.querySelector("span").textContent = "Enregistrement...";

    const formData = new FormData(form);
    const registrationData = {
      fullName: formData.get("fullName").trim(),
      whatsapp: formData.get("whatsapp").trim(),
      email: formData.get("email").trim(),
      profile: formData.get("profile"),
      pass: formData.get("pass"),
      paymentMethod: formData.get("paymentMethod"),
      paymentNumber: formData.get("paymentNumber"),
      transactionId: formData.get("transactionId").trim(),
      source: "Neo Consulting - Masterclass IA",
      createdAt: new Date().toISOString()
    };

    try {
      await saveToGoogleSheets(registrationData);

      formStatus.classList.add("success");
      formStatus.textContent = "Inscription envoyée. Vérifie ton Google Sheets pour confirmer l’enregistrement.";
      form.reset();
      setPaymentProvider("Orange Money");
      passCards.forEach((c) => c.classList.remove("active"));
      if (passCards[0]) {
        passCards[0].classList.add("active");
        const firstInput = passCards[0].querySelector("input");
        if (firstInput) firstInput.checked = true;
      }
    } catch (error) {
      formStatus.classList.add("error");
      formStatus.textContent = error.message;
    } finally {
      submitButton.disabled = false;
      submitButton.querySelector("span").textContent = "Valider mon inscription";
    }
  });
}

const revealElements = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16 });

  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("visible"));
}
