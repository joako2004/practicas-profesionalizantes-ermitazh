import Link from "next/link";
import { CONTACTO, SOCIAL_LINKS, GOOGLE_MAPS_URL, COMPLEJO, buildWhatsAppLink } from "@/lib/config";

export default function Footer() {
  const whatsappGenerico = buildWhatsAppLink(
    "Hola, tengo una consulta sobre las cabañas"
  );

  return (
    <footer id="contacto" className="bg-[var(--color-ink)] text-white/70">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="mb-3 text-lg font-medium text-white">
              {COMPLEJO.nombre}
            </h3>
            <p className="max-w-xs text-sm leading-relaxed text-white/60">
              {COMPLEJO.descripcion}
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-medium text-white">Contacto</h3>
            <ul className="space-y-2 text-sm text-white/60">
              <li>{CONTACTO.direccion}</li>
              <li>
                <a href={`tel:${CONTACTO.telefono}`} className="hover:text-white transition-colors">
                  {CONTACTO.telefono}
                </a>
              </li>
              <li>
                <a href={whatsappGenerico} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  WhatsApp
                </a>
              </li>
              <li>
                <a href={`mailto:${CONTACTO.email}`} className="hover:text-white transition-colors">
                  {CONTACTO.email}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-medium text-white">
              Reservá también en
            </h3>
            <ul className="space-y-2 text-sm text-white/60">
              <li>
                <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Instagram
                </a>
              </li>
              <li>
                <a href={SOCIAL_LINKS.booking} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Booking.com
                </a>
              </li>
              <li>
                <a href={SOCIAL_LINKS.airbnb} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Airbnb
                </a>
              </li>
            </ul>
          </div>

          <div id="ubicacion">
            <h3 className="mb-3 text-lg font-medium text-white">Ubicación</h3>
            <div className="aspect-video overflow-hidden rounded-[var(--radius-md)] bg-white/10">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d5000!2d-68.35!3d-34.61!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x512d762d804a6c4!2sComplejo%20Ermitazh!5e0!3m2!1ses!2sar"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación de Cabañas Ermitazh"
              />
            </div>
            <a
              href={GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-sm text-white/60 hover:text-white transition-colors"
            >
              Cómo llegar →
            </a>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-8 text-center text-xs text-white/40">
          &copy; {new Date().getFullYear()} {COMPLEJO.nombre}. Todos los
          derechos reservados.
        </div>
      </div>
    </footer>
  );
}
