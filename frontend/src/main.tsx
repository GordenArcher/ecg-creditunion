import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { router } from "./routes/routes.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: "#171717",
          // background: "#000000",
          border: "1px solid #000",
          color: "#fff",
        },
        duration: 3000,
      }}
    />
  </StrictMode>,
);
