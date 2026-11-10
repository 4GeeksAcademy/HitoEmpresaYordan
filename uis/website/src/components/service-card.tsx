import Link from "next/link";

type Service = {
  number: string;
  name: string;
  summary: string;
  details: readonly string[];
  metric: string;
  metricLabel: string;
  href: string;
};

export function ServiceCard({ service }: { service: Service }) {
  return (
    <article className="service-card">
      <div className="service-card-topline">
        <span className="service-number">{service.number}</span>
        <span className="service-mark" aria-hidden="true">↗</span>
      </div>
      <h3>{service.name}</h3>
      <p className="service-summary">{service.summary}</p>
      <ul>
        {service.details.map((detail) => <li key={detail}>{detail}</li>)}
      </ul>
      <div className="service-card-footer">
        <div>
          <strong>{service.metric}</strong>
          <span>{service.metricLabel}</span>
        </div>
        <Link href={service.href} aria-label={`Ver tarifas de ${service.name}`}>Ver tarifas <span aria-hidden="true">→</span></Link>
      </div>
    </article>
  );
}