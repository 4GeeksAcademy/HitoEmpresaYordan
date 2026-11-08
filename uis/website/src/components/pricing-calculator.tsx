"use client";

import { useState } from "react";

type ServiceType = "headhunting" | "support" | "training";
type ProgramWeeks = 4 | 8 | 12;

const formatter = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });
const currencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const serviceOptions: { id: ServiceType; label: string }[] = [
  { id: "headhunting", label: "Headhunting" },
  { id: "support", label: "Soporte" },
  { id: "training", label: "Formación" },
];

const programPrices: Record<ProgramWeeks, number> = {
  4: 3500,
  8: 6200,
  12: 8900,
};

function Amount({ value }: { value: number }) {
  return <>{formatter.format(value)}</>;
}

export function PricingCalculator() {
  const [service, setService] = useState<ServiceType>("headhunting");
  const [salary, setSalary] = useState("");
  const [agents, setAgents] = useState("5");
  const [weeks, setWeeks] = useState<ProgramWeeks>(4);
  const [participants, setParticipants] = useState("1");
  const salaryAmount = Number(salary);
  const participantCount = Number(participants);
  const teamSize = Number(agents);
  const fee = salaryAmount > 0 ? salaryAmount * 0.22 : null;

  return (
    <div className="calculator-shell">
      <div className="calculator-controls">
        <p className="eyebrow">ESTIMACIÓN ORIENTATIVA</p>
        <h3>Explora el modelo de inversión</h3>
        <p>Elige un servicio para consultar su tarifa y condiciones principales.</p>
        <div className="service-tabs" role="group" aria-label="Seleccionar servicio">
          {serviceOptions.map((option) => (
            <button
              aria-pressed={service === option.id}
              className={service === option.id ? "selected" : ""}
              key={option.id}
              onClick={() => setService(option.id)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="calculator-panel" aria-live="polite">
        {service === "headhunting" && (
          <div className="estimate-content">
            <p className="estimate-kicker">HONORARIOS DE BÚSQUEDA</p>
            <h4>22% <span>del salario anual bruto</span></h4>
            <label className="field-label" htmlFor="annual-salary">Salario anual bruto de referencia</label>
            <div className="number-field">
              <input
                id="annual-salary"
                min="1"
                onChange={(event) => setSalary(event.target.value)}
                placeholder="Introduce un importe"
                step="1000"
                type="number"
                value={salary}
              />
              <span>misma moneda del salario</span>
            </div>
            {fee !== null ? (
              <div className="fee-result">
                <div><span>Honorarios estimados</span><strong><Amount value={fee} /></strong></div>
                <div><span>Inicio · 30%</span><strong><Amount value={fee * 0.3} /></strong></div>
                <div><span>Terna final · 30%</span><strong><Amount value={fee * 0.3} /></strong></div>
                <div><span>Contratación · 40%</span><strong><Amount value={fee * 0.4} /></strong></div>
              </div>
            ) : (
              <p className="calculator-hint">Introduce el salario para ver el importe estimado y sus tres hitos de facturación.</p>
            )}
            <p className="calculator-footnote">La garantía de reemplazo gratuito aplica durante seis meses cuando la salida es atribuible al proceso de selección. No se aplican descuentos sin aprobación.</p>
          </div>
        )}

        {service === "support" && (
          <div className="estimate-content">
            <p className="estimate-kicker">EQUIPO DEDICADO · MENSUAL</p>
            <h4>USD 1.800–2.400 <span>por agente</span></h4>
            <label className="field-label" htmlFor="agent-count">Agentes en el equipo</label>
            <div className="number-field">
              <input
                id="agent-count"
                min="5"
                onChange={(event) => setAgents(event.target.value)}
                step="1"
                type="number"
                value={agents}
              />
              <span>mínimo 5 agentes</span>
            </div>
            {teamSize >= 5 ? (
              <div className="fee-result">
                <div><span>Rango mensual estimado</span><strong>{currencyFormatter.format(teamSize * 1800)}–{currencyFormatter.format(teamSize * 2400)}</strong></div>
                <div><span>Contrato mínimo</span><strong>6 meses</strong></div>
                <div><span>Reclutamiento y rotación</span><strong>Incluidos</strong></div>
              </div>
            ) : (
              <p className="calculator-hint">El equipo mínimo contratable es de cinco agentes.</p>
            )}
            <p className="calculator-footnote">La tarifa mensual depende de la especialización y el idioma. La cancelación anticipada tiene una penalidad equivalente a un mes de tarifa.</p>
          </div>
        )}

        {service === "training" && (
          <div className="estimate-content">
            <p className="estimate-kicker">PROGRAMA CORPORATIVO</p>
            <h4>Formación para equipos <span>de hasta 15 personas</span></h4>
            <span className="field-label">Duración del programa</span>
            <div className="duration-options" role="group" aria-label="Duración del programa">
              {([4, 8, 12] as ProgramWeeks[]).map((option) => (
                <button
                  aria-pressed={weeks === option}
                  className={weeks === option ? "selected" : ""}
                  key={option}
                  onClick={() => setWeeks(option)}
                  type="button"
                >
                  {option} semanas
                </button>
              ))}
            </div>
            <label className="field-label" htmlFor="participant-count">Personas en el grupo</label>
            <input
              className="participant-input"
              id="participant-count"
              min="1"
              onChange={(event) => setParticipants(event.target.value)}
              type="number"
              value={participants}
            />
            {participantCount > 15 ? (
              <p className="custom-quote">Los grupos de más de 15 personas requieren una cotización personalizada.</p>
            ) : participantCount >= 1 ? (
              <div className="training-price"><span>Precio desde</span><strong>{currencyFormatter.format(programPrices[weeks])}</strong><span>para el programa completo</span></div>
            ) : (
              <p className="calculator-hint">Indica un grupo de al menos una persona.</p>
            )}
            <p className="calculator-footnote">Disponible en modalidad presencial, virtual o híbrida. Incluye diagnóstico inicial, sesiones en vivo y certificado.</p>
          </div>
        )}
      </div>
    </div>
  );
}