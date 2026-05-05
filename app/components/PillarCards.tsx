import Image from "next/image";
import Link from "next/link";

import { pillarTextColumnWidthClass } from "./pillarTextColumn";

type RowImage = { src: string; alt: string };

/** py-[1cm]: ~1 cm menos de foto arriba y abajo (bandas del fondo de la página). */
const imageCardClass =
  "relative box-border h-[220px] w-full min-w-0 shrink-0 py-[1cm] sm:h-[240px] lg:h-full lg:min-h-0 lg:flex-1";

const imageSizesRow =
  "(max-width: 1023px) 30vw, 22vw";

type PromoSection = {
  label: string | null;
  headline: string;
  description: string;
  href: string;
  cta: string;
  textAlign: "left" | "right";
  imagesAlign: "left" | "right";
  images: RowImage[];
  mediaGroupId?: string;
  mediaTypes?: ("video" | "before-after")[];
};

const promoSections: PromoSection[] = [
  {
    label: "Distribuidora",
    headline: "Los mejores productos, en un solo lugar.",
    description:
      "Distribuidoras oficiales de Exotic, Lovely, Manikure Pro, Golden Nails, Miss Nails, Cardone, Lúa, Mia Secret y más. Envíos a todo México con stock real y garantía de autenticidad.",
    href: "/tienda",
    cta: "Ver Tienda",
    textAlign: "left",
    imagesAlign: "right",
    images: [
      {
        src: "https://picsum.photos/seed/nails1/400/600",
        alt: "Productos 1",
      },
      {
        src: "https://picsum.photos/seed/nails2/400/600",
        alt: "Productos 2",
      },
      {
        src: "https://picsum.photos/seed/nails3/400/600",
        alt: "Productos 3",
      },
    ],
  },
  {
    label: "ACADEMIA",
    headline: "Formación de alto nivel, donde tú estés.",
    description:
      "Cursos presenciales impartidos por masters nacionales e internacionales. Desde nivel principiante hasta avanzado. Todo incluido: certificado, coffee break, comida y material de marca.",
    href: "/academia",
    cta: "Ver Academia",
    textAlign: "right",
    imagesAlign: "left",
    images: [
      {
        src: "https://picsum.photos/seed/academia1/400/600",
        alt: "Academia 1",
      },
      {
        src: "https://picsum.photos/seed/academia2/400/600",
        alt: "Academia 2",
      },
      {
        src: "https://picsum.photos/seed/academia3/400/600",
        alt: "Academia 3",
      },
    ],
  },
  {
    label: "SERVICIOS",
    headline: "Quiropodia y uñas profesionales, con quien más sabe.",
    description:
      "Atención especializada en quiropodia, reconstrucción ungueal, pedicure spa y tratamientos. Agenda tu cita directamente desde el sitio.",
    href: "/citas",
    cta: "VER SERVICIOS",
    textAlign: "left",
    imagesAlign: "right",
    mediaGroupId: "services-media-grid",
    mediaTypes: ["video", "before-after", "before-after"],
    images: [
      {
        src: "https://picsum.photos/seed/nails1/400/600",
        alt: "Servicios — placeholder 1",
      },
      {
        src: "https://picsum.photos/seed/nails2/400/600",
        alt: "Servicios — placeholder 2",
      },
      {
        src: "https://picsum.photos/seed/nails3/400/600",
        alt: "Servicios — placeholder 3",
      },
    ],
  },
];

function ImageCard({
  img,
  mediaType,
}: {
  img: RowImage;
  mediaType?: "video" | "before-after";
}) {
  return (
    <div
      className={imageCardClass}
      {...(mediaType !== undefined ? { "data-media-type": mediaType } : {})}
    >
      <div className="relative h-full min-h-0 w-full overflow-hidden rounded-2xl">
        <Image
          src={img.src}
          alt={img.alt}
          width={400}
          height={600}
          className="h-full w-full object-cover"
          sizes={imageSizesRow}
        />
      </div>
    </div>
  );
}

function TextCard({
  section,
  alignEnd,
  className = "",
}: {
  section: PromoSection;
  alignEnd: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex min-h-[360px] flex-col justify-center gap-6 rounded-none bg-white p-6 shadow-sm sm:p-8 sm:min-h-[400px] lg:aspect-square lg:min-h-0 ${pillarTextColumnWidthClass} ${
        alignEnd ? "items-end text-right" : "items-start text-left"
      } ${className}`}
    >
      {section.label && (
        <span className="block font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--gold)]">
          {section.label}
        </span>
      )}
      <h2 className="text-[clamp(1.5rem,2.2vw,2.375rem)] font-bold leading-[1.12] text-pretty text-brand-black [font-family:var(--font-cormorant-garamond),Georgia,serif]">
        {section.headline}
      </h2>
      <p className="text-[13px] leading-[1.75] text-[#4A4A47]">{section.description}</p>
      <Link
        href={section.href}
        className="w-fit font-sans text-[10px] uppercase tracking-[0.2em] text-brand-black underline decoration-1 underline-offset-4 transition-colors hover:text-[var(--gold)]"
      >
        {section.cta}
      </Link>
    </div>
  );
}

function ImageRow({
  section,
  className,
}: {
  section: PromoSection;
  className?: string;
}) {
  return (
    <div
      id={section.mediaGroupId}
      className={`grid grid-cols-3 gap-2 sm:gap-3 lg:flex lg:min-h-0 lg:flex-1 lg:gap-3 ${className ?? ""}`}
    >
      {section.images.map((img, i) => (
        <ImageCard
          key={`${img.src}-${i}`}
          img={img}
          mediaType={section.mediaTypes?.[i]}
        />
      ))}
    </div>
  );
}

export default function PillarCards() {
  return (
    <section
      aria-label="Pilares de la marca"
      className="w-full space-y-10 lg:space-y-12"
    >
      {promoSections.map((section) => {
        const isRightText = section.textAlign === "right";
        const imagesFirst = section.imagesAlign === "left";

        return (
          <article
            key={section.href}
            className="flex w-full min-h-0 flex-col gap-3 sm:gap-4 lg:flex-row lg:items-stretch lg:gap-3"
          >
            {imagesFirst ? (
              <>
                <ImageRow
                  section={section}
                  className="order-1 lg:order-none"
                />
                <TextCard
                  section={section}
                  alignEnd={isRightText}
                  className="order-2 lg:order-none"
                />
              </>
            ) : (
              <>
                <TextCard
                  section={section}
                  alignEnd={isRightText}
                  className="order-1 lg:order-none"
                />
                <ImageRow
                  section={section}
                  className="order-2 lg:order-none"
                />
              </>
            )}
          </article>
        );
      })}
    </section>
  );
}
