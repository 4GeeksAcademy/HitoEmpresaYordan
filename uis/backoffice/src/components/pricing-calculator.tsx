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
    <div className="grid grid-cols-1 border border-white/10 bg-[#0D1225] sm:grid-cols-[minmax(230px,0.72fr)_minmax(0,1.28fr)]">
      {/* ─── Left: Controls ─── */}
      <div className="border-b border-white/10 bg-[#0F1529] p-7 sm:border-b-0 sm:border-r sm:border-white/10">
        <p className="font-mono text-[9px] font-bold tracking-widest text-cyan-400">
          ESTIMACIÓN ORIENTATIVA
        </p>
        <h3 className="mt-3 font-sans text-[27px] font-normal leading-tight text-white">
          Explora el modelo de inversión
        </h3>
        <p className="mt-0 text-[11px] leading-relaxed text-slate-400">
          Elige un servicio para consultar su tarifa y condiciones principales.
        </p>
        <div
          className="mt-7 grid gap-[6px]"
          role="group"
          aria-label="Seleccionar servicio"
        >
          {serviceOptions.map((option) => (
            <button
              aria-pressed={service === option.id}
              key={option.id}
              onClick={() => setService(option.id)}
              type="button"
              className={`min-h-[41px] px-3 text-left text-[11px] transition ${
                service === option.id
                  ? "border border-cyan-400/60 bg-cyan-400/15 text-cyan-200 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                  : "border border-white/15 bg-transparent text-slate-300 hover:border-white/30 hover:text-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Right: Panel ─── */}
      <div className="min-h-[385px] p-7 sm:p-8" aria-live="polite">
        {service === "headhunting" && (
          <div>
            <p className="mb-0 font-mono text-[9px] font-bold text-cyan-400">
              HONORARIOS DE BÚSQUEDA
            </p>
            <h4 className="mb-5 mt-0 font-sans text-[31px] font-normal leading-tight text-white">
              22%{" "}
              <span className="font-sans text-[11px] font-normal text-slate-500">
                del salario anual bruto
              </span>
            </h4>
            <label
              className="mb-[7px] mt-4 block text-[10px] font-bold text-slate-400"
              htmlFor="annual-salary"
            >
              Salario anual bruto de referencia
            </label>
            <div className="flex items-center gap-3">
              <input
                id="annual-salary"
                min="1"
                onChange={(event) => setSalary(event.target.value)}
                placeholder="Introduce un importe"
                step="1000"
                type="number"
                value={salary}
                className="w-full min-w-0 max-w-[280px] min-h-[42px] px-3 text-[12px] text-white bg-[#0A0E1F] border border-white/20 focus:border-cyan-400/60 focus:outline-none"
              />
              <span className="text-[9px] text-slate-500">
                misma moneda del salario
              </span>
            </div>
            {fee !== null ? (
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="col-span-2 grid gap-1 bg-[#0F1529] p-3">
                  <span className="text-[9px] text-slate-500">
                    Honorarios estimados
                  </span>
                  <strong className="font-mono text-[13px] font-medium text-cyan-300">
                    <Amount value={fee} />
                  </strong>
                </div>
                <div className="grid gap-1 bg-[#0A0E1F] p-3">
                  <span className="text-[9px] text-slate-500">
                    Inicio · 30%
                  </span>
                  <strong className="font-mono text-[13px] font-medium text-white">
                    <Amount value={fee * 0.3} />
                  </strong>
                </div>
                <div className="grid gap-1 bg-[#0A0E1F] p-3">
                  <span className="text-[9px] text-slate-500">
                    Terna final · 30%
                  </span>
                  <strong className="font-mono text-[13px] font-medium text-white">
                    <Amount value={fee * 0.3} />
                  </strong>
                </div>
                <div className="grid gap-1 bg-[#0A0E1F] p-3">
                  <span className="text-[9px] text-slate-500">
                    Contratación · 40%
                  </span>
                  <strong className="font-mono text-[13px] font-medium text-white">
                    <Amount value={fee * 0.4} />
                  </strong>
                </div>
              </div>
            ) : (
              <p className="mt-3.5 text-[10px] leading-relaxed text-slate-500">
                Introduce el salario para ver el importe estimado y sus tres
                hitos de facturación.
              </p>
            )}
            <p className="mt-5 border-t border-white/10 pt-3 text-[10px] leading-relaxed text-slate-500">
              La garantía de reemplazo gratuito aplica durante seis meses cuando
              la salida es atribuible al proceso de selección. No se aplican
              descuentos sin aprobación.
            </p>
          </div>
        )}

        {service === "support" && (
          <div>
            <p className="mb-0 font-mono text-[9px] font-bold text-cyan-400">
              EQUIPO DEDICADO · MENSUAL
            </p>
            <h4 className="mb-5 mt-0 font-sans text-[31px] font-normal leading-tight text-white">
              USD 1.800–2.400{" "}
              <span className="font-sans text-[11px] font-normal text-slate-500">
                por agente
              </span>
            </h4>
            <label
              className="mb-[7px] mt-4 block text-[10px] font-bold text-slate-400"
              htmlFor="agent-count"
            >
              Agentes en el equipo
            </label>
            <div className="flex items-center gap-3">
              <input
                id="agent-count"
                min="5"
                onChange={(event) => setAgents(event.target.value)}
                step="1"
                type="number"
                value={agents}
                className="w-full min-w-0 max-w-[280px] min-h-[42px] px-3 text-[12px] text-white bg-[#0A0E1F] border border-white/20 focus:border-cyan-400/60 focus:outline-none"
              />
              <span className="text-[9px] text-slate-500">
                mínimo 5 agentes
              </span>
            </div>
            {teamSize >= 5 ? (
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="col-span-2 grid gap-1 bg-[#0F1529] p-3">
                  <span className="text-[9px] text-slate-500">
                    Rango mensual estimado
                  </span>
                  <strong className="font-mono text-[13px] font-medium text-cyan-300">
                    {currencyFormatter.format(teamSize * 1800)}–
                    {currencyFormatter.format(teamSize * 2400)}
                  </strong>
                </div>
                <div className="grid gap-1 bg-[#0A0E1F] p-3">
                  <span className="text-[9px] text-slate-500">
                    Contrato mínimo
                  </span>
                  <strong className="font-mono text-[13px] font-medium text-white">
                    6 meses
                  </strong>
                </div>
                <div className="grid gap-1 bg-[#0A0E1F] p-3">
                  <span className="text-[9px] text-slate-500">
                    Reclutamiento y rotación
                  </span>
                  <strong className="font-mono text-[13px] font-medium text-white">
                    Incluidos
                  </strong>
                </div>
              </div>
            ) : (
              <p className="mt-3.5 text-[10px] leading-relaxed text-slate-500">
                El equipo mínimo contratable es de cinco agentes.
              </p>
            )}
            <p className="mt-5 border-t border-white/10 pt-3 text-[10px] leading-relaxed text-slate-500">
              La tarifa mensual depende de la especialización y el idioma. La
              cancelación anticipada tiene una penalidad equivalente a un mes de
              tarifa.
            </p>
          </div>
        )}

        {service === "training" && (
          <div>
            <p className="mb-0 font-mono text-[9px] font-bold text-cyan-400">
              PROGRAMA CORPORATIVO
            </p>
            <h4 className="mb-5 mt-0 font-sans text-[31px] font-normal leading-tight text-white">
              Formación para equipos{" "}
              <span className="font-sans text-[11px] font-normal text-slate-500">
                de hasta 15 personas
              </span>
            </h4>
            <span className="mb-[7px] mt-4 block text-[10px] font-bold text-slate-400">
              Duración del programa
            </span>
            <div
              className="flex flex-wrap gap-[7px]"
              role="group"
              aria-label="Duración del programa"
            >
              {([4, 8, 12] as ProgramWeeks[]).map((option) => (
                <button
                  aria-pressed={weeks === option}
                  key={option}
                  onClick={() => setWeeks(option)}
                  type="button"
                  className={`min-h-[36px] min-w-[100px] px-3 text-center text-[11px] transition ${
                    weeks === option
                      ? "border border-cyan-400/60 bg-cyan-400/15 text-cyan-200 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                      : "border border-white/15 bg-transparent text-slate-300 hover:border-white/30 hover:text-white"
                  }`}
                >
                  {option} semanas
                </button>
              ))}
            </div>
            <label
              className="mb-[7px] mt-4 block text-[10px] font-bold text-slate-400"
              htmlFor="participant-count"
            >
              Personas en el grupo
            </label>
            <input
              id="participant-count"
              min="1"
              onChange={(event) => setParticipants(event.target.value)}
              type="number"
              value={participants}
              className="w-[150px] min-h-[42px] px-3 text-[12px] text-white bg-[#0A0E1F] border border-white/20 focus:border-cyan-400/60 focus:outline-none"
            />
            {participantCount > 15 ? (
              <p className="mt-3.5 bg-[#1A0A2E] p-3 text-[11px] leading-relaxed text-fuchsia-300">
                Los grupos de más de 15 personas requieren una cotización
                personalizada.
              </p>
            ) : participantCount >= 1 ? (
              <div className="mt-[18px] flex items-baseline gap-[9px]">
                <span className="text-[10px] text-slate-500">Precio desde</span>
                <strong className="font-mono text-[23px] font-medium text-cyan-300">
                  {currencyFormatter.format(programPrices[weeks])}
                </strong>
                <span className="text-[10px] text-slate-500">
                  para el programa completo
                </span>
              </div>
            ) : (
              <p className="mt-3.5 text-[10px] leading-relaxed text-slate-500">
                Indica un grupo de al menos una persona.
              </p>
            )}
            <p className="mt-5 border-t border-white/10 pt-3 text-[10px] leading-relaxed text-slate-500">
              Disponible en modalidad presencial, virtual o híbrida. Incluye
              diagnóstico inicial, sesiones en vivo y certificado.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}