"use client";

/* =========================================
   IMPORTACIONES
   ========================================= */

   import { Swiper, SwiperSlide } from "swiper/react";
   import { Autoplay, Pagination, Navigation } from "swiper/modules";
   import { Search, Heart, User, ShoppingBag } from "lucide-react";


import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { useState } from "react";
import { useEffect, useRef } from "react";
   


/* =========================================
   MENU DATA (contenido dinámico del mega menu)
   ========================================= */

const menuData = {
  Tienda: {
    col1: { title: "Categoría", items: ["Kits profesionales", "Acrílicos", "Gel UV", "Decoración"] },
    col2: { title: "Más", items: ["Ofertas", "Nuevos productos", "Más vendidos"] },
    col3: { title: "Explorar", items: ["Guía de compra", "Colecciones", "Inspiración"] }
  },
  Cursos: {
    col1: { title: "Cursos", items: ["Curso básico", "Curso avanzado", "Masterclass"] },
    col2: { title: "Certificaciones", items: ["Certificado profesional", "Especialización"] },
    col3: { title: "Aprender", items: ["Tips", "Técnicas", "Tutoriales"] }
  },
  Servicios: {
    col1: { title: "Servicios", items: ["Aplicación de uñas", "Retoque", "Diseño personalizado"] },
    col2: { title: "Citas", items: ["Reservar cita", "Disponibilidad"] },
    col3: { title: "Studio", items: ["Ubicación", "Horarios", "Contacto"] }
  }
};

/* =========================================
   HOME PAGE
   ========================================= */

   export default function Home() {

    const [searchOpen, setSearchOpen] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
  
    const searchRef = useRef<HTMLDivElement>(null);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    useEffect(() => {

      function handleMouseLeavePage(e: MouseEvent) {
        if (e.clientY <= 0 || e.clientX <= 0) {
          setActiveMenu(null);
        }
      }
      
      document.addEventListener("mouseleave", handleMouseLeavePage);
      
      return () => {
        document.removeEventListener("mouseleave", handleMouseLeavePage);
      };
      
      }, []);


    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (
          searchRef.current &&
          !searchRef.current.contains(event.target as Node)
        ) {
          setSearchOpen(false);
        }
      }
  
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    const currentMenu =
      activeMenu ? menuData[activeMenu as keyof typeof menuData] : null;

    return (
    <main className="min-h-screen bg-white text-black">
      {/* =========================================
    HEADER PRO
========================================= */}

 {/* =========================================
    iNICIO DEL WRAPPER
========================================= */}
<div
className="relative"
onMouseLeave={() => {
  setTimeout(() => setActiveMenu(null), 180);
}}
>

<header className="w-full sticky top-0 bg-white z-50 px-6">
<div className="max-w-[1400px] mx-auto grid grid-cols-[1fr_auto_1fr] items-center py-3">  
  {/* LEFT SIDE */}
  <div className="flex items-center gap-8 justify-start">
    

    {/* NAV LINKS */}
    <nav className="hidden md:flex gap-13 text-[16px] tracking-[0.06em] capitalize font-medium">

{["Tienda","Cursos","Servicios"].map((item)=>(
<div
 key={item}
 onMouseEnter={()=>setActiveMenu(item)}
>
<a className="relative group text-[13px] tracking-[0.05em] text-[var(--foreground)]">

<span className="transition-colors duration-200 group-hover:text-[#C6A75E]">
{item}
</span>

<span className="absolute left-0 -bottom-1 h-[1px] w-0 bg-[#C6A75E] transition-all duration-200 group-hover:w-full"></span>

</a>
</div>
))}

<div
className={`
  absolute left-0 top-full w-full z-40
  bg-white
  transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)]
  ${activeMenu ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3 pointer-events-none"}
`}
>

<div
key={activeMenu}
className="max-w-[1400px] mx-auto px-6 py-14 grid grid-cols-3 gap-20 transition-all duration-300 ease-out"
>

<div className={`transition-all duration-500 ease-out ${activeMenu ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
<p className="text-gray-400 text-sm mb-6">
{currentMenu?.col1.title}
</p>

<ul className="space-y-3 text-[18px]">
{currentMenu?.col1?.items?.map((item)=>(
<li key={item} className="hover:text-[#C6A75E] cursor-pointer">
{item}
</li>
))}
</ul>
</div>

<div className={`transition-all duration-500 delay-150 ease-out ${activeMenu ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
<p className="text-gray-400 text-sm mb-6">
{currentMenu?.col2.title}
</p>
<ul className="space-y-3 text-[18px]">
{currentMenu?.col2?.items?.map((item) => (
<li key={item} className="hover:text-[#C6A75E] cursor-pointer">{item}</li>
))}
</ul>
</div>

<div className={`transition-all duration-500 delay-300 ease-out ${activeMenu ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
<p className="text-gray-400 text-sm mb-6">
{currentMenu?.col3.title}
</p>
<ul className="space-y-3 text-[18px]">
{currentMenu?.col3?.items?.map((item) => (
<li key={item} className="hover:text-[#C6A75E] cursor-pointer">{item}</li>
))}
</ul>
</div>

</div>

</div>



      

    </nav>

  </div>

  {/* CENTER - LOGO */}
  <div className="flex flex-col items-center font-serif leading-tight w-fit mx-auto">

<div className="self-start text-[28px] tracking-[0.12em]">
  Liz Cabriales
</div>



<div className="self-end text-[12px] tracking-[0.30em] uppercase text-[#C6A75E]">
  STUDIO
</div>

</div>

  {/* RIGHT SIDE */}
  <div className="flex items-center justify-end gap-10  ">
{/* SEARCH */}
<div ref={searchRef} className="relative flex items-center">

  <div
    className={`absolute right-8 transition-all duration-300 overflow-hidden ${
      searchOpen ? "w-48 opacity-100" : "w-0 opacity-0"
    }`}
  >
    <input
      type="text"
      placeholder="Buscar productos"
      className="w-full border-b border-gray-300 outline-none text-sm bg-transparent placeholder-gray-400"
    />
  </div>

  <Search
    className="w-5 h-5 cursor-pointer hover:text-[#C6A75E] transition-colors"
    onClick={() => setSearchOpen(!searchOpen)}
  />

</div>

{/* USER */}
<User className="w-5 h-5 cursor-pointer hover:text-[#C6A75E] transition-colors" />

{/* FAVORITES */}
<Heart className="w-5 h-5 cursor-pointer hover:text-[#C6A75E] transition-colors" />

{/* CART */}
<div className="relative cursor-pointer" onClick={() => setCartOpen(true)}>
  <ShoppingBag className="w-5 h-5 hover:text-[#C6A75E] transition-colors" />
  <span className="absolute -top-2 -right-2 bg-[#C6A75E] text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
    0
  </span>
</div>

</div>
</div>


</header>

<div
 className={`fixed inset-0 top-[60px] backdrop-blur-md bg-black/10 z-30 transition-opacity duration-300 ${
   activeMenu ? "opacity-100" : "opacity-0 pointer-events-none"
 }`}
 onMouseEnter={() => setActiveMenu(null)}
></div>

</div>
      {/* =========================================
          HERO SLIDER
         ========================================= */}
      <section className="h-[80vh] px-6">
  <div className="h-full max-w-[1400px]  mx-auto rounded-md overflow-hidden">

    <Swiper
      modules={[Autoplay, Pagination, Navigation]}
      autoplay={{ delay: 4000 }}
      loop={true}
      pagination={{ clickable: true }}
      navigation
      speed={900}
      className="h-full"
    >

      {/* SLIDE 1 */}
      <SwiperSlide>
        <div className="relative h-full">
          <img
            src="https://images.unsplash.com/photo-1604654894610-df63bc536371"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30"></div>

          <div className="relative z-10 h-full flex flex-col items-center justify-center text-white text-center px-6">
            <h2 className="text-4xl font-light tracking-wide">
              Kits Profesionales
            </h2>
            <div className="w-16 h-[1px] bg-[#C6A75E] mt-6"></div>
            <button className="mt-10 px-8 py-3 border border-white hover:border-[#C6A75E] hover:text-[#C6A75E] transition-all">
              Comprar ahora
            </button>
          </div>
        </div>
      </SwiperSlide>

      {/* SLIDE 2 */}
      <SwiperSlide>
        <div className="relative h-full">
          <img
            src="https://images.unsplash.com/photo-1583001809873-a128495da465"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30"></div>

          <div className="relative z-10 h-full flex flex-col items-center justify-center text-white text-center px-6">
            <h2 className="text-4xl font-light tracking-wide">
              Masterclass Nacional
            </h2>
            <div className="w-16 h-[1px] bg-[#C6A75E] mt-6"></div>
            <button className="mt-10 px-8 py-3 border border-white hover:border-[#C6A75E] hover:text-[#C6A75E] transition-all">
              Ver detalles
            </button>
          </div>
        </div>
      </SwiperSlide>

      {/* SLIDE 3 */}
      <SwiperSlide>
        <div className="relative h-full">
          <img
            src="https://images.unsplash.com/photo-1596704017254-9756e98c3c54"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30"></div>

          <div className="relative z-10 h-full flex flex-col items-center justify-center text-white text-center px-6">
            <h2 className="text-4xl font-light tracking-wide">
              Envíos a toda la República
            </h2>
            <div className="w-16 h-[1px] bg-[#C6A75E] mt-6"></div>
            <button className="mt-10 px-8 py-3 border border-white hover:border-[#C6A75E] hover:text-[#C6A75E] transition-all">
              Explorar productos
            </button>
          </div>
        </div>
      </SwiperSlide>

    </Swiper>

  </div>
</section>

    </main>
  ); 
}