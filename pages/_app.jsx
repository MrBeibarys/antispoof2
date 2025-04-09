import clsx from "clsx";
import "../styles/globals.css";
import { Inter } from "next/font/google"
const inter = Inter({ subsets: ["latin", "cyrillic"] });

export default function App({ Component, pageProps }) {
  return <div className={clsx(inter.className)}><Component {...pageProps} /></div>
}
