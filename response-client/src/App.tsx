import Home from "./_root/pages/home";
import Feedback from "./_root/pages/feedback";
import Response from "./_root/pages/response";
import { Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import RootLayout from "./_root/root-layout";

export default function App() {
  return (
    <main className="flex min-h-screen antialiased">
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/feedback/:id" element={<Feedback />} />
          <Route path="/response/:id" element={<Response />} />
        </Route>
      </Routes>
      <Toaster richColors />
    </main>
  );
}
