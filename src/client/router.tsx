import React from "react";
import { createHashRouter } from "react-router";

import { Layout } from "./layout";
import { Home, loadIncidents } from "./routes/home";
import { About } from "./routes/about";
import { ErrorPage } from "./error";

export const router = createHashRouter([
    {
        path: "/",
        element: <Layout />,
        errorElement: <ErrorPage />,
        children: [
            {
                index: true,
                loader: loadIncidents,
                element: <Home />,
                errorElement: <ErrorPage />,
            },
            {
                path: "/about",
                element: <About />,
                errorElement: <ErrorPage />,
            },
            {
                path: "/not-found",
                element: <h1>Not Found</h1>,
            }
        ]
    }
]);