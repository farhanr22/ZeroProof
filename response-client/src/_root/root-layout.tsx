
import { Outlet } from "react-router-dom";

import NavBar from "../components/NavBar";

const RootLayout = () => {
  return (
    <div className="h-full w-full p-2">
      <NavBar />
      <div className="mb-4 pt-18 md:pt-22">
        <Outlet />
      </div>
      {/* <Footer /> */}
    </div>
  );
};

export default RootLayout;
