import Image from "next/image";
import Link from "next/link";
import { PricingCalculator } from "@/components/pricing-calculator";
import { ServiceCard } from "@/components/service-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { services } from "@/content/services";

const deliveryTimes = [
  { profile: "Ejecutivo · C-level / VP", time: "8 semanas", shortlist: "3 candidatos" },
  { profile: "Gerencial · director / gerente", time: "6 semanas", shortlist: "3–4 candidatos" },
  { profile: "Especializado · técnico", time: "5 semanas", shortlist: "3 candidatos" },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero" id="inicio" aria-labelledby="hero-title">
          <Image
            alt="Profesional revisando información en su equipo de trabajo"
            className="hero-image"
            fill
            priority
            sizes="100vw"
            src="/imagenhero.jpg"
            unoptimized
          />
          <div className="hero-shade" aria-hidden="true" />
          <div className="hero-content">
            <p className="hero-eyebrow"><span /> TALENTO · OPERACIONES · LIDERAZGO</p>
            <h1 id="hero-title">Talento, soporte y liderazgo para hacer crecer tu empresa.</h1>
            <p className="hero-copy">
              Headhunting ejecutivo y de mandos medios, equipos de soporte gestionados por Nexova y formación corporativa con diagnóstico y sesiones en vivo.
            </p>
            <div className="hero-actions">
              <Link className="button button-lime" href="#servicios">Conoce los servicios <span aria-hidden="true">↓</span></Link>
              <Link className="hero-text-link" href="#tarifas">Explora las tarifas <span aria-hidden="true">↗</span></Link>
            </div>
            <div className="hero-proof">
              <span>01 / 03</span>
              <span>Tres líneas, contratación independiente</span>
              <span className="proof-rule" aria-hidden="true" />
            </div>
          </div>
          <span className="hero-side-note" aria-hidden="true">NEXOVA · SOLUCIONES EMPRESARIALES</span>
        </section>

        <section className="service-section section-wrap" id="servicios" aria-labelledby="services-title">
          <div className="section-intro">
            <div>
              <p className="eyebrow">UNA OFERTA, TRES FORMAS DE AVANZAR</p>
              <h2 id="services-title">El apoyo adecuado para cada reto.</h2>
            </div>
            <p className="section-intro-copy">Cada servicio se contrata por separado. También puedes combinar líneas según lo que necesite tu empresa.</p>
          </div>
          <div className="service-grid">
            {services.map((service) => <ServiceCard key={service.number} service={service} />)}
          </div>
        </section>

        <section className="process-section" id="proceso" aria-labelledby="process-title">
          <div className="section-wrap process-layout">
            <div className="process-intro">
              <p className="eyebrow">PLAZOS DE REFERENCIA</p>
              <h2 id="process-title">Compromisos claros. Expectativas realistas.</h2>
              <p>Los tiempos de headhunting son promedios basados en búsquedas exitosas, no garantías contractuales salvo acuerdo explícito.</p>
              <Link className="underlined-link" href="#tarifas">Consultar condiciones <span aria-hidden="true">↗</span></Link>
            </div>
            <div className="delivery-table" role="table" aria-label="Promedios de entrega de headhunting">
              <div className="delivery-table-head" role="row">
                <span role="columnheader">Tipo de búsqueda</span>
                <span role="columnheader">Promedio</span>
                <span role="columnheader">Terna</span>
              </div>
              {deliveryTimes.map((item) => (
                <div className="delivery-row" key={item.profile} role="row">
                  <span role="cell">{item.profile}</span>
                  <strong role="cell">{item.time}</strong>
                  <span role="cell">{item.shortlist}</span>
                </div>
              ))}
              <p className="delivery-note">Una búsqueda ejecutiva sin candidato calificado a la semana 4 se escala a Operaciones y se comunica al cliente con un plan de acción. Ubicaciones muy restrictivas pueden impedir garantizar plazos.</p>
            </div>
          </div>
        </section>

        <section className="pricing-section section-wrap" id="tarifas" aria-labelledby="pricing-title">
          <div className="section-intro pricing-intro">
            <div>
              <p className="eyebrow">TRANSPARENCIA COMERCIAL</p>
              <h2 id="pricing-title">Una inversión fácil de entender.</h2>
            </div>
            <p className="section-intro-copy">Consulta los modelos base. El importe final depende del perfil, especialización, idioma y alcance acordado.</p>
          </div>
          <PricingCalculator />
          <p className="pricing-disclaimer">Estimaciones informativas, no constituyen una cotización ni modifican las condiciones contractuales de Nexova. Los importes y excepciones se rigen por el acuerdo aplicable.</p>
        </section>

        <section className="assurance-section" aria-labelledby="assurance-title">
          <div className="section-wrap assurance-layout">
            <div>
              <p className="eyebrow">UNA RELACIÓN DE TRABAJO CLARA</p>
              <h2 id="assurance-title">Condiciones que protegen el proceso.</h2>
            </div>
            <div className="assurance-list">
              <details>
                <summary>¿Qué incluye el proceso de headhunting?</summary>
                <p>Búsqueda directa, evaluación por competencias y verificación de referencias. Si ningún candidato de la terna inicial encaja, puede realizarse una ronda adicional sin coste cuando el cliente aporta feedback específico.</p>
              </details>
              <details>
                <summary>¿Cómo se factura una búsqueda?</summary>
                <p>El esquema estándar es 30% al iniciar, 30% al presentar la terna final y 40% al contratar. Las condiciones para clientes con más de dos años de relación requieren aprobación de Finanzas.</p>
              </details>
              <details>
                <summary>¿Qué ocurre si el grupo de formación supera 15 personas?</summary>
                <p>Se prepara una cotización personalizada; no hay una tarifa fija publicada para grupos mayores.</p>
              </details>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}