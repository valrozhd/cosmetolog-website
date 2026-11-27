"use client";

import { useSyncExternalStore } from "react";
import {
  getServerServicesSnapshot,
  getServicesSnapshot,
  parseServices,
  subscribeToServices,
} from "../lib/services";

export default function PublicServices() {
  const serviceSnapshot = useSyncExternalStore(
    subscribeToServices,
    getServicesSnapshot,
    getServerServicesSnapshot,
  );
  const { services, error } = parseServices(serviceSnapshot);
  const visibleServices = services.filter((service) => service.isVisible && !service.isSample);

  return (
    <section className="public-services" id="services" aria-labelledby="public-services-title">
      <div className="public-services-heading">
        <p className="intro-eyebrow">Thoughtful care for your skin</p>
        <h2 id="public-services-title">Services</h2>
        <p>Explore personalized treatments designed around your skin and its needs.</p>
      </div>
      {error ? (
        <p className="public-services-empty" role="alert">
          {error}
        </p>
      ) : visibleServices.length ? (
        <div className="public-services-grid">
          {visibleServices.map((service) => (
            <article className="public-service-card" key={service.id}>
              <h3>{service.name}</h3>
              <p>{service.description}</p>
              <div className="public-service-details">
                <span>{service.cost === 0 ? "Free" : `${service.cost.toLocaleString("en")} CZK`}</span>
                <span>{service.duration} min</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="public-services-empty">Services are being updated. Please check back soon.</p>
      )}
    </section>
  );
}
