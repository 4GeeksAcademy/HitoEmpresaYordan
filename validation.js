document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("applicationForm");
  const successBox = document.getElementById("formSuccess");

  if (!form) return;

  const fields = ["fullName", "email", "phone", "position", "message"];

  function setError(fieldName, message) {
    const field = document.getElementById(fieldName);
    const errorEl = document.querySelector(`[data-error-for="${fieldName}"]`);

    if (field) {
      field.classList.remove("is-valid");
      field.classList.add("is-invalid");
    }

    if (errorEl) {
      errorEl.textContent = message;
    }
  }

  function clearError(fieldName) {
    const field = document.getElementById(fieldName);
    const errorEl = document.querySelector(`[data-error-for="${fieldName}"]`);

    if (field) {
      field.classList.remove("is-invalid");
      if (field.value.trim() !== "") {
        field.classList.add("is-valid");
      } else {
        field.classList.remove("is-valid");
      }
    }

    if (errorEl) {
      errorEl.textContent = "";
    }
  }

  function validateField(fieldName) {
    const field = document.getElementById(fieldName);
    if (!field) return true;

    const value = field.value.trim();

    switch (fieldName) {
      case "fullName":
        if (value.length < 3) {
          setError(fieldName, "Ingresa al menos 3 caracteres.");
          return false;
        }
        clearError(fieldName);
        return true;

      case "email": {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          setError(fieldName, "Ingresa un correo valido.");
          return false;
        }
        clearError(fieldName);
        return true;
      }

      case "phone": {
        const phoneRegex = /^\+?[0-9\s()-]{7,20}$/;
        if (!phoneRegex.test(value)) {
          setError(fieldName, "Ingresa un telefono valido.");
          return false;
        }
        clearError(fieldName);
        return true;
      }

      case "position":
        if (!value) {
          setError(fieldName, "Selecciona un puesto.");
          return false;
        }
        clearError(fieldName);
        return true;

      case "message":
        if (value.length > 0 && value.length < 10) {
          setError(fieldName, "Si agregas mensaje, usa al menos 10 caracteres.");
          return false;
        }
        clearError(fieldName);
        return true;

      default:
        return true;
    }
  }

  fields.forEach((fieldName) => {
    const field = document.getElementById(fieldName);
    if (!field) return;

    field.addEventListener("input", () => {
      validateField(fieldName);
      if (successBox) {
        successBox.classList.add("hidden");
        successBox.textContent = "";
      }
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const isValid = fields
      .filter((name) => name !== "message")
      .map((fieldName) => validateField(fieldName))
      .every(Boolean) && validateField("message");

    if (!isValid) return;

    form.reset();
    fields.forEach(clearError);

    if (successBox) {
      successBox.textContent = "Tu aplicacion fue enviada correctamente.";
      successBox.classList.remove("hidden");
    }
  });
});
