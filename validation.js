document.addEventListener("DOMContentLoaded", () => {
  const formConfigs = [
    {
      formId: "applicationForm",
      errorBoxId: "applicationFormErrors",
      successBoxId: "formSuccess",
      successMessage: "Tu aplicacion fue enviada correctamente.",
      fields: [
        {
          name: "fullName",
          label: "nombre completo",
          required: true,
          minLength: 3,
          requiredMessage: "Ingresa tu nombre completo.",
          minLengthMessage: "El nombre debe tener al menos 3 caracteres."
        },
        {
          name: "email",
          label: "correo electronico",
          required: true,
          type: "email",
          requiredMessage: "Ingresa tu correo electronico.",
          typeMessage: "Ingresa un correo electronico valido (ejemplo: nombre@dominio.com)."
        },
        {
          name: "phone",
          label: "telefono",
          required: true,
          type: "phone",
          requiredMessage: "Ingresa tu numero de telefono.",
          typeMessage: "Ingresa un telefono valido con entre 7 y 20 digitos."
        },
        {
          name: "position",
          label: "puesto de interes",
          required: true,
          type: "select",
          requiredMessage: "Selecciona el puesto que te interesa."
        },
        {
          name: "message",
          label: "mensaje",
          required: false,
          minLengthIfPresent: 10,
          minLengthMessage: "Si escribes un mensaje, debe tener al menos 10 caracteres."
        }
      ]
    },
    {
      formId: "contactForm",
      errorBoxId: "contactFormErrors",
      successBoxId: "contactFormSuccess",
      successMessage: "Gracias por tu consulta. El equipo de Nexova te respondera en menos de 24 horas habiles.",
      fields: [
        {
          name: "nombre",
          label: "nombre completo",
          required: true,
          minLength: 3,
          requiredMessage: "Ingresa el nombre completo de la persona de contacto.",
          minLengthMessage: "El nombre completo debe tener al menos 3 caracteres."
        },
        {
          name: "email",
          label: "correo electronico",
          required: true,
          type: "email",
          requiredMessage: "Ingresa un correo electronico de contacto.",
          typeMessage: "Ingresa un correo valido (ejemplo: tu@empresa.com)."
        },
        {
          name: "empresa",
          label: "empresa",
          required: true,
          minLength: 2,
          requiredMessage: "Ingresa el nombre de la empresa.",
          minLengthMessage: "El nombre de la empresa debe tener al menos 2 caracteres."
        },
        {
          name: "tipo",
          label: "motivo de contacto",
          required: true,
          type: "select",
          requiredMessage: "Selecciona un motivo de contacto."
        },
        {
          name: "mensaje",
          label: "mensaje",
          required: true,
          minLength: 15,
          requiredMessage: "Escribe un mensaje con el contexto de tu necesidad.",
          minLengthMessage: "El mensaje debe tener al menos 15 caracteres para poder ayudarte mejor."
        },
        {
          name: "consentimiento",
          label: "consentimiento",
          required: true,
          type: "checkbox",
          requiredMessage: "Debes aceptar el consentimiento para poder enviar la consulta."
        }
      ]
    }
  ];

  formConfigs.forEach((config) => {
    setupFormValidation(config);
  });
});

function setupFormValidation(config) {
  const form = document.getElementById(config.formId);
  if (!form) return;

  const errorBox = document.getElementById(config.errorBoxId);
  const successBox = document.getElementById(config.successBoxId);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\+?[0-9\s()-]{7,20}$/;
  const validClasses = ["border-emerald-500", "ring-2", "ring-emerald-500/30"];
  const invalidClasses = ["border-red-600", "ring-2", "ring-red-500/30"];

  function removeStateClasses(field) {
    field.classList.remove(...validClasses);
    field.classList.remove(...invalidClasses);
  }

  function getField(rule) {
    return form.elements.namedItem(rule.name);
  }

  function getFieldValue(field, type) {
    if (type === "checkbox") {
      return field.checked;
    }

    return field.value.trim();
  }

  function hideGlobalBoxes() {
    if (errorBox) {
      errorBox.classList.add("hidden");
      errorBox.textContent = "";
    }

    if (successBox) {
      successBox.classList.add("hidden");
      successBox.textContent = "";
    }
  }

  function setError(rule, message) {
    const field = getField(rule);
    const errorEl = form.querySelector(`[data-error-for="${rule.name}"]`);

    if (field) {
      removeStateClasses(field);
      field.classList.add(...invalidClasses);
      field.setAttribute("aria-invalid", "true");
    }

    if (errorEl) {
      errorEl.textContent = message;
    }
  }

  function clearError(rule) {
    const field = getField(rule);
    const errorEl = form.querySelector(`[data-error-for="${rule.name}"]`);

    if (field) {
      const value = getFieldValue(field, rule.type);
      const hasValue = rule.type === "checkbox" ? value : value !== "";

      removeStateClasses(field);
      field.setAttribute("aria-invalid", "false");

      if (hasValue) {
        field.classList.add(...validClasses);
      }
    }

    if (errorEl) {
      errorEl.textContent = "";
    }
  }

  function validateRule(rule) {
    const field = getField(rule);
    if (!field) return true;

    const value = getFieldValue(field, rule.type);
    const isEmpty = rule.type === "checkbox" ? !value : value === "";

    if (rule.required && isEmpty) {
      setError(rule, rule.requiredMessage || `Completa el campo ${rule.label}.`);
      return false;
    }

    if (!rule.required && isEmpty) {
      clearError(rule);
      return true;
    }

    if (rule.type === "email" && !emailRegex.test(value)) {
      setError(rule, rule.typeMessage || "Ingresa un correo valido.");
      return false;
    }

    if (rule.type === "phone" && !phoneRegex.test(value)) {
      setError(rule, rule.typeMessage || "Ingresa un telefono valido.");
      return false;
    }

    if (rule.type === "select" && !value) {
      setError(rule, rule.requiredMessage || "Selecciona una opcion valida.");
      return false;
    }

    if (rule.minLength && value.length < rule.minLength) {
      setError(rule, rule.minLengthMessage || `Este campo debe tener al menos ${rule.minLength} caracteres.`);
      return false;
    }

    if (rule.minLengthIfPresent && value.length > 0 && value.length < rule.minLengthIfPresent) {
      setError(rule, rule.minLengthMessage || `Este campo debe tener al menos ${rule.minLengthIfPresent} caracteres.`);
      return false;
    }

    clearError(rule);
    return true;
  }

  function resetVisualState() {
    config.fields.forEach((rule) => {
      const field = getField(rule);
      const errorEl = form.querySelector(`[data-error-for="${rule.name}"]`);

      if (field) {
        removeStateClasses(field);
        field.setAttribute("aria-invalid", "false");
      }

      if (errorEl) {
        errorEl.textContent = "";
      }
    });

    hideGlobalBoxes();
  }

  config.fields.forEach((rule) => {
    const field = getField(rule);
    if (!field) return;

    const liveEvent = rule.type === "checkbox" || field.tagName === "SELECT" ? "change" : "input";

    field.addEventListener(liveEvent, () => {
      validateRule(rule);
      hideGlobalBoxes();
    });

    field.addEventListener("blur", () => {
      validateRule(rule);
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const invalidRules = config.fields.filter((rule) => !validateRule(rule));

    if (invalidRules.length > 0) {
      if (errorBox) {
        const plural = invalidRules.length === 1 ? "campo" : "campos";
        errorBox.textContent = `Revisa ${invalidRules.length} ${plural} con error antes de enviar.`;
        errorBox.classList.remove("hidden");
      }

      if (successBox) {
        successBox.classList.add("hidden");
        successBox.textContent = "";
      }

      const firstInvalidField = getField(invalidRules[0]);
      if (firstInvalidField && typeof firstInvalidField.focus === "function") {
        firstInvalidField.focus();
      }

      return;
    }

    form.reset();
    resetVisualState();

    if (successBox) {
      successBox.textContent = config.successMessage;
      successBox.classList.remove("hidden");
    }
  });

  form.addEventListener("reset", () => {
    window.setTimeout(resetVisualState, 0);
  });
}
