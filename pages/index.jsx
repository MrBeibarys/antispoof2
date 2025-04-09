import { Webcamera } from "../components/front-end/home-page";
import { Header } from "../components/front-end/header";

export default function HomePage() {
  return (
    <div className="bg-gray-100 min-h-screen">
      <Header />
      <Webcamera className="mt-4"/>
    </div>
  );
}
