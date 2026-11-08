import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

// Inter es la familia del sistema de diseño en Figma. `variable` la expone como
// custom property para poder consumirla desde los CSS Modules.
const inter = Inter({
  variable: "--fuente-inter",
  subsets: ["latin"],
  display: "swap",
});

// Roboto Mono es la familia del estilo «DAFI/Mono» de Figma: se usa para los
// códigos de las preguntas de contexto (G1, P2, F1…) y para los códigos de error.
const robotoMono = Roboto_Mono({
  variable: "--fuente-mono-roboto",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DAFI — Conversaciones de salud en familia",
  description:
    "DAFI ordena las conversaciones de salud de una familia con los médicos que ya conoce. No diagnostica ni atiende emergencias.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  // lang="es" es obligatorio para que el lector de pantalla use la voz y las
  // reglas de pronunciación correctas (WCAG 3.1.1). El scaffold traía "en".
  return (
    <html lang="es" className={`${inter.variable} ${robotoMono.variable}`}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
